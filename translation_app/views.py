import os
import json
import requests
import traceback
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

# Together AI API for LLaMA 2 translation
TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"
TOGETHER_API_KEY = os.environ.get("TOGETHER_API_KEY")

if not TOGETHER_API_KEY:
    raise ValueError("API Key is missing! Make sure it's set in the environment.")

# Create your views here.
def index(request):
    return render(request, "translation_app/index.html")

@csrf_exempt
def translate_text(request):
    print("translate_text function called")  # Debugging

    if request.method == "POST":
        try:
            print("Received POST request")  # Debugging
            print("Raw request body:", request.body)

            data = json.loads(request.body)  
            print("Request data:", data)  

            text = data.get("text")
            target_language = data.get("language")
            print(text)

            if not text or not target_language:
                print("Missing parameters")  
                return JsonResponse({"error": "Missing parameters"}, status=400)

            print("Sending request to Together AI...")  

            headers = {
                "Authorization": f"Bearer {TOGETHER_API_KEY}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
                "messages": [
                    {"role": "system", "content": "You are a translation assistant. Respond with only the translated text, nothing else."},
                    {"role": "user", "content": f"Translate the following text to {target_language}: {text}"}
                ],
                "temperature": 0.7
            }


            print("Headers:", headers)  
            print("Payload:", payload)  

            response = requests.post(TOGETHER_API_URL, headers=headers, json=payload)

            print("Response status code:", response.status_code)  
            print("API Response:", response.text)  

            result = response.json()
            translated_text = result.get("choices", [{}])[0].get("message", {}).get("content", "Translation error")

            return JsonResponse({"translated_text": translated_text})

        except Exception as e:
            print("Error occurred:", str(e))  
            traceback.print_exc()  
            return JsonResponse({"error": str(e)}, status=500)

    print("Invalid request method")  
    return JsonResponse({"error": "Invalid request"}, status=400)
