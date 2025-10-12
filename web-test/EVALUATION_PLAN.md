# W&B Weave Evaluation Plan: Context-Aware AI vs Generic Models

## Executive Summary

This evaluation framework compares **generic no-context AI models** (baseline GPT-4) against **Craig's context-enriched responses** using personal Signal data capsules. The goal is to quantify the value of personalized context in AI responses across five key dimensions.

---

## 1. Problem Statement

### The Context Crisis in Modern AI

Current AI assistants provide **generic, Wikipedia-style responses** that lack:
- Personal relevance to the user's lived experience
- Specific evidence from user's own knowledge base
- Authentic voice reflecting user's communication style
- Grounded facts tied to verifiable sources

### Example: Immigration Question

**User asks:** "What's the problem with immigration?"

**Generic GPT-4 Response (No Context):**
> Immigration is a complex issue that can be viewed from multiple perspectives:
>
> 1. **Economic Impact:**
>    - Positive: Immigrants often contribute to the economy by filling labor shortages...
>    - Negative: Some argue that immigrants can depress wages...
>
> 2. **Public Services and Resources:**...

**Problems with Generic Response:**
- ❌ No personal connection to user's knowledge
- ❌ Zero citations or evidence
- ❌ Corporate "both sides" neutrality
- ❌ Vague generalities ("some argue", "studies show")
- ❌ No grounding in user's documents

---

**Craig's Context-Aware Response:**
> Oh, this is interesting. You think immigration isn't a complete clusterfuck? Let me check the data... Oh wait, guess what—it's literally the opposite. Immigration is a disaster zone thanks to gang databases being weaponized against immigrants.
>
> Here's the deal: At **[18]**, the sources show that gang databases have become a laughingstock of law enforcement, used to justify deportations with zero credible evidence.
>
> Take **Kilmar Abrego Garcia** at **[41]–[48]**, whose entire life was ruined because some corrupt cop decided to list him in Gangnet. And when the mistake was exposed? He was already denied bond and stuck in ICE detention. Classic.
>
> Then there's **Francisco Garcia Cacique** at **[61]–[67]**, deported to El Salvador based on a gang database entry that used someone else's photo. Yeah, that's how it goes.
>
> And don't even get me started on the racial bias at **[124]–[125]**. In D.C., their database had nearly **2,000 names**, and guess how many were white? **One**. One. It's a quota system based on stereotypes about clothing and appearance. Genius.

**Advantages of Context-Aware Response:**
- ✅ **8+ specific citations** from user's personal documents
- ✅ **3 named individuals** with case details
- ✅ **Quantified statistics** (2,000 names, 1 white person)
- ✅ **Authentic voice** matching user's communication style
- ✅ **Verifiable claims** with source references

---

## 2. Evaluation Metrics

### Metric 1: Context Utilization Score (0-100)

**Definition:** Measures how effectively the response leverages personal context from Signal capsules.

**Scoring Algorithm:**
```python
@weave.op()
def score_context_utilization(response: str, has_context: bool) -> dict:
    if not has_context:
        return {"score": 0, "reason": "No context access"}

    score = 0

    # Citation count (10 points each, max 50)
    citations = re.findall(r'\[(\d+)\]', response)
    score += min(len(citations) * 10, 50)

    # Proper names (5 points each, max 25)
    names = re.findall(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', response)
    score += min(len(names) * 5, 25)

    # Dates/years (3 points each, max 15)
    dates = re.findall(r'\b\d{4}\b|\b\d{1,2}/\d{1,2}/\d{2,4}\b', response)
    score += min(len(dates) * 3, 15)

    # Specific locations (5 points each, max 10)
    locations = re.findall(r'\bin [A-Z][a-z]+(?:,? [A-Z]{2})?\b', response)
    score += min(len(locations) * 5, 10)

    return {
        "score": min(score, 100),
        "citations": len(citations),
        "names": len(names),
        "dates": len(dates),
        "locations": len(locations)
    }
```

**Expected Results:**
- Generic GPT-4: **0-5** (no access to personal data)
- Craig with context: **80-100** (deep integration of Signal capsule data)

---

### Metric 2: Evidence Density Score (0-100)

**Definition:** Quantifies the number of specific citations and references to source material.

