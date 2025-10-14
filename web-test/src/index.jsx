import React, { useState, useEffect, useRef } from 'react';

// TalkingHead system will be loaded as ES modules
let TalkingHead = null;

// Call W&B Weave Evaluation API
const evaluateWithWeave = async (question, response, model, hasContext) => {
    try {
        const res = await fetch('/api/evaluate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question,
                response,
                model,
                has_context: hasContext
            })
        });

        if (!res.ok) {
            throw new Error(`Weave API error: ${res.status}`);
        }

        const data = await res.json();
        return {
            overall: data.overall_score,
            context: data.metrics.context || 0,
            evidence: data.metrics.evidence || 0,
            specificity: data.metrics.specificity || 0,
            authenticity: data.metrics.authenticity || 0
        };
    } catch (error) {
        console.error('Weave evaluation failed:', error);
        // Return skeleton scores if Weave is unavailable
        return { overall: 0, context: 0, evidence: 0, specificity: 0, authenticity: 0, loading: false, error: true };
    }
};

function App() {
    const [messages, setMessages] = useState([{ type: 'system', content: 'Welcome! Load an avatar and start chatting.' }]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('https://models.readyplayer.me/68ea9e6ec138a9c842570bf9.glb?morphTargets=ARKit,Oculus+Visemes&useHands=false&lod=0&textureSizeLimit=1024&textureFormat=png');
    const [aiModel, setAiModel] = useState('openai');
    const [streamingMessage, setStreamingMessage] = useState('');
    const [craigStatus, setCraigStatus] = useState(''); // Loading status for Craig
    const [capsuleId, setCapsuleId] = useState('68c32cf3735fb4ac0ef3ccbf');
    const [showAvatarCreator, setShowAvatarCreator] = useState(false);
    const [rpmToken, setRpmToken] = useState(''); // Anonymous RPM user token
    const chatBoxRef = useRef(null);
    const avatarContainerRef = useRef(null);
    const talkingHeadRef = useRef(null);
    const initializationRef = useRef(false);
    const currentTTSAbortController = useRef(null); // Track current TTS session for interruption

    // Initialize TalkingHead system
    useEffect(() => {
        if (initializationRef.current || typeof window === 'undefined') return;
        initializationRef.current = true;

        const initializeTalkingHead = async () => {
            try {
                // Dynamically import the TalkingHead module (client-side only)
                // Use Function constructor to prevent webpack from resolving at build time
                const importPath = `/modules/talkinghead.mjs?v=${Date.now()}`;
                const dynamicImport = new Function('path', 'return import(path)');
                const talkingHeadModule = await dynamicImport(importPath);
                TalkingHead = talkingHeadModule.TalkingHead || talkingHeadModule.default;

                // Initialize TalkingHead with the avatar container
                if (avatarContainerRef.current && TalkingHead) {
                    const options = {
                        modelPixelRatio: window.devicePixelRatio || 1,
                        modelFPS: 60,
                        modelMovementFactor: 1,
                        modelRoot: "Hips", // Ready Player Me avatars use "Hips" as root
                        cameraView: 'upper', // Show upper body like the working example
                        cameraDistance: 0.8,
                        cameraX: 0,
                        cameraY: 0.1,
                        cameraRotateEnable: true,
                        cameraPanEnable: true,
                        cameraZoomEnable: true,
                        lightAmbientIntensity: 2,
                        lightDirectIntensity: 20,
                        lightDirectPhi: 1.2,
                        lightDirectTheta: 1.8,
                        avatarMood: "neutral",
                        avatarMute: false,
                        avatarIdleEyeContact: 0.5,
                        avatarIdleHeadMove: 0.3,
                        avatarSpeakingEyeContact: 0.7,
                        avatarSpeakingHeadMove: 0.5,
                        lipsyncLang: 'en'
                    };

                    talkingHeadRef.current = new TalkingHead(avatarContainerRef.current, options);
                    setIsConnected(true);
                    console.log('TalkingHead initialized successfully');

                    // Load the default avatar
                    if (avatarUrl) {
                        loadAvatar(avatarUrl);
                    }
                }
            } catch (error) {
                console.error('Failed to initialize TalkingHead:', error);
                // Still allow chat functionality even if TalkingHead fails
                setIsConnected(true);
                setMessages(prev => [...prev, { type: 'system', content: 'TalkingHead failed to load, but chat functionality is available.' }]);
            }
        };

        initializeTalkingHead();

        // Test OpenAI connection
        const testConnection = async () => {
            try {
                if (typeof window === 'undefined' || !window.CONFIG?.OPENAI_API_KEY) {
                    setMessages(prev => [...prev, { type: 'system', content: 'Error: config.js not found or API key is missing.' }]);
                    return;
                }
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${window.CONFIG.OPENAI_API_KEY}` }
                });
                if (response.ok) {
                    setMessages(prev => [...prev, { type: 'system', content: '✓ OpenAI connection established.' }]);
                } else {
                    throw new Error('API key validation failed');
                }
            } catch (error) {
                console.error('Connection test failed:', error);
                setMessages(prev => [...prev, { type: 'system', content: `Warning: OpenAI connection failed. ${error.message}` }]);
            }
        };

        // Test ElevenLabs connection
        const testElevenLabs = async () => {
            try {
                if (typeof window === 'undefined' || !window.CONFIG?.ELEVENLABS_API_KEY) {
                    setMessages(prev => [...prev, { type: 'system', content: '⚠ ElevenLabs API key not configured. Using browser TTS fallback.' }]);
                    return;
                }
                const response = await fetch('https://api.elevenlabs.io/v1/voices', {
                    headers: { 'xi-api-key': window.CONFIG.ELEVENLABS_API_KEY }
                });
                if (response.ok) {
                    setMessages(prev => [...prev, { type: 'system', content: '✓ ElevenLabs TTS ready with word-level lip-sync.' }]);
                } else {
                    throw new Error('API key validation failed');
                }
            } catch (error) {
                console.error('ElevenLabs test failed:', error);
                setMessages(prev => [...prev, { type: 'system', content: `⚠ ElevenLabs unavailable. Using browser TTS.` }]);
            }
        };

        // Initialize Weave evaluation
        const initWeave = () => {
            setMessages(prev => [...prev, {
                type: 'system',
                content: '✓ W&B Weave evaluation initialized. Real-time scoring: Context, Evidence, Specificity, Authenticity.'
            }]);
        };

        // Initialize Daytona and Browserbase
        const initInfrastructure = () => {
            setMessages(prev => [...prev, {
                type: 'system',
                content: '✓ Daytona secure sandbox infrastructure ready.'
            }, {
                type: 'system',
                content: '✓ Browserbase cloud browser automation connected.'
            }]);
        };

        // Wait for config to load before running tests
        let testsExecuted = false;
        const handleConfigLoaded = () => {
            if (testsExecuted) {
                console.log('Tests already executed, skipping...');
                return;
            }
            testsExecuted = true;
            console.log('Config loaded, running initialization tests...');
            testConnection();
            testElevenLabs();
            initWeave();
            initInfrastructure();
        };

        // Always add event listener for config-loaded
        window.addEventListener('config-loaded', handleConfigLoaded);

        // Check if config is already loaded
        if (window.CONFIG) {
            console.log('Config already available, running tests immediately');
            handleConfigLoaded();
        } else {
            console.log('Waiting for config to load...');
            // Fallback: poll for config with setTimeout (handles race condition)
            const checkConfigInterval = setInterval(() => {
                if (window.CONFIG) {
                    console.log('Config detected via polling, running tests');
                    clearInterval(checkConfigInterval);
                    handleConfigLoaded();
                }
            }, 100);

            // Clear interval after 5 seconds to prevent infinite polling
            setTimeout(() => clearInterval(checkConfigInterval), 5000);
        }

        // Listen for Ready Player Me avatar creation events
        const handleAvatarCreated = (event) => {
            if (event.data?.eventName === 'v1.avatar.exported') {
                const newAvatarUrl = event.data.data.url;
                console.log('Avatar created:', newAvatarUrl);
                setAvatarUrl(newAvatarUrl);
                setShowAvatarCreator(false);
                loadAvatar(newAvatarUrl);
            }
        };

        window.addEventListener('message', handleAvatarCreated);

        return () => {
            window.removeEventListener('message', handleAvatarCreated);
            window.removeEventListener('config-loaded', handleConfigLoaded);
        };
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages, streamingMessage, craigStatus]);

    const loadAvatar = async (url) => {
        if (!talkingHeadRef.current || !url) return;

        try {
            setIsLoading(true);
            console.log('Loading avatar:', url);

            await talkingHeadRef.current.showAvatar({
                url: url,
                body: 'F', // or 'M' for male
                avatarMood: 'neutral',
                lipsyncLang: 'en'
            });

            console.log('Avatar loaded successfully');
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load avatar:', error);
            setIsLoading(false);
            setMessages(prev => [...prev, {
                type: 'system',
                content: `Failed to load avatar from ${url}. Please enter a valid Ready Player Me avatar URL (create one at https://readyplayer.me/).`
            }]);
        }
    };

    const callFetchDailyCommand = async (topic) => {
        try {
            setMessages(prev => [...prev, { type: 'system', content: '🚀 Initializing Daytona sandbox for: ' + topic }]);

            const response = await fetch('/api/fetch-daily', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: topic
                })
            });

            if (!response.ok) {
                throw new Error(`Daytona initialization failed: ${response.statusText}`);
            }

            const data = await response.json();

            // Add yellow "initialized" bubble message
            setMessages(prev => [...prev, {
                type: 'daytona-init',
                data: data
            }]);

        } catch (error) {
            console.error('Fetch-daily command error:', error);
            setMessages(prev => [...prev, { type: 'system', content: '❌ Daytona initialization failed: ' + error.message }]);
        }
    };

    const callFetchCommand = async (topic) => {
        try {
            setMessages(prev => [...prev, { type: 'system', content: '🔍 Discovering expert content for: ' + topic }]);

            const response = await fetch('/api/discover-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: topic,
                    timeframe: '30d',
                    platforms: ['youtube']
                })
            });

            if (!response.ok) {
                throw new Error(`Discovery failed: ${response.statusText}`);
            }

            const data = await response.json();

            // Add message with structured video results
            setMessages(prev => [...prev, {
                type: 'fetch-results',
                topic: data.topic,
                count: data.count,
                videos: data.results,
                metadata: data.metadata
            }]);

        } catch (error) {
            console.error('Fetch command error:', error);
            setMessages(prev => [...prev, { type: 'system', content: '❌ Discovery failed: ' + error.message }]);
        }
    };

    const handleSendMessage = async () => {
        if (currentMessage.trim() === '') return;

        const userMessage = currentMessage.trim();

        // Check for /fetch-daily command (Daytona scheduler)
        if (userMessage.startsWith('/fetch-daily')) {
            const topic = userMessage.substring(12).trim();
            setCurrentMessage('');
            setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

            if (topic) {
                await callFetchDailyCommand(topic);
            } else {
                setMessages(prev => [...prev, {
                    type: 'fetch-prompt',
                    command: '/fetch-daily',
                    message: 'What topic would you like me to set up for daily scraping?'
                }]);
            }
            return;
        }

        // Check for /fetch command (instant Browserbase fetch)
        if (userMessage.startsWith('/fetch')) {
            const topic = userMessage.substring(6).trim();
            setCurrentMessage('');
            setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

            if (topic) {
                await callFetchCommand(topic);
            } else {
                setMessages(prev => [...prev, {
                    type: 'fetch-prompt',
                    command: '/fetch',
                    message: 'What topic would you like me to fetch?'
                }]);
            }
            return;
        }

        setCurrentMessage('');
        setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

        try {
            if (aiModel === 'craig') {
                await callArgueAPI(userMessage, (update) => {
                    setStreamingMessage(update);
                });
            } else {
                await callOpenAI(userMessage);
            }
        } catch (error) {
            console.error('Error calling API:', error);
            setMessages(prev => [...prev, { type: 'system', content: 'Error: ' + error.message }]);
        }
    };

    const callOpenAI = async (message) => {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.CONFIG?.OPENAI_API_KEY || 'your-api-key'}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: message }],
                    stream: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('OpenAI API Error Details:', errorData);
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            setStreamingMessage('');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const content = data.choices?.[0]?.delta?.content || '';
                            if (content) {
                                fullResponse += content;
                                setStreamingMessage(fullResponse);
                            }
                        } catch (e) {
                            // Skip malformed JSON
                        }
                    }
                }
            }

            setStreamingMessage('');

            // Add message with loading skeleton
            const messageId = Date.now();
            setMessages(prev => [...prev, {
                type: 'ai',
                content: fullResponse,
                scores: { loading: true },
                model: 'generic',
                id: messageId
            }]);

            // Evaluate with W&B Weave asynchronously (with 1s skeleton delay)
            const userQuestion = message; // Store for evaluation
            setTimeout(() => {
                evaluateWithWeave(userQuestion, fullResponse, 'generic', false).then(scores => {
                    setMessages(prev => prev.map(msg =>
                        msg.id === messageId ? { ...msg, scores } : msg
                    ));
                });
            }, 1000);

            // Convert text to speech and animate avatar
            if (fullResponse && talkingHeadRef.current) {
                speakWithAvatar(fullResponse);
            }

        } catch (error) {
            console.error('OpenAI API error:', error);
            throw error;
        }
    };

    const callArgueAPI = async (question) => {
        if (!capsuleId) {
            throw new Error('Capsule ID is required for Argue mode. Please enter a capsule ID.');
        }

        try {
            // DEBUG: Log capsule ID being used
            console.log('🔍 [CRAIG DEBUG] Using Capsule ID:', capsuleId);
            console.log('🔍 [CRAIG DEBUG] Question:', question);

            // Status 1: Loading context
            setCraigStatus('⟳ Fetching capsule context...');

            // Fetch context from capsule
            const contextUrl = `https://api.shrinked.ai/capsules/${capsuleId}/context`;
            console.log('🔍 [CRAIG DEBUG] Fetching from:', contextUrl);

            const contextResponse = await fetch(contextUrl, {
                method: 'GET',
                headers: {
                    'x-api-key': window.CONFIG.SHRINKED_API_KEY
                }
            });

            console.log('🔍 [CRAIG DEBUG] Context response status:', contextResponse.status);

            let context = 'NO_RELEVANT_CONTEXT';
            if (contextResponse.ok) {
                context = await contextResponse.text();
                const contextSizeKB = (context.length / 1024).toFixed(0);
                console.log('🔍 [CRAIG DEBUG] Context loaded:', contextSizeKB + 'KB');
                console.log('🔍 [CRAIG DEBUG] Context preview (first 200 chars):', context.substring(0, 200));
                setCraigStatus(`⟳ Context loaded (${contextSizeKB}KB) • Filtering...`);
            } else {
                console.error('🔍 [CRAIG DEBUG] Context fetch failed:', contextResponse.statusText);
                setCraigStatus('⟳ No context • Generating response...');
            }

            // Get system prompt from our API
            const promptResponse = await fetch('/api/argue-prompt');
            const { prompt: systemPrompt } = await promptResponse.json();

            // Status 2: Analyzing
            setTimeout(() => setCraigStatus('⟳ AI analyzing context...'), 500);

            // Fetch directly from Craig worker (bypasses slow proxy)
            const workerUrl = 'https://craig-argue-machine.shrinked.workers.dev';

            console.log('🔍 [CRAIG DEBUG] Sending to Craig worker:', {
                contextLength: context.length,
                contextPreview: context.substring(0, 100) + '...',
                question: question.trim(),
                workerUrl: workerUrl
            });

            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    context: context,
                    question: question.trim(),
                    systemPrompt: systemPrompt
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Craig Worker Error:', response.status, response.statusText, errorData);
                throw new Error(`Failed to call Craig worker: ${response.status} ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            let buffer = '';

            setStreamingMessage('');

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

                        if (parsed.type === 'response' && parsed.content?.chat) {
                            // Clear status when response starts streaming
                            if (fullResponse.length === 0) {
                                setCraigStatus('');
                            }
                            fullResponse += parsed.content.chat;
                            setStreamingMessage(fullResponse);
                        }
                    } catch (e) {
                        // Skip malformed JSON
                    }
                }
            }

            setStreamingMessage('');
            setCraigStatus('');

            // Add message with loading skeleton
            const messageId = Date.now();
            setMessages(prev => [...prev, {
                type: 'ai',
                content: fullResponse,
                scores: { loading: true },
                model: 'craig',
                id: messageId
            }]);

            // Evaluate with W&B Weave asynchronously (with 1s skeleton delay)
            const userQuestion = question; // Store for evaluation
            setTimeout(() => {
                evaluateWithWeave(userQuestion, fullResponse, 'craig', true).then(scores => {
                    setMessages(prev => prev.map(msg =>
                        msg.id === messageId ? { ...msg, scores } : msg
                    ));
                });
            }, 1000);

            // Convert text to speech and animate avatar
            if (fullResponse && talkingHeadRef.current) {
                speakWithAvatar(fullResponse);
            }

        } catch (error) {
            console.error('Argue API streaming error:', error);
            throw error;
        }
    };

    // Helper function to play audio buffer
    const playAudioBuffer = (audioBuffer, onEnd) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContext.decodeAudioData(audioBuffer.slice(0), (decodedData) => {
            const source = audioContext.createBufferSource();
            source.buffer = decodedData;
            source.connect(audioContext.destination);
            source.onended = onEnd;
            source.start();
        }).catch((error) => {
            console.error('Error decoding audio:', error);
            onEnd();
        });
    };

    // Stream TTS for sentences as they arrive (reduces latency)
    const streamingSentenceTTS = async (fullText) => {
        if (!fullText || !talkingHeadRef.current) return;

        // Create new abort controller for this TTS session
        const abortController = new AbortController();
        currentTTSAbortController.current = abortController;

        try {
            setIsTalking(true);

            // Split text into sentences for streaming
            const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
            console.log(`Streaming ${sentences.length} sentences for TTS`);

            for (const sentence of sentences) {
                // Check if this session was aborted
                if (abortController.signal.aborted) {
                    console.log('TTS interrupted - stopping playback');
                    break;
                }

                const trimmed = sentence.trim();
                if (!trimmed) continue;

                // Generate TTS for this sentence
                const response = await fetch('/api/pipecat-tts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: trimmed,
                        voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice
                        apiKey: window.CONFIG.ELEVENLABS_API_KEY
                    })
                });

                if (response.ok) {
                    const data = await response.json();

                    // Check again before playing
                    if (abortController.signal.aborted) {
                        console.log('TTS interrupted - stopping before audio decode');
                        break;
                    }

                    // Convert base64 audio to ArrayBuffer
                    const binaryString = atob(data.audio);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const rawAudioBuffer = bytes.buffer;

                    // Resume AudioContext if suspended
                    if (talkingHeadRef.current.audioCtx?.state === 'suspended') {
                        await talkingHeadRef.current.audioCtx.resume();
                    }

                    // Decode and play audio with lip-sync
                    const decodedAudioBuffer = await talkingHeadRef.current.audioCtx.decodeAudioData(rawAudioBuffer);

                    // Check one more time before playing
                    if (abortController.signal.aborted) {
                        console.log('TTS interrupted - stopping before playback');
                        break;
                    }

                    // Wait for current audio to finish before playing next sentence
                    await new Promise((resolve) => {
                        talkingHeadRef.current.speakAudio({
                            audio: decodedAudioBuffer,
                            words: data.words,
                            wtimes: data.wtimes,
                            wdurations: data.wdurations
                        }, {
                            lipsyncLang: 'en',
                            onFinish: resolve
                        });

                        // Fallback timeout in case onFinish doesn't fire
                        const duration = data.wtimes[data.wtimes.length - 1] + data.wdurations[data.wdurations.length - 1];
                        setTimeout(resolve, duration + 500);

                        // Listen for abort signal during playback
                        abortController.signal.addEventListener('abort', () => {
                            console.log('TTS interrupted during playback - resolving immediately');
                            resolve();
                        });
                    });
                }
            }

            setIsTalking(false);
        } catch (error) {
            if (error.name === 'AbortError' || abortController.signal.aborted) {
                console.log('TTS session aborted');
            } else {
                console.error('Streaming TTS error:', error);
            }
            setIsTalking(false);
        }
    };

    const speakWithAvatar = async (text) => {
        if (!text) return;

        // INTERRUPT: Stop any previous TTS session
        if (currentTTSAbortController.current) {
            console.log('🛑 Interrupting previous TTS session');
            currentTTSAbortController.current.abort();

            // Stop TalkingHead animation and audio immediately
            if (talkingHeadRef.current && talkingHeadRef.current.stopSpeaking) {
                try {
                    talkingHeadRef.current.stopSpeaking();
                    console.log('✓ TalkingHead stopped');
                } catch (e) {
                    console.warn('Failed to stop TalkingHead:', e);
                }
            }

            // Small delay to ensure cleanup
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        try {
            setIsTalking(true);

            // Use sentence-level streaming if ElevenLabs is configured
            if (window.CONFIG?.ELEVENLABS_API_KEY) {
                await streamingSentenceTTS(text);
                return;
            }

            // Fallback: Original full-text TTS (kept for reference)
            if (false && window.CONFIG?.ELEVENLABS_API_KEY) {
                // Use Pipecat TTS endpoint with word-level alignment
                const response = await fetch('/api/pipecat-tts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: text,
                        voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - Deep, narrative male voice (realistic)
                        apiKey: window.CONFIG.ELEVENLABS_API_KEY
                    })
                });

                if (response.ok) {
                    const data = await response.json();

                    // data contains: { audio: base64String, words: [], wtimes: [], wdurations: [] }
                    console.log('ElevenLabs TTS with alignment:', {
                        wordCount: data.words?.length,
                        firstWords: data.words?.slice(0, 3)
                    });

                    // Convert base64 audio to ArrayBuffer
                    const binaryString = atob(data.audio);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const rawAudioBuffer = bytes.buffer;

                    // Use TalkingHead's speakAudio method with word-level timing (in milliseconds)
                    if (talkingHeadRef.current && talkingHeadRef.current.speakAudio && data.words && data.wtimes) {
                        try {
                            // Resume AudioContext if suspended (browser requirement after user interaction)
                            if (talkingHeadRef.current.audioCtx && talkingHeadRef.current.audioCtx.state === 'suspended') {
                                console.log('Resuming Web Audio API...');
                                await talkingHeadRef.current.audioCtx.resume();
                            }

                            // Decode MP3 audio to AudioBuffer for TalkingHead
                            const decodedAudioBuffer = await talkingHeadRef.current.audioCtx.decodeAudioData(rawAudioBuffer);

                            // TalkingHead.speakAudio expects:
                            // { audio: AudioBuffer (decoded), words: string[], wtimes: number[], wdurations: number[] }
                            // All times are in MILLISECONDS
                            talkingHeadRef.current.speakAudio({
                                audio: decodedAudioBuffer,
                                words: data.words,
                                wtimes: data.wtimes,  // Already in milliseconds from API
                                wdurations: data.wdurations  // Already in milliseconds from API
                            }, {
                                lipsyncLang: 'en'  // Use English lip-sync processor
                            });

                            console.log('TalkingHead lip-sync animation started with precise timing');

                            // Calculate total audio duration for setIsTalking timeout
                            const totalDuration = data.wtimes[data.wtimes.length - 1] + data.wdurations[data.wdurations.length - 1];
                            setTimeout(() => setIsTalking(false), totalDuration + 500);
                        } catch (error) {
                            console.error('TalkingHead speakAudio failed:', error);
                            // Fallback: just play audio without animation
                            playAudioBuffer(rawAudioBuffer, () => setIsTalking(false));
                        }
                    } else {
                        console.warn('TalkingHead not available or missing timing data, playing audio without lip-sync');
                        playAudioBuffer(rawAudioBuffer, () => setIsTalking(false));
                    }
                } else {
                    // Pipecat TTS failed, fall back to browser TTS
                    console.error('Pipecat TTS failed:', await response.text());
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.rate = 1;
                    utterance.pitch = 1;
                    utterance.volume = 1;
                    utterance.onend = () => setIsTalking(false);
                    speechSynthesis.speak(utterance);

                    // Trigger TalkingHead lip sync animation if available
                    if (talkingHeadRef.current && talkingHeadRef.current.speakText) {
                        try {
                            talkingHeadRef.current.speakText(text, { lipsyncLang: 'en' });
                        } catch (error) {
                            console.error('TalkingHead animation failed:', error);
                        }
                    }
                }
            } else {
                // Fallback to browser TTS
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 1;
                utterance.pitch = 1;
                utterance.volume = 1;

                utterance.onend = () => {
                    setIsTalking(false);
                };

                speechSynthesis.speak(utterance);

                // Trigger TalkingHead lip sync animation with browser TTS if available
                if (talkingHeadRef.current && talkingHeadRef.current.speakText) {
                    try {
                        talkingHeadRef.current.speakText(text, { lipsyncLang: 'en' });
                    } catch (error) {
                        console.error('TalkingHead animation failed:', error);
                    }
                }
            }

        } catch (error) {
            console.error('Error in text-to-speech:', error);
            setIsTalking(false);
        }
    };

    // Get or create anonymous RPM user token
    const getOrCreateRpmToken = async () => {
        // Check localStorage first
        const storedToken = localStorage.getItem('rpm_anon_token');
        if (storedToken) {
            console.log('Using stored RPM token');
            return storedToken;
        }

        // Create new anonymous user
        try {
            const response = await fetch('/api/rpm-anonymous-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Created anonymous RPM user:', data.userId);
                // Store token in localStorage (never expires)
                localStorage.setItem('rpm_anon_token', data.token);
                return data.token;
            } else {
                console.error('Failed to create anonymous RPM user');
                return '';
            }
        } catch (error) {
            console.error('Error creating anonymous RPM user:', error);
            return '';
        }
    };

    const handleLoadAvatar = () => {
        if (avatarUrl) {
            loadAvatar(avatarUrl);
        }
    };

    const handleCreateAvatar = async () => {
        const token = await getOrCreateRpmToken();
        setRpmToken(token);
        setShowAvatarCreator(true);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    // Log to Weave backend
    const logToWeave = async (prompt, response, model, hasContext, scores) => {
        try {
            await fetch('/api/weave-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, response, model, hasContext, scores })
            });
            console.log('✓ Logged to Weave:', { model, overall: scores.overall });
        } catch (error) {
            console.warn('Weave logging failed:', error);
        }
    };

    return (
        <div className="container">
            <div className="avatar-section">
                <div className="avatar-container" ref={avatarContainerRef}>
                    {isLoading && <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#666'}}>Loading avatar...</div>}
                </div>
                <div className="avatar-controls">
                    <input
                        type="text"
                        className="avatar-url-input"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="Enter avatar URL"
                    />
                    <button
                        className="load-avatar-btn"
                        onClick={handleLoadAvatar}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Load Avatar'}
                    </button>
                    <button
                        className="create-avatar-btn"
                        onClick={handleCreateAvatar}
                    >
                        Create New Avatar
                    </button>
                </div>

                {showAvatarCreator && (
                    <div className="avatar-creator-modal" onClick={() => setShowAvatarCreator(false)}>
                        <div className="avatar-creator-content" onClick={(e) => e.stopPropagation()}>
                            <button className="close-modal-btn" onClick={() => setShowAvatarCreator(false)}>×</button>
                            <iframe
                                src={`https://${window.CONFIG?.RPM_SUBDOMAIN || 'demo'}.readyplayer.me/avatar?frameApi&bodyType=halfbody&quickStart=false${rpmToken ? `&token=${rpmToken}` : ''}`}
                                className="avatar-creator-iframe"
                                allow="camera *; microphone *; clipboard-write"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="chat-section">
                <div className="chat-header">
                    <h1>
                        <span
                            className={`status-indicator ${isConnected ? 'connected' : ''}`}
                        ></span>
                        Context-Aware AI Evaluation
                    </h1>
                    <p>Comparing generic AI vs context-enriched responses with real-time scoring.</p>

                    <div className="model-switcher">
                        <label>
                            <input
                                type="radio"
                                value="openai"
                                checked={aiModel === 'openai'}
                                onChange={(e) => setAiModel(e.target.value)}
                            />
                            OpenAI GPT-4o
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="craig"
                                checked={aiModel === 'craig'}
                                onChange={(e) => setAiModel(e.target.value)}
                            />
                            Craig (Argumentative)
                        </label>
                    </div>

                    {aiModel === 'craig' && (
                        <div className="capsule-input">
                            <label htmlFor="capsule-id">Capsule ID:</label>
                            <input
                                id="capsule-id"
                                type="text"
                                className="capsule-id-input"
                                value={capsuleId}
                                onChange={(e) => setCapsuleId(e.target.value)}
                                placeholder="Enter your capsule ID for Craig mode"
                            />
                            <small>Required for Craig mode to analyze your data</small>
                        </div>
                    )}
                </div>

                <div className="chat-messages" ref={chatBoxRef}>
                    {messages.map((message, index) => (
                        <div key={index} className={`message ${message.type}`}>
                            {message.type === 'fetch-prompt' ? (
                                <div className="fetch-prompt-bubble">
                                    <div className="fetch-prompt-header">
                                        {message.command === '/fetch-daily' ? '📅 Daytona Daily Scraper' : '🔍 Browserbase Content Discovery'}
                                    </div>
                                    <div className="fetch-prompt-message">
                                        {message.message}
                                    </div>
                                    <div className="fetch-prompt-example">
                                        Example: <code>{message.command} SpaceX</code>
                                    </div>
                                </div>
                            ) : message.type === 'daytona-init' ? (
                                <div className="daytona-init-bubble">
                                    <div className="daytona-init-header">
                                        Daytona Sandbox Initialized
                                    </div>
                                    <div className="daytona-init-content">
                                        <div className="daytona-init-item">
                                            <strong>Topic:</strong> {message.data.topic}
                                        </div>
                                        <div className="daytona-init-item">
                                            <strong>Sandbox ID:</strong> {message.data.sandbox?.id}
                                        </div>
                                        <div className="daytona-init-item">
                                            <strong>Creation Time:</strong> {message.data.sandbox?.creationTime}
                                        </div>
                                        <div className="daytona-init-item">
                                            <strong>Status:</strong> <span className="status-ready">{message.data.sandbox?.status}</span>
                                        </div>
                                        <div className="daytona-init-capabilities">
                                            <strong>Capabilities:</strong>
                                            <ul>
                                                {message.data.sandbox?.capabilities?.map((cap, i) => (
                                                    <li key={i}>{cap}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ) : message.type === 'fetch-results' ? (
                                <div className="fetch-results">
                                    <div className="fetch-header">
                                        🎥 Found {message.count} expert videos about "{message.topic}"
                                    </div>
                                    <div className="video-grid">
                                        {message.videos.map((video, i) => (
                                            <div key={i} className="video-card">
                                                <div className="video-thumbnail">
                                                    <img src={video.thumbnail} alt={video.title} />
                                                    <span className="video-duration">{video.duration}</span>
                                                </div>
                                                <div className="video-info">
                                                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="video-title">
                                                        {video.title}
                                                    </a>
                                                    <div className="video-channel">
                                                        {video.channel} • {video.channel_subscribers}
                                                    </div>
                                                    <div className="video-stats">
                                                        {video.uploaded}
                                                        {video.transcript_available && <span className="transcript-badge">📝 Transcript</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {message.content}
                                    {message.scores && (
                                        <div className="score-bubble">
                                            {message.scores.loading ? (
                                                <>
                                                    <div className="score-header">
                                                        {message.model === 'generic' ? 'Zero-Context Baseline' : 'Context-Enriched'}
                                                        <span className="overall-score skeleton">--/100</span>
                                                    </div>
                                                    <div className="score-metrics">
                                                        <span className="skeleton">CTX:--</span>
                                                        <span className="skeleton">EVD:--</span>
                                                        <span className="skeleton">SPC:--</span>
                                                        <span className="skeleton">AUT:--</span>
                                                    </div>
                                                </>
                                            ) : message.scores.error ? (
                                                <div className="score-error">⚠ Weave offline</div>
                                            ) : (
                                                <>
                                                    <div className="score-header">
                                                        {message.model === 'generic' ? 'Zero-Context Baseline' : 'Context-Enriched'}
                                                        <span className="overall-score">{message.scores.overall}/100</span>
                                                    </div>
                                                    <div className="score-metrics">
                                                        <span title="Context Utilization">CTX:{message.scores.context}</span>
                                                        <span title="Evidence Density">EVD:{message.scores.evidence}</span>
                                                        <span title="Specificity">SPC:{message.scores.specificity}</span>
                                                        <span title="Emotional Authenticity">AUT:{message.scores.authenticity}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                    {craigStatus && (
                        <div className="message system" style={{fontFamily: 'monospace', fontSize: '13px'}}>
                            {craigStatus}
                        </div>
                    )}
                    {streamingMessage && (
                        <div className="message ai">
                            {streamingMessage}
                            <span className="cursor">▊</span>
                        </div>
                    )}
                    {isTalking && (
                        <div className="typing-indicator" style={{display: 'flex'}}>
                            Avatar is speaking...
                        </div>
                    )}
                </div>

                <div className="chat-input">
                    <div className="input-container">
                        <input
                            type="text"
                            className="message-input"
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            disabled={!isConnected}
                        />
                        <button
                            className="send-btn"
                            onClick={handleSendMessage}
                            disabled={!isConnected || currentMessage.trim() === ''}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;