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
        loadedAvatar.transform.localScale = Vector3.one;

        // Get the animator and mesh renderer components
        var animator = loadedAvatar.GetComponent<Animator>();
        var meshRenderer = loadedAvatar.GetComponentInChildren<SkinnedMeshRenderer>();
        var conversationManager = FindObjectOfType<ConversationManager>();

        if (conversationManager != null)
        {
            if (animator != null)
            {
                // Set the animator controller from our project
                var animatorController = Resources.Load<RuntimeAnimatorController>("AvatarController");
                if (animatorController != null)
                {
                    animator.runtimeAnimatorController = animatorController;
                }

                // Connect the animator to conversation manager
                conversationManager.SetAvatarAnimator(animator);
                Debug.Log("Avatar animator connected to ConversationManager");
            }

            if (meshRenderer != null)
            {
                // Connect the mesh renderer for morph target animations
                conversationManager.SetAvatarMeshRenderer(meshRenderer);
                Debug.Log("Avatar mesh renderer connected for morph targets");
            }
        }
        else
        {
            Debug.LogWarning("ConversationManager not found!");
        }

        if (animator == null && meshRenderer == null)
        {
            Debug.LogWarning("No animator or mesh renderer found on loaded avatar");
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