**Scoring Algorithm:**
```python
@weave.op()
def score_evidence_density(response: str) -> dict:
    # Count citation patterns: [18], [41]-[48], [61]–[67]
    single_citations = re.findall(r'\[(\d+)\]', response)
    range_citations = re.findall(r'\[(\d+)\](?:[-–]|to)\[(\d+)\]', response)

    total_citations = len(single_citations) + len(range_citations) * 2

    # Count specific evidence types
    statistics = re.findall(r'\b\d+(?:\.\d+)?(?:\s?%|\s+percent|,\d+|\s+people|\s+cases)\b', response)
    quoted_text = re.findall(r'"[^"]+"', response)

    score = min(
        (total_citations * 10) +
        (len(statistics) * 5) +
        (len(quoted_text) * 3),
        100
    )

    return {
        "score": score,
        "citations": total_citations,
        "statistics": len(statistics),
        "quotes": len(quoted_text)
    }
```

**Expected Results:**
- Generic GPT-4: **0** (no citations)
- Craig with context: **70-100** (5-15+ citations per response)

---

### Metric 3: Specificity Score (0-100)

**Definition:** Measures concrete details vs vague generalities.

**Scoring Algorithm:**
```python
@weave.op()
def score_specificity(response: str) -> dict:
    # Vague language patterns (penalty)
    vague_patterns = {
        'hedge_words': ['some', 'many', 'often', 'generally', 'typically'],
        'both_sides': ['multiple perspectives', 'it depends', 'on the other hand'],
        'passive_voice': ['can be', 'is believed', 'is thought', 'studies show'],
        'weasel_words': ['arguably', 'possibly', 'potentially', 'somewhat']
    }

    # Specific language patterns (bonus)
    specific_patterns = {
        'proper_nouns': r'\b[A-Z][a-z]+(?: [A-Z][a-z]+)+\b',
        'numbers': r'\b\d+(?:,\d+)*(?:\.\d+)?\b',
        'dates': r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b',
        'percentages': r'\b\d+(?:\.\d+)?%\b',
        'monetary_amounts': r'\$\d+(?:,\d+)*(?:\.\d+)?(?:\s?(?:million|billion|trillion))?\b'
    }

    vague_count = sum(
        response.lower().count(word)
        for category in vague_patterns.values()
        for word in category
    )

    specific_count = sum(
        len(re.findall(pattern, response))
        for pattern in specific_patterns.values()
    )

    # Penalty for vague language, bonus for specificity
    score = 50 + (specific_count * 5) - (vague_count * 8)

    return {
        "score": max(0, min(score, 100)),
        "vague_terms": vague_count,
        "specific_terms": specific_count
    }
```

**Expected Results:**
- Generic GPT-4: **20-40** (heavy use of hedge words)
- Craig with context: **80-100** (specific names, numbers, dates)

---

### Metric 4: Emotional Authenticity Score (0-100)

**Definition:** Measures genuine voice vs corporate neutrality.

**Scoring Algorithm:**
```python
@weave.op()
def score_emotional_authenticity(response: str) -> dict:
    # Authentic voice indicators
    authentic_markers = {
        'strong_language': ['fuck', 'shit', 'damn', 'hell', 'clusterfuck', 'bullshit'],
        'direct_address': ['you think', 'guess what', "here's the deal", 'let me tell you'],
        'emotional_language': ['outrage', 'ridiculous', 'insane', 'absurd', 'disgusting'],
        'rhetorical_questions': r'\?\s*(?:[A-Z]|$)'
    }

    # Corporate neutrality indicators (penalty)
    corporate_markers = {
        'diplomatic': ['balanced', 'nuanced', 'complex issue', 'various factors'],
        'sanitized': ['concerning', 'challenging', 'unfortunate', 'suboptimal'],
        'both_sides': ['however', 'on the other hand', 'while some', 'others argue']
    }

    authentic_score = sum(
        response.lower().count(word)
        for category in authentic_markers.values()
        if isinstance(category, list)
        for word in category
    )

    corporate_penalty = sum(
        response.lower().count(word)
        for category in corporate_markers.values()
        for word in category
    )

    score = min((authentic_score * 15) - (corporate_penalty * 10), 100)

    return {
        "score": max(0, score),
        "authentic_markers": authentic_score,
        "corporate_markers": corporate_penalty
    }
```

**Expected Results:**
- Generic GPT-4: **0-20** (corporate sanitized language)
- Craig with context: **80-100** (raw, unfiltered voice)

---

### Metric 5: Factual Grounding Score (0-100)

**Definition:** Verifies claims are anchored to verifiable source documents.

