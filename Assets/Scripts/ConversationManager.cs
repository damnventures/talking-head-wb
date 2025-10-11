using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System.Threading.Tasks;
using System.Text;

public enum ChatModel
{
    FriendlyChat,
    ArgueMode
}

[System.Serializable]
public class ChatMessage
{
    public string role;
    public string content;
}

[System.Serializable]
public class OpenAIRequest
{
    public string model;
    public ChatMessage[] messages;
    public int max_tokens;
    public float temperature;
}

[System.Serializable]
public class OpenAIChoice
{
    public ChatMessage message;
}

[System.Serializable]
public class OpenAIResponse
{
    public OpenAIChoice[] choices;
}

public class ConversationManager : MonoBehaviour
{
    [Header("UI Components")]
    [SerializeField] private Button sendButton;
    [SerializeField] private InputField inputField;
    [SerializeField] private Text conversationText;
    [SerializeField] private Toggle friendlyChatToggle;
    [SerializeField] private Toggle argueModeToggle;
    [SerializeField] private InputField capsuleIdInput;
    [SerializeField] private GameObject capsuleIdPanel;

    [Header("Avatar Components")]
    [SerializeField] public Animator avatarAnimator;
    private AvatarAnimationController animationController;

    [Header("API Configuration")]
    [SerializeField] private string openAIApiKey = "YOUR_OPENAI_API_KEY_HERE";
    [SerializeField] private string elevenlabsApiKey = "YOUR_ELEVENLABS_API_KEY";

    [Header("Systems")]
    private PipecatTTS ttsSystem;
    private ArgueAPI argueAPI;

    private List<ChatMessage> messages = new List<ChatMessage>();
    private ChatModel currentModel = ChatModel.FriendlyChat;
    private bool isConnected = false;

    // Rate limiting for free tier (3 requests per minute)
    private float lastRequestTime = 0f;
    private const float REQUEST_INTERVAL = 20f; // 20 seconds between requests

    private void Awake()
    {
        // Initialize systems
        InitializeSystems();
        InitializeUI();
        TestConnection();

        // Initialize conversation with system message
        messages.Add(new ChatMessage
        {
            role = "system",
            content = "You are a Ready Player Me avatar, who exists in the metaverse. You are friendly, engaging, and love to chat about virtual worlds, avatars, and digital experiences. Keep responses conversational and under 50 words."
        });

        // Set initial conversation text
        conversationText.text = "AI: Hello! I'm your Ready Player Me avatar. What would you like to talk about?\n\n";
    }

    private void InitializeSystems()
    {
        // OpenAI will be handled via HTTP requests - no client initialization needed

        // Initialize TTS system
        GameObject ttsObj = new GameObject("PipecatTTS");
        ttsObj.transform.SetParent(transform);
        ttsSystem = ttsObj.AddComponent<PipecatTTS>();
        ttsSystem.SetApiKey(elevenlabsApiKey);
        ttsSystem.SetVoice("Rachel"); // Default to Rachel voice

        // Initialize Argue API
        GameObject argueObj = new GameObject("ArgueAPI");
        argueObj.transform.SetParent(transform);
        argueAPI = argueObj.AddComponent<ArgueAPI>();

        // Initialize animation controller
        GameObject animObj = new GameObject("AvatarAnimationController");
        animObj.transform.SetParent(transform);
        animationController = animObj.AddComponent<AvatarAnimationController>();
        if (avatarAnimator != null)
        {
            animationController.SetAnimator(avatarAnimator);
        }
    }

    private void InitializeUI()
    {
        sendButton.onClick.AddListener(OnSendButtonClicked);

        // Set up model switcher
        if (friendlyChatToggle != null)
        {
            friendlyChatToggle.onValueChanged.AddListener(OnFriendlyChatToggled);
            friendlyChatToggle.isOn = true;
        }

        if (argueModeToggle != null)
        {
            argueModeToggle.onValueChanged.AddListener(OnArgueModeToggled);
            argueModeToggle.isOn = false;
        }

        UpdateUIForModel();
    }

    private void TestConnection()
    {
        if (!string.IsNullOrEmpty(openAIApiKey) && openAIApiKey != "YOUR_OPENAI_API_KEY_HERE")
        {
            isConnected = true;
            AddSystemMessage("OpenAI connection ready.");

            if (!string.IsNullOrEmpty(elevenlabsApiKey) && elevenlabsApiKey != "YOUR_ELEVENLABS_API_KEY")
            {
                AddSystemMessage("High-quality TTS (ElevenLabs) initialized.");
            }
            else
            {
                AddSystemMessage("TTS initialized with fallback voice.");
            }
        }
        else
        {
            AddSystemMessage("Warning: OpenAI API key not configured.");
        }
    }

    private void OnFriendlyChatToggled(bool isOn)
    {
        if (isOn)
        {
            currentModel = ChatModel.FriendlyChat;
            if (argueModeToggle != null) argueModeToggle.isOn = false;
            UpdateUIForModel();
        }
    }

    private void OnArgueModeToggled(bool isOn)
    {
        if (isOn)
        {
            currentModel = ChatModel.ArgueMode;
            if (friendlyChatToggle != null) friendlyChatToggle.isOn = false;
            UpdateUIForModel();
        }
    }

    private void UpdateUIForModel()
    {
        if (capsuleIdPanel != null)
        {
            capsuleIdPanel.SetActive(currentModel == ChatModel.ArgueMode);
        }
    }

    private void AddSystemMessage(string message)
    {
        conversationText.text += $"System: {message}\n\n";
    }

