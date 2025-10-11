import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Avatar } from '@readyplayerme/visage';

// Import styles
import './styles.css';

const defaultAvatarUrl = "https://models.readyplayer.me/68ea9e6ec138a9c842570bf9.glb";
const talkingAnimationSrc = "https://readyplayerme.github.io/visage/male-talk.glb";

// Pipecat-style TTS using ElevenLabs (high-quality voices)
class PipecatTTS {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.elevenlabs.io/v1/text-to-speech';
        this.selectedVoice = 'Rachel'; // Default high-quality voice
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

                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                };

                await audio.play();
                console.log('ElevenLabs TTS: Speaking with high-quality voice');
            } else {
                throw new Error(`ElevenLabs API error: ${response.status}`);
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
    const [userInput, setUserInput] = useState('');
    const [isTalking, setIsTalking] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [ttsSystem, setTtsSystem] = useState(null);
    const chatBoxRef = useRef(null);

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

                    // Test TTS initialization
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

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!userInput.trim()) return;

        const newMessages = [...messages, { role: 'user', text: userInput }];
        setMessages(newMessages);
        setUserInput('');
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.CONFIG.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{role: "system", content: "You are a friendly avatar."}, ...newMessages.filter(m => m.role === 'user' || m.role === 'ai').map(m => ({role: m.role, content: m.text}))],
                    max_tokens: 150
                })
            });

            if (!response.ok) throw new Error(`API call failed: ${response.statusText}`);
            
            const data = await response.json();
            const reply = data.choices[0].message.content;

            setMessages(prev => [...prev, { role: 'ai', text: reply }]);
            setIsTalking(true);

            // Use Pipecat TTS to speak the response
            if (ttsSystem) {
                await ttsSystem.speak(reply);
            }

            setTimeout(() => setIsTalking(false), 5000);

        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { role: 'system', text: `Error: ${error.message}` }]);
        }
    };

    return (
        <div className="container">
            <div className="avatar-section">
                <div className="avatar-container">
                    <Avatar 
                        modelSrc={avatarUrl}
                        animationSrc={isTalking ? talkingAnimationSrc : null}
                        cameraInitialDistance={1.2}
                        cameraTarget={1.55}
                        environment="city"
                        style={{background: 'transparent'}}
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
                    <button className="load-avatar-btn" onClick={() => setAvatarUrl(inputUrl)}>Load Avatar</button>
                </div>
            </div>

            <div className="chat-section">
                <div className="chat-header">
                    <h1>
                        <span className={`status-indicator ${isConnected ? 'connected' : ''}`}></span>
                        TalkBitch Chat
                    </h1>
                    <p>Chat with your Ready Player Me avatar powered by OpenAI</p>
                </div>
                <div className="chat-messages" ref={chatBoxRef}>
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>{msg.text}</div>
                    ))}
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

ReactDOM.render(<App />, document.getElementById('root'));
