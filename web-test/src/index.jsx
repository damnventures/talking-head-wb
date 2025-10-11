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

    async speak(text) {
        if (!this.apiKey || this.apiKey === 'YOUR_ELEVENLABS_API_KEY') {
            console.warn('ElevenLabs API key not configured, falling back to Web Speech API');
            this.fallbackSpeak(text);
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
                        await playPromise;
                        console.log('ElevenLabs TTS: Speaking with high-quality voice');
                    }
                } catch (playError) {
                    console.warn('Audio play failed, trying fallback:', playError);
                    this.fallbackSpeak(text);
                }
            } else {
                throw new Error(`ElevenLabs API error: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            console.error('ElevenLabs TTS failed:', error);
            this.fallbackSpeak(text);
        }
    }

    fallbackSpeak(text) {
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

        talkingIntervalRef.current = setInterval(() => {
            setCurrentMorphTargets({
                viseme_aa: Math.random() * 0.7 + 0.3,
                viseme_E: Math.random() * 0.6 + 0.2,
                viseme_I: Math.random() * 0.5 + 0.3,
                viseme_O: Math.random() * 0.8 + 0.1,
                viseme_U: Math.random() * 0.4 + 0.2,
                mouthSmile: 0.15
            });
        }, 100); // Update every 100ms for smooth animation
    };

    const stopTalkingAnimation = () => {
        if (talkingIntervalRef.current) {
            clearInterval(talkingIntervalRef.current);
            talkingIntervalRef.current = null;
        }
        setIsTalking(false);
        setCurrentMorphTargets({});
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

    // Argue API call function
    const callArgueAPI = async (question) => {
        if (!capsuleId) {
            throw new Error('Capsule ID is required for Argue mode. Please enter a capsule ID.');
        }

        const response = await fetch('https://craig.shrinked.ai/api/argue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                capsuleId: capsuleId,
                question: question.trim(),
                userApiKey: window.CONFIG.OPENAI_API_KEY
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Argue API Error:', response.status, response.statusText, errorData);
            throw new Error(`Argue API failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response || 'No response received from Craig.';
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
                // Use Argue API (Craig style)
                console.log("DEBUG: Calling Argue API...");
                reply = await callArgueAPI(userInput);
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
                        stream: true // Enable streaming
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

            // Trigger talking animation
            startTalkingAnimation();
            console.log('Avatar: Starting talk animation');

            // Use Pipecat TTS to speak the response
            if (ttsSystem) {
                await ttsSystem.speak(reply);
            }

            // Animation duration based on text length
            const animationDuration = Math.max(3000, reply.length * 50);
            setTimeout(() => {
                stopTalkingAnimation();
                console.log('Avatar: Ending talk animation');
            }, animationDuration);

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
                            modelSrc={avatarUrl}
                            cameraTarget={1.45}
                            cameraInitialDistance={1.4}
                            scale={2.0}
                            morphTargets={currentMorphTargets}
                            onError={(error) => console.error('Avatar error:', error)}
                            onLoad={() => console.log('Avatar loaded successfully')}
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
                    {currentModel === 'argue' && (
                        <div className="capsule-input">
                            <input
                                type="text"
                                value={capsuleId}
                                onChange={(e) => setCapsuleId(e.target.value)}
                                placeholder="Enter Capsule ID for Craig mode..."
                                className="capsule-id-input"
                            />
                            <small>Capsule ID is required for Craig to access your personal context</small>
                        </div>
                    )}
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
