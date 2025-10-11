using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

[System.Serializable]
public class Voice
{
    public string voice_id;
    public string name;
}

[System.Serializable]
public class VoicesResponse
{
    public Voice[] voices;
}

[System.Serializable]
public class VoiceSettings
{
    public float stability = 0.75f;
    public float similarity_boost = 0.75f;
    public float style = 0.5f;
    public bool use_speaker_boost = true;
}

[System.Serializable]
public class TTSRequest
{
    public string text;
    public VoiceSettings voice_settings;
}

public class PipecatTTS : MonoBehaviour
{
    [SerializeField] private string apiKey = "YOUR_ELEVENLABS_API_KEY";
    [SerializeField] private string selectedVoice = "Rachel";

    private const string BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech";
    private const string VOICES_URL = "https://api.elevenlabs.io/v1/voices";

    // High-quality voice options with their IDs
    private readonly System.Collections.Generic.Dictionary<string, string> voices = new System.Collections.Generic.Dictionary<string, string>()
    {
        {"Adam", "pNInz6obpgDQGcFmaJgB"},     // Deep, narrative
        {"Rachel", "21m00Tcm4TlvDq8ikWAM"},   // Professional, warm
        {"Nicole", "piTKgcLEGmPE4e6mEKli"},   // Young adult, confident
        {"Domi", "AZnzlk1XvdvUeBnXmlld"},     // Strong, confident
        {"Bella", "EXAVITQu4vr4xnSDxMaL"}     // Soft, pleasant
    };

    private VoiceSettings voiceSettings = new VoiceSettings();
    private AudioSource audioSource;

    private void Awake()
    {
        audioSource = gameObject.AddComponent<AudioSource>();
        audioSource.playOnAwake = false;
    }

    public void SetApiKey(string key)
    {
        apiKey = key;
    }

    public void SetVoice(string voiceName)
    {
        if (voices.ContainsKey(voiceName))
        {
            selectedVoice = voiceName;
        }
    }

    public void Speak(string text, System.Action onComplete = null)
    {
        if (string.IsNullOrEmpty(apiKey) || apiKey == "YOUR_ELEVENLABS_API_KEY")
        {
            Debug.LogWarning("ElevenLabs API key not configured, falling back to debug log");
            FallbackSpeak(text);
            onComplete?.Invoke();
            return;
        }

        StartCoroutine(SpeakCoroutine(text, onComplete));
    }

    private IEnumerator SpeakCoroutine(string text, System.Action onComplete)
    {
        string voiceId = voices.ContainsKey(selectedVoice) ? voices[selectedVoice] : voices["Rachel"];
        string url = $"{BASE_URL}/{voiceId}";

        TTSRequest requestData = new TTSRequest
        {
            text = text,
            voice_settings = voiceSettings
        };

        string jsonData = JsonUtility.ToJson(requestData);

        using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();

            request.SetRequestHeader("Accept", "audio/mpeg");
            request.SetRequestHeader("Content-Type", "application/json");
            request.SetRequestHeader("xi-api-key", apiKey);

            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                // Convert audio data to AudioClip
                byte[] audioData = request.downloadHandler.data;

                // Save to temporary file for AudioClip loading
                string tempPath = System.IO.Path.Combine(Application.persistentDataPath, "temp_audio.mp3");
                System.IO.File.WriteAllBytes(tempPath, audioData);

                // Load and play audio
                yield return StartCoroutine(LoadAndPlayAudio(tempPath, onComplete));
            }
            else
            {
                Debug.LogError($"ElevenLabs TTS failed: {request.error}");
                FallbackSpeak(text);
                onComplete?.Invoke();
            }
        }
    }

    private IEnumerator LoadAndPlayAudio(string filePath, System.Action onComplete)
    {
        string url = "file://" + filePath;

        using (UnityWebRequest www = UnityWebRequestMultimedia.GetAudioClip(url, AudioType.MPEG))
        {
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                AudioClip audioClip = DownloadHandlerAudioClip.GetContent(www);

                if (audioClip != null)
                {
                    audioSource.clip = audioClip;
                    audioSource.Play();

                    Debug.Log("ElevenLabs TTS: Speaking with high-quality voice");

                    // Wait for audio to finish
                    yield return new WaitForSeconds(audioClip.length);
                }
            }
            else
            {
                Debug.LogError($"Failed to load audio file: {www.error}");
                FallbackSpeak("Audio playback failed");
            }
        }

        // Clean up temp file
        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
        }

        onComplete?.Invoke();
    }

    private void FallbackSpeak(string text)
    {
        Debug.Log($"Fallback TTS: {text}");
        // Could integrate Unity's built-in TTS here if available
        // For now, just log the message
    }

    public IEnumerator GetAvailableVoices(System.Action<Voice[]> callback)
    {
        if (string.IsNullOrEmpty(apiKey) || apiKey == "YOUR_ELEVENLABS_API_KEY")
        {
            callback?.Invoke(new Voice[0]);
            yield break;
        }

        using (UnityWebRequest request = UnityWebRequest.Get(VOICES_URL))
        {
            request.SetRequestHeader("xi-api-key", apiKey);

            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                VoicesResponse response = JsonUtility.FromJson<VoicesResponse>(request.downloadHandler.text);
                callback?.Invoke(response.voices);
            }
            else
            {
                Debug.LogError($"Failed to fetch voices: {request.error}");
                callback?.Invoke(new Voice[0]);
            }
        }
    }
}