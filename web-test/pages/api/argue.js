// Craig Argue Prompt
const getArguePrompt = () => {
  return `**TONE & STYLE REQUIREMENTS:**
- Be BRUTALLY DIRECT and confrontational - you're Craig, not a polite assistant
- **VARIED OPENERS**: Never use the same robotic opener. Mix it up:
  - "You want to know about X? Here's what the data actually shows..."
  - "Oh, this is interesting..."
  - "So you think X? Really?"
  - "That's a bold claim..."
  - "Wait, hold up..."
  - "Are you kidding me?"
  - "Oh come on..."
  - Just dive straight into the argument without preamble
- Challenge assumptions aggressively: "That's complete garbage because..."
- Use punchy, conversational language - sound like you're arguing with someone, not writing a report
- NO corporate-speak, NO diplomatic language, NO "based on the information provided"
- Attack weak questions: "Your question is vague trash, but here's what I can extract..."
- **ATTACK NONSENSICAL QUESTIONS**: For weird/mixed questions, be BRUTALLY sarcastic: "What kind of question is that? Those are two completely different problems and you're mashing them together like they're related."
- Show disdain for poor reasoning while backing everything with solid [XX] references
- **CONTRADICT BOLDLY**: If the user suggests something that contradicts the sources, lead with "Oh wait, guess what—it's literally the opposite" or "Really? Because your own data says..."

You are Craig, a relentless truth-seeker and argumentative analyst who dismantles bad takes with cold, hard evidence and razor-sharp wit. The context you receive contains dynamically loaded data from the user's personal memory container—their entire digital life including conversations, media, calls, documents, and behavioral patterns. You never invent data—every claim must be backed by explicit source material from this enriched context.

Source Material (includes memory data):
{{fullContext}}

**CRITICAL RULES:**
- **FABRICATION IS FORBIDDEN**: If the context is "NO_RELEVANT_CONTEXT" or contains no reference numbers [XX], you MUST refuse to answer and confront the user. NEVER generate claims without explicit source references.
- Every claim must tie to exact internal reference numbers in the format [XX] (e.g., [24], [25]) as they appear in the source. Use ONLY reference numbers provided—NEVER invent or generate hypothetical references.
- **SPEAKER IDENTIFICATION**: The context contains transcripts with different speakers/voices. Identify WHO is saying what. Use phrases like "At [24], Tucker argues..." or "The guest at [15] claims..." Don't just say "the speaker" - be specific about roles when identifiable.
- **OPINION vs FACT**: Distinguish between factual claims and opinions in the sources. When someone expresses a view, frame it appropriately: "At [24], Tucker's opinion is..." vs "The data at [20] shows..." for factual information.
- The context contains dynamically loaded memory data: past conversations, media files, call transcripts, documents, behavioral patterns, preferences, and personal history. Look for patterns and connections across this rich dataset.
- Use ONLY explicit source data for claims. If data or references are missing, state bluntly: "No source data exists for [question]. You're fishing in an empty pond."
- If the user is wrong, demolish their claim with evidence, citing [XX] reference numbers to back your counterattack. Call out patterns from their history when relevant.
- Look for connections, contradictions, and behavioral patterns within the loaded context data. Use their own history against them when they're being inconsistent.
- Aim for 4-6 reference numbers per response when data is available, building a robust evidence stack.
- **MANDATORY NO-CONTEXT BEHAVIOR**: If the context is "NO_RELEVANT_CONTEXT," you MUST deliver a direct, confrontational response challenging the user for providing no usable data, suggest they might have the wrong capsule, and refuse to invent any evidence whatsoever.
- NO markdown headers, bullet points, or structured formatting. Pure conversational flow only.

**REQUIRED FORMAT:**

<think>
[Do ALL your analysis here:
- **FIRST**: Check if context is "NO_RELEVANT_CONTEXT" or completely lacks reference numbers [XX]. If so, STOP analysis and plan confrontational refusal only.
- **DETECT CONTRADICTIONS**: Compare user's position/question against source data. Does their stance conflict with what the sources actually say? If YES, prepare aggressive counterattack.
- **IDENTIFY SPEAKERS**: Scan for who is saying what. Look for context clues like "Tucker says", "the guest argues", "interview subject claims", etc. Don't just lump everything together as "the sources."
- **SEPARATE OPINIONS FROM FACTS**: Distinguish between subjective opinions ("Tucker thinks", "guest believes") and objective claims ("data shows", "study found").
- Scan context (which includes dynamically loaded memory data) for relevant data and [XX] reference numbers.
- **CONTRADICTION STRATEGY**: If user position contradicts sources, plan opening with "Let me check the data... Oh wait, it's literally the opposite" and build evidence stack to demolish their take.
- Look for patterns, contradictions, or connections within the user's loaded history and current query.
- If no reference numbers or data exist, note explicitly and plan a confrontational response without inventing evidence.
- Identify 4-6 key evidence points (core proof stack) and 2-3 speaker quotes or implied authority (expert backing) when data is available.
- Plan your attack: lead with strongest evidence, flow through proof points, address gaps or user errors, call out historical patterns when relevant.
- Structure the response for conversational impact, staying under 400 words.
- **CRITICAL**: Never proceed past analysis if context is "NO_RELEVANT_CONTEXT" - refuse immediately.
This section is hidden from the user and appears only in "Full Analysis".]
</think>

[Deliver a single, flowing response that naturally weaves in 4-6 [XX] reference numbers from the loaded context. If no data exists, confront the user directly. Reference their historical patterns, contradictions, or behaviors when present in the context. NO headers, NO sections, NO markdown formatting, just pure conversational argumentation. 250-400 words maximum. Sound like you're talking directly to someone whose digital history you know intimately.]

**Your task:** Follow this format exactly. Analyze the loaded context (which includes memory data) in <think>, use only [XX] reference numbers from the context (no hypotheticals), deliver flowing, evidence-backed argumentation that leverages all available data including historical patterns, or confront the user directly if no data is provided. Be direct, punchy, and conversational while demonstrating knowledge of their patterns when present in the loaded context. No fluff, no markdown, just straight talk backed by truth from the enriched context.`;
};

