# api.py
import os
import asyncio
import re
import subprocess
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Key is loaded
load_dotenv()

from agents import Agent, Runner  # from openai-agents

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []

class ChatResponse(BaseModel):
    reply: str

code_coach = Agent(
    name="Tutor",
    instructions="You are a helpful programming and coding assistant. You provide general coding advice, explanations, and help with programming concepts. WRAP ALL MATH in $$$$ (MathJax) and all CODE in ````` (code ticks)"
)
assistant = Agent(
    name="App assistant",
    instructions="You are a helpful programming and coding assistant. You provide general coding advice, explanations, and help with programming concepts. WRAP ALL MATH in $$$$ (MathJax) and all CODE in ````` (code ticks)",
    handoffs=[code_coach]
)


def detect_github_url(text: str) -> Optional[str]:
    """Detect GitHub repository URL in text."""
    # Updated pattern to handle trailing slashes and various URL formats
    github_pattern = r'(https://)?github\.com/([^/\s]+)/([^/\s]+?)(?:/.*|$)'
    match = re.search(github_pattern, text)
    if match:
        # Extract just the basic repo URL
        username, repo = match.groups()
        # Clean repo name by removing any trailing characters
        repo = repo.rstrip('/')
        return f"https://github.com/{username}/{repo}"
    return None

async def analyze_github_repository(repo_url: str) -> str:
    """Analyze a GitHub repository using CLI analyzer."""
    try:
        # Call the CLI analyzer directly
        result = subprocess.run([
            'python3', 'cli_analyzer.py', 'analyze', repo_url
        ],
        capture_output=True,
        text=True,
        cwd='.'  # Run in current directory
        )
        
        if result.returncode == 0:
            # Return the CLI output directly
            return result.stdout
        else:
            # Handle error case
            error_msg = result.stderr if result.stderr else "Unknown error occurred"
            return f"❌ **Error analyzing repository {repo_url}:**\n\nI couldn't analyze this repository. This could be due to:\n• Invalid or inaccessible repository URL\n• Repository is private\n• Network connectivity issues\n• Repository is too large or has unusual structure\n\nError details: {error_msg}\n\nPlease check the URL and try again with a public repository."
        
    except Exception as e:
        return f"❌ **Error running repository analysis:**\n\nThere was a problem executing the analysis tool.\n\nError details: {str(e)}"

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # Check if the message contains a GitHub URL
    github_url = detect_github_url(req.message)
    
    if github_url:
        # Analyze the GitHub repository
        analysis_result = await analyze_github_repository(github_url)
        return ChatResponse(reply=analysis_result)
    else:
        # Normal chat flow
        # Build context from conversation history
        messages = []
        
        # Add conversation history
        if req.history:
            for msg in req.history[-8:]:  # Limit to last 8 messages to avoid token limits
                messages.append(f"{msg.role.title()}: {msg.content}")
        
        # Add current message
        messages.append(f"User: {req.message}")
        
        # Join into conversation context
        conversation_context = "\n".join(messages)
        
        result = await Runner.run(
            starting_agent=assistant,
            input=conversation_context,
        )
        
        return ChatResponse(reply=result.final_output)
