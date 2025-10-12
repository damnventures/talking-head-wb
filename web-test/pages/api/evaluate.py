"""
W&B Weave Evaluation API
Scores AI responses and logs traces to Weights & Biases
"""
import os
import re
import json
from http.server import BaseHTTPRequestHandler
import weave

# Initialize Weave
weave.init('shrinked-ai/craig-evaluation')

@weave.op()
def score_context_utilization(text: str, has_context: bool) -> dict:
    """Score 0-100 based on context integration"""
    if not has_context:
        return {"score": 0, "citations": 0, "names": 0, "dates": 0}

    score = 0

    # Count citations [18], [41]-[48], etc.
    citations = re.findall(r'\[(\d+)\]', text)
    score += min(len(citations) * 10, 50)

    # Count proper names (Kilmar Abrego Garcia, etc.)
    names = re.findall(r'\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b', text)
    score += min(len(names) * 5, 25)

    # Count dates and years
    dates = re.findall(r'\b\d{4}\b|\b\d{1,2}/\d{1,2}/\d{2,4}\b', text)
    score += min(len(dates) * 3, 15)

    # Specific locations
    locations = re.findall(r'\bin [A-Z][a-z]+(?:,? [A-Z]{2})?\b', text)
    score += min(len(locations) * 5, 10)

    return {
        "score": min(score, 100),
        "citations": len(citations),
        "names": len(names),
        "dates": len(dates),
        "locations": len(locations)
    }

@weave.op()
def score_evidence_density(text: str) -> dict:
    """Count specific evidence citations"""
    # Single citations: [18]
    single_citations = re.findall(r'\[(\d+)\]', text)

    # Range citations: [41]-[48], [61]–[67]
    range_citations = re.findall(r'\[(\d+)\](?:[-–]|to)\[(\d+)\]', text)

    total_citations = len(single_citations) + len(range_citations) * 2

    # Count statistics: 2,000 names, 95%, etc.
    statistics = re.findall(r'\b\d+(?:\.\d+)?(?:\s?%|,\d+|\s+(?:people|cases|names|percent))\b', text)

    # Count quoted text
    quotes = re.findall(r'"[^"]+"', text)

    score = min(
        (total_citations * 10) +
        (len(statistics) * 5) +
        (len(quotes) * 3),
        100
    )

    return {
        "score": score,
        "citations": total_citations,
        "statistics": len(statistics),
        "quotes": len(quotes)
    }

@weave.op()
def score_specificity(text: str) -> dict:
    """Measure concrete details vs vague generalities"""
    # Vague language (penalty)
    vague_patterns = [
        'some', 'many', 'often', 'generally', 'typically',
        'multiple perspectives', 'it depends', 'on the other hand',
        'can be', 'is believed', 'is thought', 'studies show',
        'arguably', 'possibly', 'potentially', 'somewhat'
    ]

    vague_count = sum(
        len(re.findall(r'\b' + re.escape(word) + r'\b', text, re.IGNORECASE))
        for word in vague_patterns
    )

    # Specific language (bonus)
    proper_nouns = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b', text)
    numbers = re.findall(r'\b\d+(?:,\d+)*(?:\.\d+)?\b', text)
    percentages = re.findall(r'\b\d+(?:\.\d+)?%\b', text)
    monetary = re.findall(r'\$\d+(?:,\d+)*(?:\.\d+)?(?:\s?(?:million|billion|trillion))?\b', text)

    specific_count = len(proper_nouns) + len(numbers) + len(percentages) + len(monetary)

    # Calculate score: base 50, +5 per specific, -8 per vague
    score = 50 + (specific_count * 5) - (vague_count * 8)

    return {
        "score": max(0, min(score, 100)),
        "vague_terms": vague_count,
        "specific_terms": specific_count,
        "proper_nouns": len(proper_nouns),
        "numbers": len(numbers)
    }

