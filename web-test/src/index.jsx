import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Avatar } from '@readyplayerme/visage';

// Import styles
import './styles.css';

const defaultAvatarUrl = "https://models.readyplayer.me/68ea9e6ec138a9c842570bf9.glb?morphTargets=ARKit,Oculus&textureAtlas=none";
// Use built-in avatar morph targets instead of external animation file

// Pipecat-style TTS using ElevenLabs (high-quality voices)
class PipecatTTS {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.elevenlabs.io/v1/text-to-speech';
        this.selectedVoice = 'Adam'; // Default high-quality voice
        this.voiceSettings = {
            stability: 0.75,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
        };
    }

    async getVoices() {
        try {
            const response = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });
            if (response.ok) {
                const data = await response.json();
                return data.voices;
            }
        } catch (error) {
            console.error('Failed to fetch voices:', error);
        }
        return [];
    }

    async speak(text, onAudioStart = () => {}, onAudioEnd = () => {}) {
        if (!this.apiKey || this.apiKey === 'YOUR_ELEVENLABS_API_KEY') {
            console.warn('ElevenLabs API key not configured, falling back to Web Speech API');
            this.fallbackSpeak(text, onAudioStart, onAudioEnd);
            return;
        }

        try {
            // High-quality voice options with their IDs
            const voices = {
                'Adam': 'pNInz6obpgDQGcFmaJgB',   // Deep, narrative
                'Rachel': '21m00Tcm4TlvDq8ikWAM', // Professional, warm
                'Nicole': 'piTKgcLEGmPE4e6mEKli', // Young adult, confident
                'Domi': 'AZnzlk1XvdvUeBnXmlld',  // Strong, confident
                'Bella': 'EXAVITQu4vr4xnSDxMaL'  // Soft, pleasant
            };

            const voiceId = voices[this.selectedVoice] || voices['Rachel'];

            const response = await fetch(`${this.baseUrl}/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey
                },
                body: JSON.stringify({
                    text: text,
                    voice_settings: this.voiceSettings
                })
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);

                // Set audio properties for better browser compatibility
                audio.crossOrigin = "anonymous";
                audio.preload = "auto";

                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                };

                audio.onerror = (e) => {
                    console.warn('Audio playback failed, trying fallback TTS:', e);
                    URL.revokeObjectURL(audioUrl);
                    this.fallbackSpeak(text);
                };

                // Try to play audio with user interaction context
                try {
                    // Create a user gesture-triggered play function
                    const playPromise = audio.play();

                    if (playPromise !== undefined) {
                        onAudioStart(); // Call onAudioStart when audio begins playing
                        await playPromise;
                        console.log('ElevenLabs TTS: Speaking with high-quality voice');
                    }
                } catch (playError) {
                    console.warn('Audio play failed, trying fallback:', playError);
                    this.fallbackSpeak(text, onAudioStart, onAudioEnd);
                }
            } else {
                throw new Error(`ElevenLabs API error: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            console.error('ElevenLabs TTS failed:', error);
            this.fallbackSpeak(text, onAudioStart, onAudioEnd);
        }
    }

    fallbackSpeak(text, onAudioStart = () => {}, onAudioEnd = () => {}) {
        // Fallback to Web Speech API if ElevenLabs fails
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            const voices = speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice =>
                voice.lang.startsWith('en') &&
                (voice.name.includes('Natural') || voice.name.includes('Neural'))
            ) || voices.find(voice => voice.lang.startsWith('en'));

            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.onstart = onAudioStart;
            utterance.onend = onAudioEnd;
            speechSynthesis.speak(utterance);
            console.log('Fallback TTS: Using Web Speech API');
        }
    }
}

