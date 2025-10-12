"""
Minimal Robust W&B Weave Evaluator for Context-Aware AI
Following RAG tutorial pattern: https://weave-docs.wandb.ai/guides/integrations/rag/
"""
import os
import re
import json
import weave
from weave import Model, Evaluation
import asyncio
from http.server import HTTPServer, BaseHTTPRequestHandler

# Set WANDB API key before initialization
os.environ['WANDB_API_KEY'] = os.getenv('WANDB_API_KEY', 'f684e7f2a945f3b12d1d57352893e0e48d681bd9')

# Initialize Weave - tracks all @weave.op() decorated functions
weave.init('shrinked-ai/craig-evaluation')

# Scoring functions - each takes 'output' + dataset keys
@weave.op()
async def context_utilization_score(question: str, output: dict) -> dict:
    """Scores context integration: citations, names, dates"""
    text = output.get('response', '')
    has_context = output.get('has_context', False)

    if not has_context:
        return {"context_score": 0}

    score = 0
    citations = len(re.findall(r'\[(\d+)\]', text))
    names = len(re.findall(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', text))
    dates = len(re.findall(r'\b\d{4}\b', text))

    score += min(citations * 10, 50)
    score += min(names * 5, 25)
    score += min(dates * 3, 15)

    return {"context_score": min(score, 100)}

@weave.op()
async def evidence_density_score(question: str, output: dict) -> dict:
    """Counts citations and statistics"""
    text = output.get('response', '')
    citations = len(re.findall(r'\[(\d+)\]', text))
    statistics = len(re.findall(r'\b\d+(?:\.\d+)?(?:\s?%|,\d+)\b', text))

    score = min(citations * 10 + statistics * 5, 100)
    return {"evidence_score": score}

@weave.op()
async def specificity_score(question: str, output: dict) -> dict:
    """Measures concrete details vs vague language"""
    text = output.get('response', '')

    vague_patterns = ['some', 'many', 'often', 'generally', 'it depends']
    vague_count = sum(len(re.findall(r'\b' + word + r'\b', text, re.I)) for word in vague_patterns)

    specific_count = len(re.findall(r'\b\d+(?:,\d+)*\b', text))

    score = 50 + (specific_count * 5) - (vague_count * 8)
    return {"specificity_score": max(0, min(score, 100))}

@weave.op()
async def authenticity_score(question: str, output: dict) -> dict:
    """Measures raw voice vs corporate speak"""
    text = output.get('response', '')

    authentic_words = ['fuck', 'shit', 'damn', 'clusterfuck', 'bullshit', 'ridiculous', 'absurd']
    authentic_count = sum(len(re.findall(r'\b' + word + r'\b', text, re.I)) for word in authentic_words)

    corporate_words = ['balanced', 'nuanced', 'complex issue', 'however']
    corporate_count = sum(len(re.findall(r'\b' + word + r'\b', text, re.I)) for word in corporate_words)

    score = (authentic_count * 15) - (corporate_count * 10)
    return {"authenticity_score": max(0, min(score, 100))}

# Model class - wraps response for evaluation
class ResponseModel(Model):
    """Model that wraps AI responses for Weave evaluation"""

    @weave.op()
    async def predict(self, question: str) -> dict:
        """Predict is called by Evaluation - returns output dict"""
        # In real use, this would call OpenAI/Craig
        # Here we just pass through since we already have the response
        return {"response": "", "has_context": False}

# HTTP Server for API calls
class WeaveEvaluationHandler(BaseHTTPRequestHandler):
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

            # Create dataset with single example
            dataset = [{
                "question": question,
                "response": response_text,
                "has_context": has_context
            }]

            # Create model instance
            model = ResponseModel()

            # Override predict to return our data
            async def mock_predict(question: str) -> dict:
                return {"response": response_text, "has_context": has_context}

            model.predict = mock_predict

            # Create evaluation with all scorers
            evaluation = Evaluation(
                dataset=dataset,
                scorers=[
                    context_utilization_score,
                    evidence_density_score,
                    specificity_score,
                    authenticity_score
                ]
            )

            # Run evaluation
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(evaluation.evaluate(model))
            loop.close()

            # Extract scores from result
            scores = {}
            if hasattr(result, 'model_latency'):
                # Result structure varies, try to extract scores
                # For now, recalculate manually (Weave logs to dashboard)
                loop2 = asyncio.new_event_loop()
                asyncio.set_event_loop(loop2)

                output = {"response": response_text, "has_context": has_context}

                context_result = loop2.run_until_complete(context_utilization_score(question, output))
                evidence_result = loop2.run_until_complete(evidence_density_score(question, output))
                specificity_result = loop2.run_until_complete(specificity_score(question, output))
                authenticity_result = loop2.run_until_complete(authenticity_score(question, output))

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
                "weave_url": "https://wandb.ai/shrinked-ai/craig-evaluation"
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps(response_data).encode('utf-8'))

            print(f"✓ Evaluated {model_name}: {overall:.1f}/100")

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
    httpd = HTTPServer(server_address, WeaveEvaluationHandler)
    print(f'')
    print(f'🔥 W&B Weave Evaluation API')
    print(f'')
    print(f'   Port: http://localhost:{port}')
    print(f'   Dashboard: https://wandb.ai/shrinked-ai/craig-evaluation')
    print(f'')
    print(f'   Scorers: Context, Evidence, Specificity, Authenticity')
    print(f'')
    httpd.serve_forever()

if __name__ == '__main__':
    # Set environment variable to limit parallel workers (avoid rate limits)
    os.environ['WEAVE_PARALLELISM'] = '3'

    run_server(8080)
