import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Configuration - points to Vercel API
const API_BASE_URL = 'https://your-vercel-url.vercel.app'; // TODO: Update with actual Vercel URL

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'Welcome! I can help you with information and conversation.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiModel, setAiModel] = useState('openai');
  const [capsuleId, setCapsuleId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://models.readyplayer.me/6790ea53904cea3d6a69c07c.glb');

  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const avatarRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize Three.js scene
  const onContextCreate = async (gl) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    // Renderer
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x1a1a1a);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 1);
    camera.lookAt(0, 1.2, 0);
    cameraRef.current = camera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 1);
    scene.add(directionalLight);

    // Load avatar
    try {
      const loader = new GLTFLoader();
      loader.load(
        avatarUrl,
        (gltf) => {
          const avatar = gltf.scene;
          avatar.position.set(0, 0, 0);
          avatar.scale.set(1, 1, 1);
          scene.add(avatar);
          avatarRef.current = avatar;
          console.log('✓ Avatar loaded successfully');
        },
        (progress) => {
          console.log('Loading avatar...', (progress.loaded / progress.total * 100).toFixed(0) + '%');
        },
        (error) => {
          console.error('Error loading avatar:', error);
        }
      );
    } catch (error) {
      console.error('Avatar load error:', error);
    }

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Rotate avatar slowly
      if (avatarRef.current) {
        avatarRef.current.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  // Send message
  const handleSendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const endpoint = aiModel === 'craig'
        ? `${API_BASE_URL}/api/argue-prompt`
        : `${API_BASE_URL}/api/chat`;

      const body = aiModel === 'craig'
        ? { message: userMessage, capsuleId }
        : { message: userMessage };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      const aiResponse = data.response || data.message || 'No response';

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'system', content: 'Error: ' + error.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <GLView
            style={styles.glView}
            onContextCreate={onContextCreate}
          />
        </View>

        {/* Chat Section */}
        <View style={styles.chatSection}>
          {/* Model Selector */}
          <View style={styles.modelSelector}>
            <TouchableOpacity
              style={[styles.modelButton, aiModel === 'openai' && styles.modelButtonActive]}
              onPress={() => setAiModel('openai')}
            >
              <Text style={[styles.modelButtonText, aiModel === 'openai' && styles.modelButtonTextActive]}>
                GPT-4o
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modelButton, aiModel === 'craig' && styles.modelButtonActive]}
              onPress={() => setAiModel('craig')}
            >
              <Text style={[styles.modelButtonText, aiModel === 'craig' && styles.modelButtonTextActive]}>
                Craig
              </Text>
            </TouchableOpacity>
          </View>

          {/* Capsule ID Input (Craig mode) */}
          {aiModel === 'craig' && (
            <View style={styles.capsuleInput}>
              <TextInput
                style={styles.capsuleTextInput}
                placeholder="Capsule ID"
                value={capsuleId}
                onChangeText={setCapsuleId}
              />
            </View>
          )}

          {/* Messages */}
          <ScrollView style={styles.messagesContainer}>
            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.message,
                  msg.role === 'user' ? styles.messageUser :
                  msg.role === 'ai' ? styles.messageAI :
                  styles.messageSystem
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.role === 'user' && styles.messageTextUser
                ]}>
                  {msg.content}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={isLoading}
            >
              <Text style={styles.sendButtonText}>
                {isLoading ? '...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  avatarSection: {
    flex: 2,
    backgroundColor: '#1a1a1a',
  },
  glView: {
    flex: 1,
  },
  chatSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
  },
  modelSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  modelButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  modelButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  modelButtonTextActive: {
    color: '#fff',
  },
  capsuleInput: {
    marginBottom: 10,
  },
  capsuleTextInput: {
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 10,
  },
  message: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  messageUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  messageAI: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  messageSystem: {
    alignSelf: 'center',
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeeba',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  messageTextUser: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  textInput: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sendButton: {
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
