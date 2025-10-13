/**
 * Lightweight W&B Weave-inspired Evaluation API (Node.js)
 * Scores AI responses without heavy Python dependencies
 */

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { response, model, has_context } = req.body;

    if (!response) {
      res.status(400).json({ error: 'Missing response text' });
      return;
    }

    // Score context utilization
    const contextScore = scoreContextUtilization(response, has_context);

    // Score evidence density
    const evidenceScore = scoreEvidenceDensity(response);

    // Score specificity
    const specificityScore = scoreSpecificity(response);

    // Score authenticity
    const authenticityScore = scoreAuthenticity(response);

    // Calculate overall weighted score
    const overall = Math.round(
      contextScore * 0.30 +
      evidenceScore * 0.25 +
      specificityScore * 0.20 +
      authenticityScore * 0.25
    );

    res.status(200).json({
      overall_score: overall,
      metrics: {
        context: Math.round(contextScore),
        evidence: Math.round(evidenceScore),
        specificity: Math.round(specificityScore),
        authenticity: Math.round(authenticityScore)
      }
    });

  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: 'Evaluation failed', message: error.message });
  }
}

function scoreContextUtilization(text, hasContext) {
  if (!hasContext) return 0;

  let score = 0;

  // Count citations: [1], [2], etc.
  const citations = (text.match(/\[(\d+)\]/g) || []).length;
  score += Math.min(citations * 10, 50);

  // Count proper names: John Smith, etc.
  const names = (text.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || []).length;
  score += Math.min(names * 5, 25);

  // Count years/dates
  const dates = (text.match(/\b\d{4}\b/g) || []).length;
  score += Math.min(dates * 3, 15);

  return Math.min(score, 100);
}

function scoreEvidenceDensity(text) {
  // Count citations
  const citations = (text.match(/\[(\d+)\]/g) || []).length;

  // Count statistics: 2,000, 95%, etc.
  const statistics = (text.match(/\b\d+(?:\.\d+)?(?:\s?%|,\d+)\b/g) || []).length;

  const score = Math.min((citations * 10) + (statistics * 5), 100);
  return score;
}

function scoreSpecificity(text) {
  // Vague language (penalty)
  const vaguePatterns = ['some', 'many', 'often', 'generally', 'it depends'];
  let vagueCount = 0;
  vaguePatterns.forEach(word => {
    const regex = new RegExp('\\b' + word + '\\b', 'gi');
    const matches = text.match(regex) || [];
    vagueCount += matches.length;
  });

  // Specific language (bonus)
  const numbers = (text.match(/\b\d+(?:,\d+)*\b/g) || []).length;

  const score = 50 + (numbers * 5) - (vagueCount * 8);
  return Math.max(0, Math.min(score, 100));
}

function scoreAuthenticity(text) {
  // Authentic voice indicators
  const authenticWords = ['fuck', 'shit', 'damn', 'clusterfuck', 'bullshit', 'ridiculous', 'absurd'];
  let authenticCount = 0;
  authenticWords.forEach(word => {
    const regex = new RegExp('\\b' + word + '\\b', 'gi');
    const matches = text.match(regex) || [];
    authenticCount += matches.length;
  });

  // Corporate speak (penalty)
  const corporateWords = ['balanced', 'nuanced', 'complex issue', 'however'];
  let corporateCount = 0;
  corporateWords.forEach(word => {
    const regex = new RegExp('\\b' + word + '\\b', 'gi');
    const matches = text.match(regex) || [];
    corporateCount += matches.length;
  });

  const score = (authenticCount * 15) - (corporateCount * 10);
  return Math.max(0, Math.min(score, 100));
}