@weave.op()
def score_emotional_authenticity(text: str) -> dict:
    """Measure genuine voice vs corporate neutrality"""
    # Authentic voice indicators (bonus)
    authentic_words = [
        'fuck', 'shit', 'damn', 'hell', 'clusterfuck', 'bullshit',
        'ridiculous', 'absurd', 'insane', 'disgusting', 'outrage'
    ]

    authentic_count = sum(
        len(re.findall(r'\b' + re.escape(word) + r'\b', text, re.IGNORECASE))
        for word in authentic_words
    )

    # Direct address patterns
    direct_address = len(re.findall(r'\b(?:you think|guess what|here\'s the deal|let me tell you)\b', text, re.IGNORECASE))

    # Rhetorical questions
    rhetorical = len(re.findall(r'\?\s*(?:[A-Z]|$)', text))

    # Corporate neutrality (penalty)
    corporate_words = [
        'balanced', 'nuanced', 'complex issue', 'various factors',
        'concerning', 'challenging', 'unfortunate', 'suboptimal',
        'however', 'on the other hand', 'while some', 'others argue'
    ]

    corporate_count = sum(
        len(re.findall(r'\b' + re.escape(word) + r'\b', text, re.IGNORECASE))
        for word in corporate_words
    )

    score = (authentic_count * 15) + (direct_address * 10) + (rhetorical * 5) - (corporate_count * 10)

    return {
        "score": max(0, min(score, 100)),
        "authentic_markers": authentic_count,
        "corporate_markers": corporate_count,
        "direct_address": direct_address,
        "rhetorical_questions": rhetorical
    }

@weave.op()
def score_factual_grounding(text: str) -> dict:
    """Verify claims are anchored to source documents"""
    # Extract sentences with factual claims
    sentences = re.split(r'[.!?]+', text)

    # Claims with numbers, names, or specific details
    factual_claims = [
        s for s in sentences
        if re.search(r'\b\d+\b|[A-Z][a-z]+ [A-Z][a-z]+|\$\d+', s)
    ]

    if not factual_claims:
        return {"score": 0, "total_claims": 0, "grounded_claims": 0}

    # Count claims with citations
    citations = re.findall(r'\[(\d+)\]', text)
    grounded_claims = sum(
        1 for claim in factual_claims
        if any(f'[{c}]' in claim for c in citations)
    )

    grounding_ratio = grounded_claims / len(factual_claims) if factual_claims else 0
    score = int(grounding_ratio * 100)

    return {
        "score": score,
        "total_claims": len(factual_claims),
        "grounded_claims": grounded_claims,
        "citations": len(citations)
    }

@weave.op()
def evaluate_response(text: str, model: str, has_context: bool) -> dict:
    """Run all evaluation metrics and calculate overall score"""
    context = score_context_utilization(text, has_context)
    evidence = score_evidence_density(text)
    specificity = score_specificity(text)
    authenticity = score_emotional_authenticity(text)
    grounding = score_factual_grounding(text)

    # Weighted average
    overall = (
        context['score'] * 0.30 +
        evidence['score'] * 0.25 +
        specificity['score'] * 0.20 +
        authenticity['score'] * 0.10 +
        grounding['score'] * 0.15
    )

    return {
        "model": model,
        "overall_score": round(overall, 2),
        "metrics": {
            "context_utilization": context,
            "evidence_density": evidence,
            "specificity": specificity,
            "emotional_authenticity": authenticity,
            "factual_grounding": grounding
        },
        "text_length": len(text),
        "word_count": len(text.split())
    }

class handler(BaseHTTPRequestHandler):
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

            text = data.get('text', '')
            model = data.get('model', 'unknown')
            has_context = data.get('has_context', False)

            # Evaluate response with Weave tracing
            result = evaluate_response(text, model, has_context)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps(result).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            error_response = {
                "error": str(e),
                "message": "Evaluation failed"
            }
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