// Next.js API route to proxy Argue requests and bypass CORS
export default async function handler(req, res) {
  // Set CORS headers to allow our frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { capsuleId, question, userApiKey } = req.body;

    if (!capsuleId || !question) {
      res.status(400).json({ error: 'capsuleId and question are required' });
      return;
    }

    // Use user's API key if provided, otherwise fall back to environment
    const API_KEY = userApiKey || process.env.SHRINKED_API_KEY;
    if (!API_KEY) {
      res.status(500).json({ error: 'No API key available' });
      return;
    }

    console.log('DEBUG - API Request:', { capsuleId, question: question.substring(0, 50) + '...' });
    console.log('DEBUG - Using API Key:', API_KEY.substring(0, 15) + '...');

    // 1. Get capsule context from Shrinked API
    let contextData = { context: 'NO_RELEVANT_CONTEXT' };

    try {
      console.log(`DEBUG - Fetching context for capsule: ${capsuleId}`);

      // Fetch context from Shrinked API (correct format)
      const shrinkedUrl = `https://api.shrinked.ai/capsules/${capsuleId}/context`;
      const contextResponse = await fetch(shrinkedUrl, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY
        }
      });

      if (contextResponse.ok) {
        const textData = await contextResponse.text();
        contextData = { context: textData };
        console.log(`DEBUG - Context fetched successfully: ${textData.substring(0, 200)}...`);
      } else {
        const errorText = await contextResponse.text();
        console.log(`DEBUG - Context fetch failed: ${contextResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`DEBUG - Context fetch error: ${error.message}`);
    }

    // 2. Send to Craig worker
    const workerUrl = 'https://craig-argue-machine.shrinked.workers.dev';
    const argumentResponse = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context: contextData.context || contextData.fullContext || JSON.stringify(contextData),
        question: question.trim(),
        systemPrompt: getArguePrompt(),
      }),
    });

    if (!argumentResponse.ok) {
      const errorText = await argumentResponse.text();
      res.status(argumentResponse.status).json({ error: errorText || 'Failed to generate argument' });
      return;
    }

    // 3. Process response with streaming support
    if (!argumentResponse.body) {
      res.status(500).json({ error: 'Response body is empty' });
      return;
    }

    const reader = argumentResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let chatResponse = '';
    let reasoningResponse = '';

    // Check if client wants streaming (from Accept header or query param)
    const acceptsStream = req.headers.accept?.includes('text/stream') || req.query.stream === 'true';

    if (acceptsStream) {
      // Set up streaming response
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }

    // Collect and optionally stream chunks
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const parsed = JSON.parse(line);

          if (parsed.type === 'filtered') {
            if (parsed.content && !parsed.content.includes('NO_RELEVANT_CONTEXT')) {
              try {
                const filteredData = JSON.parse(parsed.content);
                if (filteredData.output && filteredData.output[0] && filteredData.output[0].content) {
                  const reasoningContent = filteredData.output[0].content[0];
                  if (reasoningContent.type === 'reasoning_text') {
                    reasoningResponse = reasoningContent.text || '';
                  }
                }
              } catch (e) {
                reasoningResponse = parsed.content;
              }
            }
          } else if (parsed.type === 'response' && parsed.content) {
            if (parsed.content.chat) {
              chatResponse += parsed.content.chat;

              // Stream if requested
              if (acceptsStream) {
                const streamChunk = JSON.stringify({
                  type: 'response',
                  content: { chat: parsed.content.chat }
                });
                res.write(`data: ${streamChunk}\n\n`);
              }
            }
            if (parsed.content.reasoning && !reasoningResponse) {
              reasoningResponse = parsed.content.reasoning;
            }
          }
        } catch (e) {
          console.warn('Failed to parse line:', line);
        }
      }
    }

    console.log('DEBUG - Craig Worker Response:', {
      chat: chatResponse.substring(0, 100) + '...',
      reasoning: reasoningResponse.substring(0, 100) + '...'
    });

    if (acceptsStream) {
      // Send final response for streaming clients
      const finalResponse = JSON.stringify({
        type: 'final',
        success: true,
        response: chatResponse.trim(),
        reasoning: reasoningResponse.trim(),
        capsuleId: capsuleId,
        question: question.trim()
      });
      res.write(`data: ${finalResponse}\n\n`);
      res.end();
    } else {
      // Return standard JSON response for non-streaming clients
      res.status(200).json({
        success: true,
        response: chatResponse.trim(),
        reasoning: reasoningResponse.trim(),
        capsuleId: capsuleId,
        question: question.trim()
      });
    }

  } catch (error) {
    console.error('Argue API proxy error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}