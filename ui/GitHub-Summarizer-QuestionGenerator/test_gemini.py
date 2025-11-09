# Test script to list available Gemini models
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

print("Listing available Gemini models:")
print("=" * 50)

for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"\nModel: {model.name}")
        print(f"Display Name: {model.display_name}")
        print(f"Description: {model.description}")
        print(f"Supported methods: {model.supported_generation_methods}")