# api.py
import os
import asyncio
import re
import subprocess
import sys
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Key is loaded
load_dotenv()

from agents import Agent, Runner  # from openai-agents

# Add bot directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'bot'))
try:
    from github_importer import import_repo
    from mcq_generator import generate_mcqs_for_repo
    CODE_TUTOR_AVAILABLE = True
except ImportError:
    CODE_TUTOR_AVAILABLE = False
    print("Warning: code_tutor modules not available. Code-based MCQs will be disabled.")

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

class ChallengeRequest(BaseModel):
    topic: str

class ChallengeQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str

class ChallengeResponse(BaseModel):
    questions: List[ChallengeQuestion]

code_coach = Agent(
    name="Tutor",
    instructions="You are a helpful programming and coding assistant. You provide general coding advice, explanations, and help with programming concepts. WRAP ALL MATH in Mathjax and all CODE in ````` (code ticks)"
)
assistant = Agent(
    name="App assistant",
    instructions="You are a helpful programming and coding assistant. You provide general coding advice, explanations, and help with programming concepts. WRAP ALL MATH in Mathjax and all CODE in ````` (code ticks)",
    handoffs=[code_coach]
)


def detect_github_url(text: str) -> Optional[str]:
    """Detect GitHub repository URL in text."""
    # Updated pattern to handle usernames and repos with hyphens, underscores, dots
    github_pattern = r'https://github\.com/([\w\-\.]+)/([\w\-\.]+?)(?:/.*|$|\s)'
    match = re.search(github_pattern, text)
    if match:
        # Extract just the basic repo URL
        username, repo = match.groups()
        # Clean repo name by removing any trailing characters
        repo = repo.rstrip('/').rstrip()
        return f"https://github.com/{username}/{repo}"
    return None

async def analyze_github_repository(repo_url: str) -> str:
    """Analyze a GitHub repository using CLI analyzer with clean output."""
    try:
        # Call the CLI analyzer directly with suppressed progress
        result = subprocess.run([
            'python3', 'cli_analyzer.py', 'analyze', repo_url
        ],
        capture_output=True,
        text=True,
        cwd='.',
        env={**os.environ, 'SUPPRESS_PROGRESS': '1'}  # Signal to suppress progress
        )
        
        if result.returncode == 0:
            # Clean up the output - remove progress indicators
            output = result.stdout
            
            # Remove spinner characters and progress bars
            import re
            # Remove lines with spinners (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏)
            output = re.sub(r'[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]\s.*?\n', '', output)
            # Remove progress bar lines
            output = re.sub(r'Loading file contents:.*?\n', '', output)
            # Remove success checkmarks from progress
            output = re.sub(r'✓\sLoaded.*?\n', '', output)
            # Remove empty lines at the start
            output = output.lstrip('\n')
            
            return output
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

@app.post("/challenge", response_model=ChallengeResponse)
async def generate_challenge(req: ChallengeRequest):
    """Generate challenge questions based on a topic or GitHub repository using AI or code analysis."""
    try:
        # Check if topic is a GitHub URL - if so, use code_tutor MCQ generation
        github_url = detect_github_url(req.topic)
        
        if github_url and CODE_TUTOR_AVAILABLE:
            # Generate code-based MCQs from the repository
            import tempfile
            import shutil
            
            temp_dir = None
            try:
                # Import/clone the repository
                temp_dir = import_repo(github_url)
                
                # Generate MCQs from the repo (mode 1 = Code Detective)
                mcqs = generate_mcqs_for_repo(temp_dir, mode=1, max_q=5)
                
                if not mcqs:
                    raise ValueError("No Python files found in repository to generate questions from")
                
                # Convert MCQs to ChallengeQuestion format
                questions = []
                for mcq in mcqs:
                    questions.append(ChallengeQuestion(
                        question=f"{mcq['question']}\n\n```python\n{mcq.get('snippet', 'No code snippet')}\n```",
                        options=mcq['options'],
                        answer=mcq['answer'],
                        explanation=mcq.get('explanation', 'No explanation provided')
                    ))
                
                return ChallengeResponse(questions=questions)
                
            finally:
                # Clean up temp directory
                if temp_dir and os.path.exists(temp_dir):
                    try:
                        shutil.rmtree(temp_dir)
                    except:
                        pass  # Ignore cleanup errors
        
        # Fall back to AI-generated questions for general topics
        challenge_agent = Agent(
            name="Challenge Question Generator",
            instructions=f"""You are an expert educator creating challenging multiple-choice questions.
            
Generate 3-5 high-quality multiple-choice questions about {req.topic}.

For each question:
1. Make it thought-provoking and educational
2. Provide 4 options (A, B, C, D)
3. Mark the correct answer
4. Include a brief explanation

Format your response EXACTLY as valid JSON:
{{
  "questions": [
    {{
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Explanation here"
    }}
  ]
}}

Make sure to return ONLY the JSON, no other text."""
        )
        
        # Run the agent
        result = await Runner.run(
            starting_agent=challenge_agent,
            input=f"Generate challenge questions about: {req.topic}",
        )
        
        # Parse the JSON response
        import json
        try:
            # Try to extract JSON from the response
            response_text = result.final_output.strip()
            
            # Find JSON block in response (in case there's extra text)
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                response_text = json_match.group(0)
            
            parsed_response = json.loads(response_text)
            
            # Validate and randomize answer positions for each question
            import random
            questions = []
            for q in parsed_response.get("questions", []):
                # Get the correct answer before shuffling
                correct_answer = q.get("answer")
                options = q.get("options", [])
                
                # Create a shuffled copy of options
                shuffled_options = options.copy()
                random.shuffle(shuffled_options)
                
                # The correct answer text stays the same, it just moves to a new position
                questions.append(ChallengeQuestion(
                    question=q.get("question"),
                    options=shuffled_options,
                    answer=correct_answer,  # This is still the text of the correct answer
                    explanation=q.get("explanation")
                ))
            
            return ChallengeResponse(questions=questions)
            
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            # If parsing fails, create a fallback question
            fallback_questions = [
                ChallengeQuestion(
                    question=f"What is a key concept related to {req.topic}?",
                    options=[
                        "Understanding fundamentals",
                        "Advanced techniques",
                        "Best practices",
                        "Common pitfalls"
                    ],
                    answer="Understanding fundamentals",
                    explanation=f"The response could not be parsed properly. Please try again with a different topic."
                )
            ]
            return ChallengeResponse(questions=fallback_questions)
            
    except Exception as e:
        # Return an error question if something goes wrong
        error_questions = [
            ChallengeQuestion(
                question=f"Unable to generate questions for: {req.topic}",
                options=[
                    "Try again later",
                    "Check connection",
                    "Verify API key",
                    "Simplify topic"
                ],
                answer="Try again later",
                explanation=f"An error occurred: {str(e)}"
            )
        ]
        return ChallengeResponse(questions=error_questions)