function App() {
    const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl);
    const [inputUrl, setInputUrl] = useState(defaultAvatarUrl);
    const [messages, setMessages] = useState([{ role: 'system', text: 'Welcome! Load an avatar and start chatting.' }]);
    const [streamingMessage, setStreamingMessage] = useState(null); // New state for the in-progress message
    const [userInput, setUserInput] = useState('');
    const [isTalking, setIsTalking] = useState(false);
    const [currentMorphTargets, setCurrentMorphTargets] = useState({});
    const talkingIntervalRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [ttsSystem, setTtsSystem] = useState(null);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [currentModel, setCurrentModel] = useState('chat'); // 'chat' or 'argue'
    const [capsuleId, setCapsuleId] = useState('');
    const chatBoxRef = useRef(null);
    const avatarRef = useRef(); // Add this line
    const initializationRef = useRef(false); // Prevent duplicate initialization

    // Initialize audio context on first user interaction
    const enableAudio = async () => {
        if (!audioEnabled) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                await audioContext.resume();
                setAudioEnabled(true);
                console.log('Audio context enabled');
            } catch (error) {
                console.warn('Could not enable audio context:', error);
            }
        }
    };

    useEffect(() => {
        // Prevent duplicate initialization in React StrictMode
        if (initializationRef.current) return;
        initializationRef.current = true;

        // Initialize Pipecat TTS system
        const elevenlabsApiKey = window.CONFIG?.ELEVENLABS_API_KEY || 'YOUR_ELEVENLABS_API_KEY';
        const tts = new PipecatTTS(elevenlabsApiKey);
        setTtsSystem(tts);

        const testConnection = async () => {
            try {
                if (!window.CONFIG?.OPENAI_API_KEY) {
                    setMessages(prev => [...prev, { role: 'system', text: 'Error: config.js not found or API key is missing.' }]);
                    return;
                }
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${window.CONFIG.OPENAI_API_KEY}` }
                });
                if (response.ok) {
                    setIsConnected(true);
                    setMessages(prev => [...prev, { role: 'system', text: 'OpenAI connection established.' }]);
                    if (elevenlabsApiKey && elevenlabsApiKey !== 'YOUR_ELEVENLABS_API_KEY') {
                        setMessages(prev => [...prev, { role: 'system', text: 'High-quality TTS (ElevenLabs) initialized.' }]);
                    } else {
                        setMessages(prev => [...prev, { role: 'system', text: 'TTS initialized with fallback voice.' }]);
                    }
                } else {
                    throw new Error('API key validation failed');
                }
            } catch (error) {
                console.error('Connection test failed:', error);
                setMessages(prev => [...prev, { role: 'system', text: `Warning: OpenAI connection failed. ${error.message}` }]);
            }
        };
        testConnection();
    }, []);

    // Animation functions for talking
    const startTalkingAnimation = () => {
        if (talkingIntervalRef.current) return; // Already running

        setIsTalking(true);

        // More robust mesh finding - traverse the scene graph
        const findAvatarMesh = (object) => {
            if (!object) return null;

            // Check if current object is the mesh we need
            if (object.isMesh && object.morphTargetDictionary && Object.keys(object.morphTargetDictionary).length > 0) {
                return object;
            }

            // Recursively search children
            if (object.children) {
                for (const child of object.children) {
                    const found = findAvatarMesh(child);
                    if (found) return found;
                }
            }

            return null;
        };

        const avatarMesh = findAvatarMesh(avatarRef.current);

        if (!avatarMesh) {
            console.warn("Avatar mesh with morph targets not found for animation.");
            return;
        }

        console.log("Found avatar mesh with morph targets:", Object.keys(avatarMesh.morphTargetDictionary));

        const jawOpenIndex = avatarMesh.morphTargetDictionary.jawOpen;
        const mouthSmileLeftIndex = avatarMesh.morphTargetDictionary.mouthSmileLeft;
        const mouthSmileRightIndex = avatarMesh.morphTargetDictionary.mouthSmileRight;

        if (jawOpenIndex === undefined || mouthSmileLeftIndex === undefined || mouthSmileRightIndex === undefined) {
            console.warn("Required morph target indices not found. Available targets:", Object.keys(avatarMesh.morphTargetDictionary));
            return;
        }

        talkingIntervalRef.current = setInterval(() => {
            avatarMesh.morphTargetInfluences[jawOpenIndex] = Math.random() * 0.6 + 0.4;
            avatarMesh.morphTargetInfluences[mouthSmileLeftIndex] = Math.random() * 0.2;
            avatarMesh.morphTargetInfluences[mouthSmileRightIndex] = Math.random() * 0.2;
        }, 100); // Update every 100ms for smooth animation
    };

    const stopTalkingAnimation = () => {
        if (talkingIntervalRef.current) {
            console.log("Clearing interval:", talkingIntervalRef.current);
            clearInterval(talkingIntervalRef.current);
            talkingIntervalRef.current = null;
        }
        setIsTalking(false);

        // Reset morph targets to 0 when stopping - use same robust mesh finding
        const findAvatarMesh = (object) => {
            if (!object) return null;

            // Check if current object is the mesh we need
            if (object.isMesh && object.morphTargetDictionary && Object.keys(object.morphTargetDictionary).length > 0) {
                return object;
            }

            // Recursively search children
            if (object.children) {
                for (const child of object.children) {
                    const found = findAvatarMesh(child);
                    if (found) return found;
                }
            }

            return null;
        };

        const avatarMesh = findAvatarMesh(avatarRef.current);
        if (avatarMesh) {
            const jawOpenIndex = avatarMesh.morphTargetDictionary.jawOpen;
            const mouthSmileLeftIndex = avatarMesh.morphTargetDictionary.mouthSmileLeft;
            const mouthSmileRightIndex = avatarMesh.morphTargetDictionary.mouthSmileRight;

            if (jawOpenIndex !== undefined) avatarMesh.morphTargetInfluences[jawOpenIndex] = 0;
            if (mouthSmileLeftIndex !== undefined) avatarMesh.morphTargetInfluences[mouthSmileLeftIndex] = 0;
            if (mouthSmileRightIndex !== undefined) avatarMesh.morphTargetInfluences[mouthSmileRightIndex] = 0;
        }
    };

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (talkingIntervalRef.current) {
                clearInterval(talkingIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages, streamingMessage]); // Update scroll for streaming message too

    // Argue API call function with streaming
    const callArgueAPI = async (question, onStreamUpdate) => {
        if (!capsuleId) {
            throw new Error('Capsule ID is required for Argue mode. Please enter a capsule ID.');
        }

        const workerUrl = 'https://craig-argue-machine.shrinked.workers.dev';

        // Fetch context from Shrinked API first
        const contextUrl = `https://api.shrinked.ai/capsules/${capsuleId}/context`;
        const contextResponse = await fetch(contextUrl, {
            method: 'GET',
            headers: {
                'x-api-key': window.CONFIG.OPENAI_API_KEY
            }
        });

        let context = 'NO_RELEVANT_CONTEXT';
        if (contextResponse.ok) {
            context = await contextResponse.text();
            console.log('DEBUG: Context fetched successfully');
        }

        // Get argue prompt (same as ArguePopup)
        const systemPrompt = `**TONE & STYLE REQUIREMENTS:**
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

        const finalPrompt = systemPrompt.replace('{{fullContext}}', context);

        // Stream from worker directly
        const argumentResponse = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                context: context,
                question: question.trim(),
                systemPrompt: finalPrompt,
            }),
        });

        if (!argumentResponse.ok) {
            const errorText = await argumentResponse.text();
            throw new Error(`Worker request failed: ${argumentResponse.status} - ${errorText}`);
        }

        if (!argumentResponse.body) {
            throw new Error('Response body is empty');
        }

        const reader = argumentResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

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
                    if (parsed.type === 'response' && parsed.content && parsed.content.chat) {
                        fullResponse += parsed.content.chat;
                        onStreamUpdate(fullResponse);
                    }
                } catch (e) {
                    // ignore bad lines
                }
            }
        }

        return fullResponse || 'No response received from Craig.';
    };

    const handleSendMessage = async () => {
        if (!userInput.trim()) return;

        await enableAudio();

        const userMessage = { role: 'user', text: userInput };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setUserInput('');

        try {
            let reply;

            if (currentModel === 'argue') {
                // Use Argue API (Craig style) with streaming
                console.log("DEBUG: Starting Craig stream...");
                setStreamingMessage({ role: 'ai', text: '' }); // Initialize streaming message

                reply = await callArgueAPI(userInput, (streamedText) => {
                    console.log(`DEBUG: Craig stream update: ${streamedText.substring(streamedText.length - 10)}`);
                    setStreamingMessage({ role: 'ai', text: streamedText });
                });

                setStreamingMessage(null); // Clear streaming message
            } else {
                // Use OpenAI streaming (regular chat)
                console.log("DEBUG: Starting OpenAI stream...");
                setStreamingMessage({ role: 'ai', text: '' }); // Initialize streaming message

                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${window.CONFIG.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "gpt-4o",
                        messages: newMessages.filter(m => m.role === 'user' || m.role === 'ai').map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.text })),
                        stream: true, // Enable streaming
                        max_tokens: 150 // Limit response length to ~2/3 of previous length
                    })
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('OpenAI API Error:', response.status, response.statusText, errorData);
                    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let fullReply = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        console.log("DEBUG: Stream finished.");
                        break;
                    }

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.substring(6);
                            if (data === '[DONE]') {
                                break;
                            }
                            try {
                                const json = JSON.parse(data);
                                const token = json.choices[0]?.delta?.content || "";
                                if (token) {
                                    fullReply += token;
                                    console.log(`DEBUG: Received token: ${token}`);
                                    setStreamingMessage(prev => ({ ...prev, text: fullReply }));
                                }
                            } catch (e) {
                                console.error("Error parsing stream data:", e);
                            }
                        }
                    }
                }

                reply = fullReply;
                setStreamingMessage(null); // Clear streaming message
            }

            // Common logic for both models - finalize the message
            setMessages(prev => [...prev, { role: 'ai', text: reply }]);

            // Use Pipecat TTS to speak the response
            if (ttsSystem) {
                await ttsSystem.speak(reply, startTalkingAnimation, stopTalkingAnimation);
            }

        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { role: 'system', text: `Error: ${error.message}` }]);
            setStreamingMessage(null); // Clear streaming message on error
        }
    };

    return (
        <div className="container">
            <div className="avatar-section">
                 <div className="avatar-container">
                        <Avatar
                            ref={avatarRef} // Pass the ref here
                            modelSrc={avatarUrl}
                            cameraTarget={1.45}
                            cameraInitialDistance={1.4}
                            scale={2.0}
                            morphTargets={currentMorphTargets} // Re-added
                            onError={(error) => console.error('Avatar error:', error)}
                            onLoad={() => {
                                console.log('Avatar loaded successfully');
                                console.log('avatarRef.current:', avatarRef.current);
                            }}
                        />
                </div>
                <div className="avatar-controls">
                    <input
                        type="text"
                        className="avatar-url-input"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="Paste your .glb avatar URL here"
                    />
                    <button
                        className="load-avatar-btn"
                        onClick={async () => {
                            await enableAudio();
                            setAvatarUrl(inputUrl);
                        }}
                    >
                        Load Avatar
                    </button>
                </div>
            </div>

            <div className="chat-section">
                <div className="chat-header">
                    <h1>
                        <span className={`status-indicator ${isConnected ? 'connected' : ''}`}></span>
                        TalkBitch Chat
                    </h1>
                    <p>Chat with your Ready Player Me avatar powered by {currentModel === 'argue' ? 'Craig (John Oliver Style)' : 'OpenAI'}</p>

                    {/* Model Switcher */}
                    <div className="model-switcher">
                        <label>
                            <input
                                type="radio"
                                name="model"
                                value="chat"
                                checked={currentModel === 'chat'}
                                onChange={(e) => setCurrentModel(e.target.value)}
                            />
                            🤖 Friendly Chat
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="model"
                                value="argue"
                                checked={currentModel === 'argue'}
                                onChange={(e) => setCurrentModel(e.target.value)}
                            />
                            🔥 Craig (Argue Mode)
                        </label>
                    </div>

                    {/* Capsule ID Input for Argue Mode */}
                    <div className={`capsule-input ${currentModel !== 'argue' ? 'hidden-element' : ''}`}>
                        <input
                            type="text"
                            value={capsuleId}
                            onChange={(e) => setCapsuleId(e.target.value)}
                            placeholder="Enter Capsule ID for Craig mode..."
                            className="capsule-id-input"
                        />
                        <small>Capsule ID is required for Craig to access your personal context</small>
                    </div>
                </div>
                <div className="chat-messages" ref={chatBoxRef}>
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>{msg.text}</div>
                    ))}
                    {/* Render the in-progress streaming message */}
                    {streamingMessage && (
                        <div className={`message ${streamingMessage.role}`}>{streamingMessage.text}</div>
                    )}
                </div>
                <div className="chat-input">
                    <div className="input-container">
                        <input
                            type="text"
                            className="message-input"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type your message here..."
                        />
                        <button className="send-btn" onClick={handleSendMessage}>Send</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
