"""
W&B Weave Evaluator - Following Official Documentation Pattern
Reference: https://weave-docs.wandb.ai/guides/core-types/evaluations/
"""
import os
import re
import json
import weave
from weave import Model, Evaluation
import asyncio
from http.server import HTTPServer, BaseHTTPRequestHandler

# Set API key before init
os.environ['WANDB_API_KEY'] = os.getenv('WANDB_API_KEY', 'f684e7f2a945f3b12d1d57352893e0e48d681bd9')
os.environ['WEAVE_PARALLELISM'] = '3'

# Initialize Weave
weave.init('shrinked-ai/craig-evaluation')

# Scoring functions - MUST have 'output' keyword argument per docs
@weave.op()
async def context_utilization_scorer(question: str, output: dict) -> dict:
    """Score context integration based on citations, names, dates"""
    response_text = output.get('answer', '')
    has_context = output.get('has_context', False)

    if not has_context:
        return {
            "context_score": 0,
            "details": {
                "citations_count": 0,
                "names_count": 0,
                "dates_count": 0,
                "reason": "No context available (generic model)"
            }
        }

    # Citations like [18], [[38]], [41]-[48]
    citations = re.findall(r'\[+(\d+)\]+', response_text)
    citations_score = min(len(citations) * 10, 50)

    # Proper names
    names = re.findall(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', response_text)
    names_score = min(len(names) * 5, 25)

    # Dates/years
    dates = re.findall(r'\b\d{4}\b', response_text)
    dates_score = min(len(dates) * 3, 15)

    total_score = citations_score + names_score + dates_score

    return {
        "context_score": min(total_score, 100),
        "details": {
            "citations_count": len(citations),
            "citations_sample": citations[:5],  # First 5 citations
            "names_count": len(names),
            "names_sample": names[:3],  # First 3 names
            "dates_count": len(dates),
            "breakdown": {
                "from_citations": citations_score,
                "from_names": names_score,
                "from_dates": dates_score
            }
        }
    }

@weave.op()
async def evidence_density_scorer(question: str, output: dict) -> dict:
    """Count citations and statistics"""
    response_text = output.get('answer', '')

    citations = re.findall(r'\[+(\d+)\]+', response_text)
    statistics = re.findall(r'\b\d+(?:\.\d+)?(?:\s?%|,\d+)\b', response_text)

    score = min(len(citations) * 10 + len(statistics) * 5, 100)

    return {
        "evidence_score": score,
        "details": {
            "citations_count": len(citations),
            "statistics_count": len(statistics),
            "breakdown": {
                "from_citations": min(len(citations) * 10, 100),
                "from_statistics": min(len(statistics) * 5, 50)
            }
        }
    }

@weave.op()
async def specificity_scorer(question: str, output: dict) -> dict:
    """Measure concrete details vs vague language"""
    response_text = output.get('answer', '')

    vague_words = ['some', 'many', 'often', 'generally', 'it depends', 'multiple perspectives']
    vague_matches = []
    for word in vague_words:
        matches = re.findall(r'\b' + word + r'\b', response_text, re.I)
        vague_matches.extend(matches)

    specific_numbers = re.findall(r'\b\d+(?:,\d+)*\b', response_text)

    score = 50 + (len(specific_numbers) * 5) - (len(vague_matches) * 8)

    return {
        "specificity_score": max(0, min(score, 100)),
        "details": {
            "vague_terms_count": len(vague_matches),
            "specific_numbers_count": len(specific_numbers),
            "specific_numbers_sample": specific_numbers[:5],
            "penalty_from_vague": len(vague_matches) * 8,
            "bonus_from_specific": len(specific_numbers) * 5
        }
    }

@weave.op()
async def authenticity_scorer(question: str, output: dict) -> dict:
    """Measure authentic voice vs corporate speak"""
    response_text = output.get('answer', '')

    # Authentic voice patterns (profanity + conversational markers)
    authentic_profanity = ['fuck', 'shit', 'damn', 'clusterfuck', 'bullshit']
    authentic_conversational = ['huh', 'guess what', "here's the kicker", "let me check", "oh wait", "classic", "genius"]

    profanity_count = sum(len(re.findall(r'\b' + word + r'\b', response_text, re.I)) for word in authentic_profanity)
    conversational_count = sum(len(re.findall(re.escape(phrase), response_text, re.I)) for phrase in authentic_conversational)

    # Direct rhetorical questions
    rhetorical_questions = len(re.findall(r'\?\s*(?:[A-Z]|And|So)', response_text))

    # Bold text (shows emphasis)
    bold_text = len(re.findall(r'\*\*[^*]+\*\*', response_text))

    # Corporate neutrality (penalty)
    corporate_words = ['balanced', 'nuanced', 'complex issue', 'however', 'on the other hand', 'multiple perspectives']
    corporate_count = sum(len(re.findall(r'\b' + word + r'\b', response_text, re.I)) for word in corporate_words)

    # Scoring: profanity × 20, conversational × 10, rhetorical × 5, bold × 3, corporate penalty × -15
    score = (profanity_count * 20) + (conversational_count * 10) + (rhetorical_questions * 5) + (bold_text * 3) - (corporate_count * 15)

    return {
        "authenticity_score": max(0, min(score, 100)),
        "details": {
            "profanity_count": profanity_count,
            "conversational_count": conversational_count,
            "rhetorical_questions": rhetorical_questions,
            "bold_text_count": bold_text,
            "corporate_count": corporate_count,
            "conversational_samples": [phrase for phrase in authentic_conversational if re.search(re.escape(phrase), response_text, re.I)],
            "breakdown": {
                "from_profanity": profanity_count * 20,
                "from_conversational": conversational_count * 10,
                "from_rhetorical": rhetorical_questions * 5,
                "from_bold": bold_text * 3,
                "corporate_penalty": corporate_count * -15
            }
        }
    }

# Model class per docs
class AIResponseModel(Model):
    """Model wrapper for evaluation - stores response data"""
    response_text: str
    has_context: bool
    model_name: str = "unknown"
    word_count: int = 0
    char_count: int = 0

    @weave.op()
    async def predict(self, question: str) -> dict:
        """
        Predict method called by Evaluation.
        Returns output dict that scorers receive as 'output' parameter.
        """
        return {
            "answer": self.response_text,
            "has_context": self.has_context,
            "model_type": self.model_name,
            "metadata": {
                "word_count": self.word_count,
                "char_count": self.char_count,
                "question_length": len(question)
            }
        }

# HTTP Server
class WeaveHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress default logging

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            question = data.get('question', '')
            response_text = data.get('response', '')
            model_name = data.get('model', 'unknown')
            has_context = data.get('has_context', False)

            # Create dataset with single example (matches predict signature)
            dataset = [{
                "question": question,
                "has_context": has_context,
                "response_text": response_text
            }]

            # Create model instance with response data
            model = AIResponseModel(
                response_text=response_text,
                has_context=has_context
            )

            # Create evaluation - this will call model.predict() for each example
            evaluation = Evaluation(
                dataset=dataset,
                scorers=[
                    context_utilization_scorer,
                    evidence_density_scorer,
                    specificity_scorer,
                    authenticity_scorer
                ]
            )

            # Run evaluation (logs to Weave dashboard)
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(evaluation.evaluate(model))
            loop.close()

            # Extract scores from evaluation result
            scores = {
                "context": 0,
                "evidence": 0,
                "specificity": 0,
                "authenticity": 0
            }

            # Parse result to extract scores
            # Evaluation returns EvaluationResults with rows
            if hasattr(result, '__dict__'):
                result_dict = result.__dict__
                # Try to find scores in result
                for key, value in result_dict.items():
                    if 'context_score' in str(value):
                        try:
                            scores["context"] = int(re.search(r'context_score[\'"]:\s*(\d+)', str(value)).group(1))
                        except:
                            pass

            # Fallback: recalculate scores for response
            output = {"answer": response_text, "has_context": has_context}
            loop2 = asyncio.new_event_loop()
            asyncio.set_event_loop(loop2)

            context_result = loop2.run_until_complete(context_utilization_scorer(question, output))
            evidence_result = loop2.run_until_complete(evidence_density_scorer(question, output))
            specificity_result = loop2.run_until_complete(specificity_scorer(question, output))
            authenticity_result = loop2.run_until_complete(authenticity_scorer(question, output))

            scores = {
                "context": context_result.get("context_score", 0),
                "evidence": evidence_result.get("evidence_score", 0),
                "specificity": specificity_result.get("specificity_score", 0),
                "authenticity": authenticity_result.get("authenticity_score", 0)
            }

            loop2.close()

            overall = sum(scores.values()) / len(scores) if scores else 0

            response_data = {
                "model": model_name,
                "overall_score": round(overall, 2),
                "metrics": scores,
                "word_count": len(response_text.split()),
                "weave_url": "https://wandb.ai/shrinked-ai/craig-evaluation/weave"
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps(response_data).encode('utf-8'))

            print(f"✓ [{model_name}] {overall:.1f}/100 | CTX:{scores['context']} EVD:{scores['evidence']} SPC:{scores['specificity']} AUT:{scores['authenticity']}")

        except Exception as e:
            print(f"✗ Error: {e}")
            import traceback
            traceback.print_exc()

            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            error_response = {"error": str(e), "message": "Evaluation failed"}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

def run_server(port=8080):
    server_address = ('', port)
    httpd = HTTPServer(server_address, WeaveHandler)
    print('')
    print('🔥 W&B Weave Evaluation API')
    print('')
    print(f'   Port: http://localhost:{port}')
    print(f'   Dashboard: https://wandb.ai/shrinked-ai/craig-evaluation/weave')
    print('')
    print('   Scorers: Context, Evidence, Specificity, Authenticity')
    print('   All evaluations logged to W&B dashboard')
    print('')
    httpd.serve_forever()

if __name__ == '__main__':
    run_server(8080)
