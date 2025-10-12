"""
W&B Weave Evaluation API using proper Evaluation framework
Run with: python3 evaluate_api.py
"""
import os
import re
import json
import weave
from weave import Evaluation, Model
import asyncio
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Initialize Weave
weave.init('shrinked-ai/craig-evaluation')

# Define scoring functions using @weave.op()
@weave.op()
def context_utilization_scorer(expected: str, output: dict) -> dict:
    """Score 0-100 based on context integration"""
    text = output.get('response', '')
    has_context = output.get('has_context', False)

    if not has_context:
        return {"context_score": 0, "citations": 0, "names": 0}

    score = 0
    citations = re.findall(r'\[(\d+)\]', text)
    score += min(len(citations) * 10, 50)

    names = re.findall(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', text)
    score += min(len(names) * 5, 25)

    dates = re.findall(r'\b\d{4}\b', text)
    score += min(len(dates) * 3, 15)

    return {
        "context_score": min(score, 100),
        "citations": len(citations),
        "names": len(names),
        "dates": len(dates)
    }

@weave.op()
def evidence_density_scorer(expected: str, output: dict) -> dict:
    """Count specific evidence citations"""
    text = output.get('response', '')

    citations = re.findall(r'\[(\d+)\]', text)
    statistics = re.findall(r'\b\d+(?:\.\d+)?(?:\s?%|,\d+|\s+people)\b', text)

    score = min(len(citations) * 10 + len(statistics) * 5, 100)

    return {
        "evidence_score": score,
        "citations": len(citations),
        "statistics": len(statistics)
    }

@weave.op()
def specificity_scorer(expected: str, output: dict) -> dict:
    """Measure concrete details vs vague language"""
    text = output.get('response', '')

    vague = ['some', 'many', 'often', 'generally', 'it depends', 'multiple perspectives']
    vague_count = sum(len(re.findall(r'\b' + re.escape(word) + r'\b', text, re.IGNORECASE)) for word in vague)

    numbers = re.findall(r'\b\d+(?:,\d+)*(?:\.\d+)?\b', text)
    specific_count = len(numbers)

    score = 50 + (specific_count * 5) - (vague_count * 8)

    return {
        "specificity_score": max(0, min(score, 100)),
        "vague_terms": vague_count,
        "specific_terms": specific_count
    }

@weave.op()
def authenticity_scorer(expected: str, output: dict) -> dict:
    """Measure genuine voice vs corporate neutrality"""
    text = output.get('response', '')

    authentic_words = ['fuck', 'shit', 'damn', 'clusterfuck', 'bullshit', 'ridiculous', 'absurd']
    authentic_count = sum(len(re.findall(r'\b' + re.escape(word) + r'\b', text, re.IGNORECASE)) for word in authentic_words)

    corporate_words = ['balanced', 'nuanced', 'complex issue', 'however', 'on the other hand']
    corporate_count = sum(len(re.findall(r'\b' + re.escape(word) + r'\b', text, re.IGNORECASE)) for word in corporate_words)

    score = (authentic_count * 15) - (corporate_count * 10)

    return {
        "authenticity_score": max(0, min(score, 100)),
        "authentic_markers": authentic_count,
        "corporate_markers": corporate_count
    }

# Create a Model class for evaluation
class ResponseEvaluator(Model):
    """Model wrapper for evaluating AI responses"""

    @weave.op()
    async def predict(self, question: str, response: str, has_context: bool) -> dict:
        """Predict method required by Weave Model"""
        return {
            "response": response,
            "has_context": has_context,
            "question": question
        }

# Create global evaluation object
evaluation = Evaluation(
    dataset=[],  # Will be populated dynamically
    scorers=[
        context_utilization_scorer,
        evidence_density_scorer,
        specificity_scorer,
        authenticity_scorer
    ]
)

async def evaluate_response_async(question: str, response: str, model: str, has_context: bool):
    """Run evaluation asynchronously"""
    # Create a temporary dataset with this single example
    example = {
        "question": question,
        "response": response,
        "expected": "",  # Not used in scoring but required
        "has_context": has_context
    }

    # Create evaluator model
    evaluator = ResponseEvaluator()

    # Create evaluation with single example
    eval_obj = Evaluation(
        dataset=[example],
        scorers=[
            context_utilization_scorer,
            evidence_density_scorer,
            specificity_scorer,
            authenticity_scorer
        ]
    )

    # Run evaluation
    result = await eval_obj.evaluate(evaluator)

    # Extract scores from result
    scores = {}
    if hasattr(result, 'rows') and len(result.rows) > 0:
        row = result.rows[0]
        scores = {
            "context": row.get('context_score', 0),
            "evidence": row.get('evidence_score', 0),
            "specificity": row.get('specificity_score', 0),
            "authenticity": row.get('authenticity_score', 0)
        }

    overall = sum(scores.values()) / len(scores) if scores else 0

    return {
        "model": model,
        "overall_score": round(overall, 2),
        "metrics": scores,
        "word_count": len(response.split())
    }

class EvaluationHandler(BaseHTTPRequestHandler):
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
            response = data.get('response', '')
            model = data.get('model', 'unknown')
            has_context = data.get('has_context', False)

            # Run async evaluation
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(
                evaluate_response_async(question, response, model, has_context)
            )
            loop.close()

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps(result).encode('utf-8'))

        except Exception as e:
            print(f"Error: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            error_response = {
                "error": str(e),
                "message": "Evaluation failed"
            }
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

def run_server(port=8080):
    server_address = ('', port)
    httpd = HTTPServer(server_address, EvaluationHandler)
    print(f'Starting W&B Weave Evaluation API on port {port}...')
    print(f'Weave dashboard: https://wandb.ai/shrinked-ai/craig-evaluation')
    httpd.serve_forever()

if __name__ == '__main__':
    run_server(8080)