    private async void OnSendButtonClicked()
    {
        var message = inputField.text.Trim();

        if (string.IsNullOrEmpty(message))
            return;

        // Check rate limiting (free tier: 3 requests per minute)
        float timeSinceLastRequest = Time.time - lastRequestTime;
        if (timeSinceLastRequest < REQUEST_INTERVAL)
        {
            float waitTime = REQUEST_INTERVAL - timeSinceLastRequest;
            conversationText.text += $"System: Rate limit - please wait {waitTime:F0} seconds before sending another message.\n\n";
            return;
        }

        // Disable send button during processing
        sendButton.interactable = false;

        // Add user message to conversation
        conversationText.text += $"You: {message}\n\n";
        inputField.text = string.Empty;

        try
        {
            string reply = "";

            if (currentModel == ChatModel.ArgueMode)
            {
                // Use Argue API (Craig style)
                string capsuleId = capsuleIdInput?.text?.Trim() ?? "";
                Debug.Log("DEBUG: Calling Argue API...");

                bool apiCallComplete = false;
                string apiResult = "";
                string apiError = "";

                argueAPI.CallArgueAPI(capsuleId, message, openAIApiKey,
                    (response) => {
                        apiResult = response;
                        apiCallComplete = true;
                    },
                    (errorMessage) => {
                        apiError = errorMessage;
                        apiCallComplete = true;
                    });

                // Wait for API call to complete
                while (!apiCallComplete)
                {
                    await Task.Yield();
                }

                if (!string.IsNullOrEmpty(apiError))
                {
                    throw new Exception(apiError);
                }

                reply = apiResult;
            }
            else
            {
                // Use OpenAI (regular chat)
                Debug.Log("DEBUG: Calling OpenAI...");

                // Add user message to chat history
                messages.Add(new ChatMessage
                {
                    role = "user",
                    content = message
                });

                // Update last request time
                lastRequestTime = Time.time;

                // Make HTTP request to OpenAI API
                reply = await CallOpenAIAPI(messages);

                if (!string.IsNullOrEmpty(reply))
                {
                    // Add AI response to chat history
                    messages.Add(new ChatMessage
                    {
                        role = "assistant",
                        content = reply
                    });
                }
                else
                {
                    throw new Exception("No response received from OpenAI");
                }
            }

            if (!string.IsNullOrEmpty(reply))
            {
                // Update conversation display
                conversationText.text += $"AI: {reply}\n\n";

                // Start avatar talking animation
                if (animationController != null)
                {
                    animationController.StartTalking(reply);
                }
                else if (avatarAnimator != null)
                {
                    avatarAnimator.SetTrigger("Talk");
                }

                // Use Pipecat TTS to speak the response
                if (ttsSystem != null)
                {
                    ttsSystem.Speak(reply, () => {
                        // TTS finished callback
                        Debug.Log("TTS finished speaking");
                    });
                }
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Error in conversation: {e.Message}");
            HandleError(e);
        }
        finally
        {
            // Re-enable send button
            sendButton.interactable = true;
        }
    }


    private void HandleError(Exception e)
    {
        if (e.Message.Contains("429"))
        {
            conversationText.text += "AI: Rate limit exceeded. Please wait before sending another message.\n\n";
        }
        else if (e.Message.Contains("401"))
        {
            conversationText.text += "AI: API key issue. Please check your OpenAI configuration.\n\n";
        }
        else if (e.Message.Contains("Capsule ID"))
        {
            conversationText.text += $"System: {e.Message}\n\n";
        }
        else
        {
            conversationText.text += "AI: Sorry, I'm having trouble connecting right now. Please try again.\n\n";
        }
    }

    public void SetAvatarAnimator(Animator animator)
    {
        avatarAnimator = animator;
        if (animationController != null)
        {
            animationController.SetAnimator(animator);
        }
    }

    public void SetAvatarMeshRenderer(SkinnedMeshRenderer meshRenderer)
    {
        if (animationController != null)
        {
            animationController.SetMeshRenderer(meshRenderer);
        }
    }

    public void SetOpenAIApiKey(string apiKey)
    {
        openAIApiKey = apiKey;
        if (!string.IsNullOrEmpty(apiKey) && apiKey != "YOUR_OPENAI_API_KEY_HERE")
        {
            TestConnection();
        }
    }

    public void SetElevenlabsApiKey(string apiKey)
    {
        elevenlabsApiKey = apiKey;
        if (ttsSystem != null)
        {
            ttsSystem.SetApiKey(apiKey);
        }
    }

    private async Task<string> CallOpenAIAPI(List<ChatMessage> messages)
    {
        OpenAIRequest request = new OpenAIRequest
        {
            model = "gpt-4o",
            messages = messages.ToArray(),
            max_tokens = 150,
            temperature = 0.7f
        };

        string jsonData = JsonUtility.ToJson(request);

        using (UnityWebRequest webRequest = new UnityWebRequest("https://api.openai.com/v1/chat/completions", "POST"))
        {
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
            webRequest.uploadHandler = new UploadHandlerRaw(bodyRaw);
            webRequest.downloadHandler = new DownloadHandlerBuffer();

            webRequest.SetRequestHeader("Content-Type", "application/json");
            webRequest.SetRequestHeader("Authorization", $"Bearer {openAIApiKey}");

            var operation = webRequest.SendWebRequest();
            while (!operation.isDone)
            {
                await Task.Yield();
            }

            if (webRequest.result == UnityWebRequest.Result.Success)
            {
                OpenAIResponse response = JsonUtility.FromJson<OpenAIResponse>(webRequest.downloadHandler.text);
                if (response.choices != null && response.choices.Length > 0)
                {
                    return response.choices[0].message.content;
                }
            }
            else
            {
                Debug.LogError($"OpenAI API Error: {webRequest.error} - {webRequest.downloadHandler.text}");
                throw new Exception($"OpenAI API failed: {webRequest.error}");
            }
        }

        return null;
    }
}