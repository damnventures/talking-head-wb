using UnityEngine;

[CreateAssetMenu(fileName = "TalkBitchConfig", menuName = "TalkBitch/Configuration")]
public class TalkBitchConfig : ScriptableObject
{
    [Header("API Keys")]
    [SerializeField] private string openAIApiKey = "YOUR_OPENAI_API_KEY_HERE";
    [SerializeField] private string elevenlabsApiKey = "YOUR_ELEVENLABS_API_KEY";

    [Header("Ready Player Me")]
    [SerializeField] private string rpmSubdomain = "talking-head-5ujkzr";
    [SerializeField] private string rpmAppId = "68ea95b878accbce7496609b";
    [SerializeField] private string rpmOrgId = "6393b25e42f042dec41108d1";

    [Header("Default Avatar")]
    [SerializeField] private string defaultAvatarUrl = "https://models.readyplayer.me/68ea9e6ec138a9c842570bf9.glb?morphTargets=ARKit,Oculus&textureAtlas=none";

    [Header("Voice Settings")]
    [SerializeField] private string defaultVoice = "Rachel";

    public string OpenAIApiKey => openAIApiKey;
    public string ElevenlabsApiKey => elevenlabsApiKey;
    public string RpmSubdomain => rpmSubdomain;
    public string RpmAppId => rpmAppId;
    public string RpmOrgId => rpmOrgId;
    public string DefaultAvatarUrl => defaultAvatarUrl;
    public string DefaultVoice => defaultVoice;

    public bool IsOpenAIConfigured => !string.IsNullOrEmpty(openAIApiKey) && openAIApiKey != "YOUR_OPENAI_API_KEY_HERE";
    public bool IsElevenlabsConfigured => !string.IsNullOrEmpty(elevenlabsApiKey) && elevenlabsApiKey != "YOUR_ELEVENLABS_API_KEY";

    private void OnValidate()
    {
        // Validate configuration on changes
        if (string.IsNullOrEmpty(openAIApiKey) || openAIApiKey == "YOUR_OPENAI_API_KEY_HERE")
        {
            Debug.LogWarning("OpenAI API key not configured in TalkBitchConfig!");
        }

        if (string.IsNullOrEmpty(elevenlabsApiKey) || elevenlabsApiKey == "YOUR_ELEVENLABS_API_KEY")
        {
            Debug.LogWarning("ElevenLabs API key not configured in TalkBitchConfig!");
        }
    }

#if UNITY_EDITOR
    [ContextMenu("Validate Configuration")]
    public void ValidateConfiguration()
    {
        Debug.Log($"OpenAI Configured: {IsOpenAIConfigured}");
        Debug.Log($"ElevenLabs Configured: {IsElevenlabsConfigured}");
        Debug.Log($"Default Avatar URL: {defaultAvatarUrl}");
        Debug.Log($"Default Voice: {defaultVoice}");
    }
#endif
}