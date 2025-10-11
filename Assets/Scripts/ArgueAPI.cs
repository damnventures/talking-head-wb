using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

[System.Serializable]
public class ArgueRequest
{
    public string capsuleId;
    public string question;
    public string userApiKey;
}

[System.Serializable]
public class ArgueResponse
{
    public string response;
}

public class ArgueAPI : MonoBehaviour
{
    private const string ARGUE_ENDPOINT = "https://craig.shrinked.ai/api/argue";

    public void CallArgueAPI(string capsuleId, string question, string openAIApiKey, System.Action<string> onSuccess, System.Action<string> onError)
    {
        if (string.IsNullOrEmpty(capsuleId))
        {
            onError?.Invoke("Capsule ID is required for Argue mode. Please enter a capsule ID.");
            return;
        }

        StartCoroutine(CallArgueAPICoroutine(capsuleId, question, openAIApiKey, onSuccess, onError));
    }

    private IEnumerator CallArgueAPICoroutine(string capsuleId, string question, string openAIApiKey, System.Action<string> onSuccess, System.Action<string> onError)
    {
        ArgueRequest requestData = new ArgueRequest
        {
            capsuleId = capsuleId.Trim(),
            question = question.Trim(),
            userApiKey = openAIApiKey
        };

        string jsonData = JsonUtility.ToJson(requestData);

        using (UnityWebRequest request = new UnityWebRequest(ARGUE_ENDPOINT, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            Debug.Log($"DEBUG: Calling Argue API with capsule: {capsuleId}");

            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    ArgueResponse response = JsonUtility.FromJson<ArgueResponse>(request.downloadHandler.text);
                    string reply = response.response ?? "No response received from Craig.";

                    Debug.Log($"DEBUG: Argue API Success: {reply}");
                    onSuccess?.Invoke(reply);
                }
                catch (System.Exception ex)
                {
                    Debug.LogError($"Failed to parse Argue API response: {ex.Message}");
                    onError?.Invoke($"Failed to parse response from Craig: {ex.Message}");
                }
            }
            else
            {
                string errorMessage = $"Argue API failed: {request.responseCode} {request.error}";

                if (!string.IsNullOrEmpty(request.downloadHandler.text))
                {
                    errorMessage += $" - {request.downloadHandler.text}";
                }

                Debug.LogError($"Argue API Error: {errorMessage}");
                onError?.Invoke(errorMessage);
            }
        }
    }
}