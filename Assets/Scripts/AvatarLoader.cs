using UnityEngine;
using ReadyPlayerMe.Core;

public class AvatarLoader : MonoBehaviour
{
    [SerializeField] private string avatarUrl = "https://models.readyplayer.me/YOUR_AVATAR_ID.glb";
    [SerializeField] private Transform avatarParent;

    private GameObject loadedAvatar;

    private void Start()
    {
        LoadAvatar();
    }

    public void LoadAvatar()
    {
        if (string.IsNullOrEmpty(avatarUrl))
        {
            Debug.LogWarning("Avatar URL is not set!");
            return;
        }

        var avatarLoader = new AvatarObjectLoader();
        avatarLoader.OnCompleted += OnAvatarLoaded;
        avatarLoader.OnFailed += OnAvatarLoadFailed;

        avatarLoader.LoadAvatar(avatarUrl);
    }

    private void OnAvatarLoaded(object sender, CompletionEventArgs args)
    {
        if (loadedAvatar != null)
        {
            DestroyImmediate(loadedAvatar);
        }

        loadedAvatar = args.Avatar;

        if (avatarParent != null)
        {
            loadedAvatar.transform.SetParent(avatarParent);
        }

        loadedAvatar.transform.localPosition = Vector3.zero;
        loadedAvatar.transform.localRotation = Quaternion.identity;

        // Get the animator component for conversation manager
        var animator = loadedAvatar.GetComponent<Animator>();
        var conversationManager = FindObjectOfType<ConversationManager>();
        if (conversationManager != null && animator != null)
        {
            // You can set the animator reference here if needed
            Debug.Log("Avatar loaded successfully with animator");
        }

        Debug.Log("Avatar loaded successfully!");
    }

    private void OnAvatarLoadFailed(object sender, FailureEventArgs args)
    {
        Debug.LogError($"Failed to load avatar: {args.Message}");
    }

    public void SetAvatarUrl(string newUrl)
    {
        avatarUrl = newUrl;
        LoadAvatar();
    }
}