# gemini_helper.py
import os
import json
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

class GeminiAgent:
    """Wrapper class to provide OpenAI Agent-like interface for Gemini."""
    
    def __init__(self, name: str, instructions: str, model: str = "gemini-pro-latest"):
        self.name = name
        self.instructions = instructions
        self.model = genai.GenerativeModel(model)
    
    async def run(self, input_text: str, conversation_history: list = None) -> str:
        """Run the Gemini model with the given input."""
        try:
            # Build the full prompt
            full_prompt = f"{self.instructions}\n\n{input_text}"
            
            # If there's conversation history, include it
            if conversation_history:
                history_text = "\n".join([
                    f"{msg['role'].title()}: {msg['content']}"
                    for msg in conversation_history[-8:]
                ])
                full_prompt = f"Previous conversation:\n{history_text}\n\n{full_prompt}"
            
            # Generate response using run_in_executor for async compatibility
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                self.model.generate_content,
                full_prompt
            )
            return response.text
            
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")

async def run_gemini_agent(agent: GeminiAgent, input_text: str, conversation_history: list = None) -> str:
    """Helper function to run a Gemini agent."""
    return await agent.run(input_text, conversation_history)