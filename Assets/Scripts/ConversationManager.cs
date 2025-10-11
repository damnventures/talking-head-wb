using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using System.Threading.Tasks;
using OpenAI;
using OpenAI.Chat;

public class ConversationManager : MonoBehaviour
{
    [SerializeField] private Button sendButton;
    [SerializeField] private InputField inputField;
    [SerializeField] private Text conversationText;
    [SerializeField] public Animator avatarAnimator;

    private OpenAIClient openai;
    private List<Message> messages = new List<Message>();

    [SerializeField] private string openAIApiKey = "YOUR_OPENAI_API_KEY_HERE";

    // Rate limiting for free tier (3 requests per minute)
    private float lastRequestTime = 0f;
    private const float REQUEST_INTERVAL = 20f; // 20 seconds between requests

    private void Awake()
    {
        // Initialize OpenAI with API key (set in inspector or via script)
        if (string.IsNullOrEmpty(openAIApiKey) || openAIApiKey == "YOUR_OPENAI_API_KEY_HERE")
        {
            Debug.LogError("OpenAI API Key not set! Please set it in the ConversationManager inspector.");
            return;
        }

        openai = new OpenAIClient(openAIApiKey);

        sendButton.onClick.AddListener(OnSendButtonClicked);

        // Initialize conversation with system message
        messages.Add(new Message()
        {
            Role = Role.System,
            Content = "You are a Ready Player Me avatar, who exists in the metaverse. You are friendly, engaging, and love to chat about virtual worlds, avatars, and digital experiences. Keep responses conversational and under 50 words."
        });

        // Set initial conversation text
        conversationText.text = "AI: Hello! I'm your Ready Player Me avatar. What would you like to talk about?\n\n";
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

        // Add user message to chat history
        messages.Add(new Message()
        {
            Role = Role.User,
            Content = message
        });

        try
        {
            // Update last request time
            lastRequestTime = Time.time;

            // Make request to OpenAI using GPT-5
            var chatRequest = new ChatRequest(
                messages: messages,
                model: "gpt-5", // Using GPT-5
                maxTokens: 150,
                temperature: 0.7
            );

            var response = await openai.ChatEndpoint.GetCompletionAsync(chatRequest);

            if (response?.Choices?.Count > 0)
            {
                var reply = response.Choices[0].Message.Content.ToString();

                // Add AI response to chat history
                messages.Add(new Message()
                {
                    Role = Role.Assistant,
                    Content = reply
                });

                // Update conversation display
                conversationText.text += $"AI: {reply}\n\n";

                // Trigger avatar talking animation if animator is assigned
                if (avatarAnimator != null)
                {
                    avatarAnimator.SetTrigger("Talk");
                }
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Error communicating with OpenAI: {e.Message}");

            if (e.Message.Contains("429"))
            {
                conversationText.text += "AI: Rate limit exceeded. Please wait before sending another message.\n\n";
            }
            else if (e.Message.Contains("401"))
            {
                conversationText.text += "AI: API key issue. Please check your OpenAI configuration.\n\n";
            }
            else
            {
                conversationText.text += "AI: Sorry, I'm having trouble connecting right now. Please try again.\n\n";
            }
        }
        finally
        {
            // Re-enable send button
            sendButton.interactable = true;
        }
    }
}