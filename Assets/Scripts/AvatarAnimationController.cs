using System.Collections;
using UnityEngine;

public class AvatarAnimationController : MonoBehaviour
{
    [SerializeField] private Animator avatarAnimator;
    [SerializeField] private SkinnedMeshRenderer avatarMeshRenderer;

    // Morph target indices - these match Ready Player Me standard
    private int mouthOpenIndex = -1;
    private int jawOpenIndex = -1;
    private int mouthSmileIndex = -1;

    // Animation state
    private bool isTalking = false;
    private Coroutine talkingCoroutine;

    // Morph target names that Ready Player Me uses
    private readonly string[] mouthOpenTargets = { "mouthOpen", "viseme_O", "jawOpen_pose" };
    private readonly string[] jawOpenTargets = { "jawOpen", "viseme_aa", "mouthOpen_pose" };
    private readonly string[] mouthSmileTargets = { "mouthSmile", "mouthSmile_L", "mouthSmile_R" };

    private void Start()
    {
        // Find the avatar mesh renderer if not assigned
        if (avatarMeshRenderer == null)
        {
            avatarMeshRenderer = GetComponentInChildren<SkinnedMeshRenderer>();
        }

        // Find morph target indices
        if (avatarMeshRenderer != null)
        {
            FindMorphTargetIndices();
        }
    }

    private void FindMorphTargetIndices()
    {
        Mesh sharedMesh = avatarMeshRenderer.sharedMesh;
        if (sharedMesh == null) return;

        // Find mouth open morph target
        foreach (string targetName in mouthOpenTargets)
        {
            int index = sharedMesh.GetBlendShapeIndex(targetName);
            if (index >= 0)
            {
                mouthOpenIndex = index;
                Debug.Log($"Found mouth open morph target: {targetName} at index {index}");
                break;
            }
        }

        // Find jaw open morph target
        foreach (string targetName in jawOpenTargets)
        {
            int index = sharedMesh.GetBlendShapeIndex(targetName);
            if (index >= 0)
            {
                jawOpenIndex = index;
                Debug.Log($"Found jaw open morph target: {targetName} at index {index}");
                break;
            }
        }

        // Find mouth smile morph target
        foreach (string targetName in mouthSmileTargets)
        {
            int index = sharedMesh.GetBlendShapeIndex(targetName);
            if (index >= 0)
            {
                mouthSmileIndex = index;
                Debug.Log($"Found mouth smile morph target: {targetName} at index {index}");
                break;
            }
        }

        if (mouthOpenIndex == -1 && jawOpenIndex == -1)
        {
            Debug.LogWarning("No mouth/jaw morph targets found. Falling back to animator triggers.");
        }
    }

    public void StartTalking(string text)
    {
        if (isTalking)
        {
            StopTalking();
        }

        isTalking = true;

        // Use morph targets if available, otherwise use animator
        if (avatarMeshRenderer != null && (mouthOpenIndex >= 0 || jawOpenIndex >= 0))
        {
            talkingCoroutine = StartCoroutine(TalkWithMorphTargets(text));
        }
        else if (avatarAnimator != null)
        {
            avatarAnimator.SetTrigger("Talk");
            avatarAnimator.SetBool("IsTalking", true);

            // Calculate duration based on text length
            float duration = Mathf.Max(3f, text.Length * 0.05f);
            talkingCoroutine = StartCoroutine(StopTalkingAfterDelay(duration));
        }

        Debug.Log("Avatar: Starting talk animation");
    }

    public void StopTalking()
    {
        if (talkingCoroutine != null)
        {
            StopCoroutine(talkingCoroutine);
            talkingCoroutine = null;
        }

        isTalking = false;

        // Reset morph targets
        if (avatarMeshRenderer != null)
        {
            if (mouthOpenIndex >= 0) avatarMeshRenderer.SetBlendShapeWeight(mouthOpenIndex, 0);
            if (jawOpenIndex >= 0) avatarMeshRenderer.SetBlendShapeWeight(jawOpenIndex, 0);
            if (mouthSmileIndex >= 0) avatarMeshRenderer.SetBlendShapeWeight(mouthSmileIndex, 0);
        }

        // Reset animator
        if (avatarAnimator != null)
        {
            avatarAnimator.SetBool("IsTalking", false);
        }

        Debug.Log("Avatar: Ending talk animation");
    }

    private IEnumerator TalkWithMorphTargets(string text)
    {
        float duration = Mathf.Max(3f, text.Length * 0.05f);
        float elapsed = 0f;

        // Add a subtle baseline smile
        if (mouthSmileIndex >= 0)
        {
            avatarMeshRenderer.SetBlendShapeWeight(mouthSmileIndex, 20f);
        }

        while (elapsed < duration && isTalking)
        {
            // Randomize mouth movements like the web version
            if (mouthOpenIndex >= 0)
            {
                float mouthOpenValue = Random.Range(0f, 80f);
                avatarMeshRenderer.SetBlendShapeWeight(mouthOpenIndex, mouthOpenValue);
            }

            if (jawOpenIndex >= 0)
            {
                float jawOpenValue = Random.Range(0f, 50f);
                avatarMeshRenderer.SetBlendShapeWeight(jawOpenIndex, jawOpenValue);
            }

            elapsed += Time.deltaTime;
            yield return new WaitForSeconds(0.1f); // Update 10 times per second
        }

        StopTalking();
    }

    private IEnumerator StopTalkingAfterDelay(float delay)
    {
        yield return new WaitForSeconds(delay);
        StopTalking();
    }

    public void SetAnimator(Animator animator)
    {
        avatarAnimator = animator;
    }

    public void SetMeshRenderer(SkinnedMeshRenderer meshRenderer)
    {
        avatarMeshRenderer = meshRenderer;
        if (meshRenderer != null)
        {
            FindMorphTargetIndices();
        }
    }

    public bool IsTalking => isTalking;
}