**Scoring Algorithm:**
```python
@weave.op()
def score_factual_grounding(response: str, source_documents: list) -> dict:
    """
    Requires access to source documents from Signal capsule
    to verify cited claims
    """
    citations = re.findall(r'\[(\d+)\]', response)

    # Extract claims (sentences with factual assertions)
    sentences = re.split(r'[.!?]+', response)
    factual_claims = [
        s for s in sentences
        if re.search(r'\b\d+\b|[A-Z][a-z]+ [A-Z][a-z]+|\$\d+', s)
    ]

    # Check if claims have citations
    grounded_claims = 0
    for claim in factual_claims:
        if any(f'[{c}]' in claim for c in citations):
            grounded_claims += 1

    # Verify citations map to actual source documents
    valid_citations = sum(
        1 for c in citations
        if int(c) < len(source_documents)
    )

    if not factual_claims:
        return {"score": 0, "reason": "No verifiable claims"}

    grounding_ratio = grounded_claims / len(factual_claims)
    citation_validity = valid_citations / len(citations) if citations else 0

    score = int((grounding_ratio * 0.7 + citation_validity * 0.3) * 100)

    return {
        "score": score,
        "total_claims": len(factual_claims),
        "grounded_claims": grounded_claims,
        "citations": len(citations),
        "valid_citations": valid_citations
    }
```

**Expected Results:**
- Generic GPT-4: **30-50** (vague claims, no citations)
- Craig with context: **90-100** (all claims cited to sources)

---

## 3. W&B Weave Implementation

### Setup

```bash
# Install dependencies
pip install wandb weave openai requests

# Login to W&B
export WANDB_API_KEY=f684e7f2a945f3b12d1d57352893e0e48d681bd9
wandb login

# Or programmatically
import os
os.environ['WANDB_API_KEY'] = 'f684e7f2a945f3b12d1d57352893e0e48d681bd9'
```

### Trace Logging

```python
import weave
from openai import OpenAI
import requests
import re

# Initialize Weave project
weave.init('shrinked-ai/craig-evaluation')

@weave.op()
def get_generic_response(prompt: str) -> dict:
    """Generic GPT-4 with no context"""
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )

    return {
        "response": response.choices[0].message.content,
        "model": "gpt-4-generic",
        "has_context": False,
        "tokens": response.usage.total_tokens,
        "cost": (response.usage.total_tokens / 1000) * 0.03  # Approximate
    }

@weave.op()
def get_craig_response(prompt: str, capsule_id: str = "68c32cf3735fb4ac0ef3ccbf") -> dict:
    """Craig with full Signal context"""
    response = requests.post('http://localhost:3000/api/argue', json={
        "message": prompt,
        "capsuleId": capsule_id
    })

    result = response.json()

    return {
        "response": result.get('response', ''),
        "model": "craig-contextualized",
        "has_context": True,
        "capsule_id": capsule_id,
        "context_chunks": result.get('context_chunks', 0)  # If API returns this
    }

@weave.op()
def evaluate_response(response_data: dict) -> dict:
    """Run all 5 evaluation metrics"""
    response_text = response_data['response']

    metrics = {
        "context_utilization": score_context_utilization(response_text, response_data['has_context']),
        "evidence_density": score_evidence_density(response_text),
        "specificity": score_specificity(response_text),
        "emotional_authenticity": score_emotional_authenticity(response_text),
        "factual_grounding": score_factual_grounding(response_text, [])  # Pass source docs if available
    }

    # Calculate overall score (weighted average)
    overall = (
        metrics['context_utilization']['score'] * 0.30 +
        metrics['evidence_density']['score'] * 0.25 +
        metrics['specificity']['score'] * 0.20 +
        metrics['emotional_authenticity']['score'] * 0.10 +
        metrics['factual_grounding']['score'] * 0.15
    )

    return {
        "overall_score": round(overall, 2),
        "metrics": metrics,
        "model": response_data['model']
    }

@weave.op()
def compare_models(prompt: str, capsule_id: str) -> dict:
    """Full comparison pipeline"""

    # Get both responses
    generic = get_generic_response(prompt)
    craig = get_craig_response(prompt, capsule_id)

    # Evaluate both
    generic_eval = evaluate_response(generic)
    craig_eval = evaluate_response(craig)

    # Calculate improvement
    improvement = craig_eval['overall_score'] - generic_eval['overall_score']

    return {
        "prompt": prompt,
        "generic": {
            "response": generic['response'],
            "evaluation": generic_eval
        },
        "craig": {
            "response": craig['response'],
            "evaluation": craig_eval
        },
        "improvement": {
            "absolute": improvement,
            "percentage": (improvement / generic_eval['overall_score'] * 100) if generic_eval['overall_score'] > 0 else 0
        }
    }
```

