using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using OpenAI;

public class ConversationManager : MonoBehaviour
{
    [SerializeField] private Button sendButton;
    [SerializeField] private InputField inputField;
    [SerializeField] private Text conversationText;
    [SerializeField] private Animator avatarAnimator;

    private OpenAIApi openai;
    private List<ChatMessage> messages = new List<ChatMessage>();

    [SerializeField] private string openAIApiKey = "YOUR_OPENAI_API_KEY_HERE";

    private void Awake()
    {
        // Initialize OpenAI with API key (set in inspector or via script)
        if (string.IsNullOrEmpty(openAIApiKey) || openAIApiKey == "YOUR_OPENAI_API_KEY_HERE")
        {
            Debug.LogError("OpenAI API Key not set! Please set it in the ConversationManager inspector.");
            return;
        }

        openai = new OpenAIApi(openAIApiKey);

        sendButton.onClick.AddListener(OnSendButtonClicked);

        // Initialize conversation with system message
        messages.Add(new ChatMessage()
        {
            Role = "system",
            Content = "You are a Ready Player Me avatar, who exists in the metaverse. You are friendly, engaging, and love to chat about virtual worlds, avatars, and digital experiences."
        });

        // Set initial conversation text
        conversationText.text = "AI: Hello! I'm your Ready Player Me avatar. What would you like to talk about?\n\n";
    }

    private async void OnSendButtonClicked()
    {
        var message = inputField.text.Trim();

        if (string.IsNullOrEmpty(message))
            return;

        // Disable send button during processing
        sendButton.interactable = false;

        // Add user message to conversation
        conversationText.text += $"You: {message}\n\n";
        inputField.text = string.Empty;

        // Add user message to chat history
        messages.Add(new ChatMessage()
        {
            Role = "user",
            Content = message
        });

        try
        {
            // Make request to OpenAI
            var request = new CreateChatCompletionRequest()
            {
                Model = "gpt-3.5-turbo",
                Messages = messages,
                MaxTokens = 150,
                Temperature = 0.7f
            };

            var response = await openai.CreateChatCompletion(request);

            if (response.Choices != null && response.Choices.Count > 0)
            {
                var reply = response.Choices[0].Message.Content;

                // Add AI response to chat history
                messages.Add(new ChatMessage()
                {
                    Role = "assistant",
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
            conversationText.text += "AI: Sorry, I'm having trouble connecting right now. Please try again.\n\n";
        }
        finally
        {
            // Re-enable send button
            sendButton.interactable = true;
        }
    }
}