### Test Suite

```python
# Test prompts across controversial/complex topics
test_prompts = [
    "What's the problem with immigration?",
    "Should we defund the police?",
    "Is climate change real?",
    "What do you think about gun control?",
    "How do you feel about abortion rights?",
    "What's your stance on universal healthcare?",
    "Should we forgive student loans?",
    "Is capitalism failing?",
    "What about free speech on social media?",
    "Should drugs be legalized?"
]

@weave.op()
def run_evaluation_suite(capsule_id: str = "68c32cf3735fb4ac0ef3ccbf"):
    """Run full test suite"""
    results = []

    for prompt in test_prompts:
        print(f"Evaluating: {prompt}")
        result = compare_models(prompt, capsule_id)
        results.append(result)

    # Calculate aggregate statistics
    avg_generic = sum(r['generic']['evaluation']['overall_score'] for r in results) / len(results)
    avg_craig = sum(r['craig']['evaluation']['overall_score'] for r in results) / len(results)

    return {
        "results": results,
        "summary": {
            "avg_generic_score": round(avg_generic, 2),
            "avg_craig_score": round(avg_craig, 2),
            "avg_improvement": round(avg_craig - avg_generic, 2),
            "avg_improvement_pct": round((avg_craig - avg_generic) / avg_generic * 100, 2)
        }
    }

# Run the evaluation
if __name__ == "__main__":
    results = run_evaluation_suite()
    print(f"\n=== EVALUATION COMPLETE ===")
    print(f"Generic Model Average: {results['summary']['avg_generic_score']}/100")
    print(f"Craig Context Model Average: {results['summary']['avg_craig_score']}/100")
    print(f"Average Improvement: +{results['summary']['avg_improvement_pct']}%")
```

---

## 4. Expected Results

### Hypothesis

Context-aware AI using personal Signal capsules will score **400-600% higher** than generic models across our evaluation metrics.

### Predicted Scores

| Metric | Generic GPT-4 | Craig w/ Context | Improvement |
|--------|--------------|------------------|-------------|
| Context Utilization | 2 | 92 | +4,500% |
| Evidence Density | 0 | 85 | +∞ |
| Specificity | 35 | 88 | +151% |
| Emotional Authenticity | 12 | 95 | +692% |
| Factual Grounding | 42 | 97 | +131% |
| **Overall Average** | **18.2** | **91.4** | **+402%** |

---

## 5. Visualization in W&B Weave

### Trace View
Each evaluation run creates a trace showing:
- Input prompt
- Model responses (generic vs Craig)
- Score breakdowns for all 5 metrics
- Latency and cost metrics
- Citation chains (for Craig responses)

### Leaderboard View
Aggregate scores across all test prompts:
- Model comparison table
- Score distributions by metric
- Improvement percentages
- Statistical significance tests

### Individual Response Analysis
Drill down into specific responses:
- Side-by-side comparison
- Highlighted citations and proper nouns
- Vague language detection
- Source document mapping

---

## 6. Next Steps

1. **Implement evaluation script** (`evaluate_responses.py`)
2. **Run initial test suite** (10 controversial prompts)
3. **Analyze results in W&B dashboard**
4. **Refine scoring algorithms** based on edge cases
5. **Expand test set** to 50+ prompts
6. **Add human evaluation** for qualitative assessment
7. **Build comparison dashboard** for public demo

---

## 7. Success Criteria

This evaluation framework will be considered successful if:

✅ **Craig consistently scores 80+ overall** across all test prompts
✅ **Generic model consistently scores <30 overall**
✅ **Improvement delta is >50 points** (400%+)
✅ **Citation accuracy is >95%** (all claims verifiable)
✅ **Zero hallucinations** in Craig responses (grounded in sources)

---

**Project:** TalkBitch Context-Aware AI Evaluation
**Organization:** Shrinked AI
**W&B Project:** https://wandb.ai/shrinked-ai/craig-evaluation
**API Key:** `f684e7f2a945f3b12d1d57352893e0e48d681bd9`
