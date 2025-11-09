# api.py
import os
import asyncio
import re
import subprocess
import sys
import httpx
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Key is loaded
load_dotenv()

from agents import Agent, Runner  # from openai-agents
from gemini_helper import GeminiAgent, run_gemini_agent
from imessage_sender import send_imessage_async

# Add bot directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'bot'))
try:
    from github_importer import import_repo
    from mcq_generator import generate_mcqs_for_repo
    from multilang_mcq_generator import generate_mcqs_for_multilang_repo
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
    model: Optional[str] = "openai"  # "openai" or "gemini"

class ChatResponse(BaseModel):
    reply: str

class ChallengeRequest(BaseModel):
    topic: str
    model: Optional[str] = "openai"  # "openai" or "gemini"

class ChallengeQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str

class ChallengeResponse(BaseModel):
    questions: List[ChallengeQuestion]

# X API Models
class ProductEngagement(BaseModel):
    likes: int
    retweets: int
    comments: int

class AIProduct(BaseModel):
    id: int
    product_name: str
    description: str
    category: str
    launch_date: str
    website: Optional[str] = None
    company_or_creator: str
    twitter_handle: str
    trend_tags: List[str]
    source_tweet_url: str
    relevance_score: int
    avatar: str
    engagement: ProductEngagement
    timestamp: str

class AITrendsResponse(BaseModel):
    products: List[AIProduct]
    total_count: int
    last_updated: str

# Progress Cards Models
class ProgressCardRequest(BaseModel):
    project_name: str
    model: Optional[str] = "openai"  # "openai" or "gemini"

class ProgressCard(BaseModel):
    title: str
    description: str

class ProgressCardsResponse(BaseModel):
    cards: List[ProgressCard]

# Mini Challenge Models (for iMessage)
class MiniChallengeRequest(BaseModel):
    challenge_type: Optional[str] = None  # If None, random type will be chosen
    model: Optional[str] = "openai"

class MiniChallengeResponse(BaseModel):
    challenge_type: str

# iMessage sending models
class SendTestMessageRequest(BaseModel):
    phone_number: str

class SendTestMessageResponse(BaseModel):
    success: bool
    message: str

class ScheduleDailyChallengeRequest(BaseModel):
    phone_number: str
    enabled: bool
    time: str  # Format: "HH:MM"
    model: Optional[str] = "openai"

class ScheduleDailyChallengeResponse(BaseModel):
    success: bool
    message: str
    prompt: str
    hint: Optional[str] = None

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
    github_pattern = r'https://github\.com/([\w\-\.]+)/([\w\-\.]+)'
    match = re.search(github_pattern, text)
    if match:
        # Extract just the basic repo URL
        username, repo = match.groups()
        # Clean repo name by removing any trailing characters like slashes, spaces, or punctuation
        repo = re.sub(r'[/\s.,;!?\)]+$', '', repo)
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
        use_gemini = req.model == "gemini"
        
        if use_gemini:
            # Use Gemini
            gemini_agent = GeminiAgent(
                name="Tutor",
                instructions="You are a helpful programming and coding assistant. You provide general coding advice, explanations, and help with programming concepts. WRAP ALL MATH in Mathjax and all CODE in ````` (code ticks)"
            )
            
            # Build conversation history for Gemini
            history = []
            if req.history:
                history = [{"role": msg.role, "content": msg.content} for msg in req.history[-8:]]
            
            result = await run_gemini_agent(gemini_agent, req.message, history)
            return ChatResponse(reply=result)
        else:
            # Use OpenAI (default)
            messages = []
            
            # Add conversation history
            if req.history:
                for msg in req.history[-8:]:
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
            import random
            import json
            
            temp_dir = None
            try:
                # Import/clone the repository
                temp_dir = import_repo(github_url)
                
                # Generate MCQs from the repo using multi-language generator (mode 1 = Code Detective)
                mcqs = generate_mcqs_for_multilang_repo(temp_dir, mode=1, max_q=5)
                
                if not mcqs:
                    raise ValueError("No code files found in repository to generate questions from")
                
                # Convert MCQs to ChallengeQuestion format
                # Handle both complete MCQs (Python) and AI templates (other languages)
                questions = []
                for mcq in mcqs:
                    # Check if this is an AI-powered question template
                    if mcq.get('type') == 'ai_powered':
                        # Use AI to generate the complete question
                        use_gemini = req.model == "gemini"
                        
                        try:
                            if use_gemini:
                                ai_agent = GeminiAgent(
                                    name="Code Question Generator",
                                    instructions="You are an expert coding educator. Generate educational multiple-choice questions about code."
                                )
                                result_text = await run_gemini_agent(ai_agent, mcq['prompt_template'])
                                response_text = result_text.strip()
                            else:
                                ai_agent = Agent(
                                    name="Code Question Generator",
                                    instructions="You are an expert coding educator. Generate educational multiple-choice questions about code."
                                )
                                result = await Runner.run(starting_agent=ai_agent, input=mcq['prompt_template'])
                                response_text = result.final_output.strip()
                            
                            # Parse AI response
                            json_match = re.search(r'\{[\s\S]*\}', response_text)
                            if json_match:
                                response_text = json_match.group(0)
                            
                            parsed = json.loads(response_text)
                            
                            # Create question with AI-generated content
                            code_lang = mcq.get('language', 'javascript').lower()
                            questions.append(ChallengeQuestion(
                                question=f"{parsed['question']}\n\n```{code_lang}\n{mcq['code']}\n```",
                                options=parsed['options'],
                                answer=parsed['answer'],
                                explanation=parsed.get('explanation', 'See code above for details')
                            ))
                        except Exception as e:
                            print(f"Failed to generate AI question: {e}")
                            # Skip this question on error
                            continue
                    else:
                        # Handle traditional Python MCQs (complete questions)
                        # Use AI to generate multiple choice options
                        use_gemini = req.model == "gemini"
                        
                        if use_gemini:
                            options_agent = GeminiAgent(
                                name="MCQ Options Generator",
                                instructions=f"""You are an expert at creating challenging multiple-choice options for coding questions.

Given a coding question and the correct answer, generate 3 plausible but incorrect options that would challenge students.

The correct answer is: "{mcq['answer']}"

The incorrect options should be:
1. Plausible enough to seem correct at first glance
2. Based on common misconceptions or mistakes
3. Similar in style and length to the correct answer

Format your response EXACTLY as valid JSON:
{{
  "incorrect_options": ["Option 1", "Option 2", "Option 3"]
}}

Return ONLY the JSON, no other text."""
                            )
                        else:
                            options_agent = Agent(
                                name="MCQ Options Generator",
                                instructions=f"""You are an expert at creating challenging multiple-choice options for coding questions.

Given a coding question and the correct answer, generate 3 plausible but incorrect options that would challenge students.

The correct answer is: "{mcq['answer']}"

The incorrect options should be:
1. Plausible enough to seem correct at first glance
2. Based on common misconceptions or mistakes
3. Similar in style and length to the correct answer

Format your response EXACTLY as valid JSON:
{{
  "incorrect_options": ["Option 1", "Option 2", "Option 3"]
}}

Return ONLY the JSON, no other text."""
                            )
                        
                        try:
                            # Run the agent to generate options
                            if use_gemini:
                                result_text = await run_gemini_agent(
                                    options_agent,
                                    f"Question: {mcq['question']}\n\nCode:\n{mcq.get('snippet', '')}\n\nGenerate 3 incorrect options."
                                )
                                response_text = result_text
                            else:
                                result = await Runner.run(
                                    starting_agent=options_agent,
                                    input=f"Question: {mcq['question']}\n\nCode:\n{mcq.get('snippet', '')}\n\nGenerate 3 incorrect options.",
                                )
                                response_text = result.final_output.strip()
                            
                            # Parse AI response
                            json_match = re.search(r'\{[\s\S]*\}', response_text)
                            if json_match:
                                response_text = json_match.group(0)
                            
                            parsed = json.loads(response_text)
                            incorrect_options = parsed.get("incorrect_options", [])
                            
                            # Combine correct answer with AI-generated incorrect options
                            all_options = [mcq['answer']] + incorrect_options[:3]
                            
                            # Ensure we have exactly 4 options
                            while len(all_options) < 4:
                                all_options.append(f"Alternative answer {len(all_options)}")
                            
                            # Randomize the order
                            random.shuffle(all_options)
                            
                            questions.append(ChallengeQuestion(
                                question=f"{mcq['question']}\n\n```python\n{mcq.get('snippet', 'No code snippet')}\n```",
                                options=all_options[:4],
                                answer=mcq['answer'],  # Correct answer text (now randomized in position)
                                explanation=mcq.get('explanation', 'No explanation provided')
                            ))
                            
                        except Exception as e:
                            # Fallback to original options if AI generation fails
                            print(f"Failed to generate AI options, using fallback: {e}")
                            shuffled_options = mcq['options'].copy()
                            random.shuffle(shuffled_options)
                            questions.append(ChallengeQuestion(
                                question=f"{mcq['question']}\n\n```python\n{mcq.get('snippet', 'No code snippet')}\n```",
                                options=shuffled_options,
                                answer=mcq['answer'],
                                explanation=mcq.get('explanation', 'No explanation provided')
                            ))
                
                # Ensure we have at least some questions
                if not questions:
                    raise ValueError("Failed to generate questions from repository")
                
                return ChallengeResponse(questions=questions)
                
            finally:
                # Clean up temp directory
                if temp_dir and os.path.exists(temp_dir):
                    try:
                        shutil.rmtree(temp_dir)
                    except:
                        pass  # Ignore cleanup errors
        
        # Fall back to AI-generated questions for general topics
        use_gemini = req.model == "gemini"
        
        instructions = f"""You are an expert educator creating challenging multiple-choice questions.
            
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
        
        if use_gemini:
            challenge_agent = GeminiAgent(
                name="Challenge Question Generator",
                instructions=instructions
            )
            result_text = await run_gemini_agent(
                challenge_agent,
                f"Generate challenge questions about: {req.topic}"
            )
            response_text = result_text.strip()
        else:
            challenge_agent = Agent(
                name="Challenge Question Generator",
                instructions=instructions
            )
            result = await Runner.run(
                starting_agent=challenge_agent,
                input=f"Generate challenge questions about: {req.topic}",
            )
            response_text = result.final_output.strip()
        
        # Parse the JSON response
        import json
        try:
            # Try to extract JSON from the response
            
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

# Cache for AI trends data
_trends_cache = None
_cache_timestamp = None
CACHE_DURATION = timedelta(hours=6)  # Cache for 6 hours to conserve API quota

@app.get("/ai-trends", response_model=AITrendsResponse)
async def get_ai_trends():
    """Fetch live AI product launches from X/Twitter API with caching."""
    global _trends_cache, _cache_timestamp
    
    try:
        # Check if cache is still valid
        if _trends_cache and _cache_timestamp:
            if datetime.now() - _cache_timestamp < CACHE_DURATION:
                print("Returning cached AI trends data")
                return _trends_cache
        
        # Get X API credentials from environment
        bearer_token = os.getenv('X_BEARER_TOKEN')
        
        if not bearer_token:
            # Return sample data if no API key configured
            print("⚠️ X_BEARER_TOKEN not found in environment, using sample data")
            sample_data = get_sample_ai_trends()
            _trends_cache = sample_data
            _cache_timestamp = datetime.now()
            return sample_data
        
        # Validate token format (real tokens are typically 100+ characters)
        if len(bearer_token) < 50:
            print(f"⚠️ X_BEARER_TOKEN appears invalid (too short: {len(bearer_token)} chars). Expected 100+ characters.")
            print("   Get a valid Bearer Token from: https://developer.twitter.com/en/portal/dashboard")
            print("   Using sample data instead.")
            sample_data = get_sample_ai_trends()
            _trends_cache = sample_data
            _cache_timestamp = datetime.now()
            return sample_data
        
        print(f"✓ Using X API Bearer Token (length: {len(bearer_token)} chars)")
        
        # Enhanced search query for AI and tech launches - broader to get more results
        search_query = (
            "(AI OR machine learning OR LLM OR GPT OR neural network OR deep learning OR "
            "framework OR library OR SDK OR API OR launch OR launching OR released OR "
            "open source OR developer OR coding OR programming OR python OR javascript OR react OR nextjs OR "
            "webdev OR startup OR SaaS) "
            "-is:retweet -is:reply lang:en"
        )
        
        # X API v2 endpoint
        url = "https://api.twitter.com/2/tweets/search/recent"
        
        headers = {
            "Authorization": f"Bearer {bearer_token}"
        }
        
        params = {
            "query": search_query,
            "max_results": 25,  # Conservative for Free tier (100 tweets/month)
            "tweet.fields": "created_at,public_metrics,author_id",
            "expansions": "author_id",
            "user.fields": "name,username,profile_image_url"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, params=params, timeout=15.0)
            
            if response.status_code != 200:
                print(f"❌ X API Error (Status {response.status_code}):")
                try:
                    error_data = response.json()
                    print(f"   {error_data}")
                except:
                    print(f"   {response.text}")
                
                # Return cached data or sample data on error
                if _trends_cache:
                    print("   Returning cached data instead")
                    return _trends_cache
                print("   Returning sample data instead")
                return get_sample_ai_trends()
            
            data = response.json()
            
            # Parse tweets into AI products
            products = parse_tweets_to_products(data)
            
            # Filter for quality/engagement - lowered threshold to show more results
            products = [p for p in products if p.relevance_score >= 1][:25]
            
            result = AITrendsResponse(
                products=products,
                total_count=len(products),
                last_updated=datetime.now().isoformat()
            )
            
            # Cache the result
            _trends_cache = result
            _cache_timestamp = datetime.now()
            
            print(f"Fetched and cached {len(products)} AI trends from X API")
            return result
            
    except Exception as e:
        print(f"Error fetching AI trends: {e}")
        # Return cached data if available, otherwise sample data
        if _trends_cache:
            return _trends_cache
        return get_sample_ai_trends()

def parse_tweets_to_products(data: dict) -> List[AIProduct]:
    """Parse X API response into AIProduct objects."""
    products = []
    
    # Create user lookup
    users = {}
    if 'includes' in data and 'users' in data['includes']:
        for user in data['includes']['users']:
            users[user['id']] = user
    
    # Categories for classification
    categories = [
        'Frontend (Client-Side)',
        'Backend (Server-Side)',
        'Database Layer',
        'DevOps / Deployment',
        'API & Integration Layer',
        'Security & Compliance',
        'Testing & Quality Assurance',
        'Analytics & Observability',
        'Automation / Tooling',
        'Architecture & Design Systems'
    ]
    
    if 'data' not in data:
        return products
    
    for idx, tweet in enumerate(data['data']):
        author_id = tweet.get('author_id')
        user = users.get(author_id, {})
        
        # Extract metrics
        metrics = tweet.get('public_metrics', {})
        
        # Classify category based on tweet text
        text = tweet.get('text', '')
        category = classify_category(text, categories)
        
        # Extract product info
        product_name = extract_product_name(text)
        description = extract_description(text)
        tags = extract_hashtags(text)
        
        product = AIProduct(
            id=idx + 1,
            product_name=product_name,
            description=description,
            category=category,
            launch_date=tweet.get('created_at', datetime.now().isoformat())[:10],
            website=extract_url(text),
            company_or_creator=user.get('name', 'Unknown'),
            twitter_handle=user.get('username', 'unknown'),
            trend_tags=tags[:3] if tags else ['AI', 'Technology'],
            source_tweet_url=f"https://twitter.com/{user.get('username', 'x')}/status/{tweet.get('id')}",
            relevance_score=calculate_relevance_score(metrics),
            avatar=user.get('profile_image_url', 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'),
            engagement=ProductEngagement(
                likes=metrics.get('like_count', 0),
                retweets=metrics.get('retweet_count', 0),
                comments=metrics.get('reply_count', 0)
            ),
            timestamp=tweet.get('created_at', datetime.now().isoformat())
        )
        
        products.append(product)
    
    return products

def classify_category(text: str, categories: List[str]) -> str:
    """Classify tweet into a category based on keywords."""
    text_lower = text.lower()
    
    category_keywords = {
        'Frontend (Client-Side)': ['react', 'vue', 'frontend', 'ui', 'components', 'hooks'],
        'Backend (Server-Side)': ['api', 'server', 'backend', 'node', 'python', 'llm', 'model'],
        'Database Layer': ['database', 'vector', 'pgvector', 'postgres', 'embeddings', 'rag'],
        'DevOps / Deployment': ['deploy', 'cloud', 'infrastructure', 'serverless', 'gpu', 'scaling'],
        'API & Integration Layer': ['api', 'integration', 'replicate', 'flux', 'generation'],
        'Security & Compliance': ['security', 'auth', 'saml', 'authentication', 'fraud'],
        'Testing & Quality Assurance': ['testing', 'quality', 'observability', 'monitoring'],
        'Analytics & Observability': ['analytics', 'observability', 'monitoring', 'tracking'],
        'Automation / Tooling': ['automation', 'ci/cd', 'build', 'tooling'],
        'Architecture & Design Systems': ['architecture', 'design', 'system', 'framework']
    }
    
    for category, keywords in category_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            return category
    
    return 'Backend (Server-Side)'  # Default category

def extract_product_name(text: str) -> str:
    """Extract product name from tweet text."""
    # Look for patterns like "Launching X" or "Announcing Y"
    patterns = [
        r'(?:launching|announcing|released?|introducing)\s+([A-Z][A-Za-z0-9\s]+?)(?:\s+[-–—]|\s+is|\s+for|$)',
        r'([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)\s+(?:is now|has launched|released)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            # Limit to reasonable length
            if len(name) < 50:
                return name
    
    # Fallback: use first capitalized phrase
    words = text.split()
    for i, word in enumerate(words):
        if word and word[0].isupper() and len(word) > 2:
            return ' '.join(words[i:min(i+3, len(words))])
    
    return "AI Product Launch"

def extract_description(text: str) -> str:
    """Extract description from tweet text."""
    # Clean up the text
    description = re.sub(r'https?://\S+', '', text)  # Remove URLs
    description = re.sub(r'#\w+', '', description)  # Remove hashtags
    description = description.strip()
    
    # Limit length
    if len(description) > 200:
        description = description[:197] + "..."
    
    return description if description else "AI product announcement"

def extract_hashtags(text: str) -> List[str]:
    """Extract hashtags from tweet text."""
    hashtags = re.findall(r'#(\w+)', text)
    return [tag for tag in hashtags if len(tag) > 2][:5]

def extract_url(text: str) -> Optional[str]:
    """Extract URL from tweet text."""
    url_match = re.search(r'https?://\S+', text)
    if url_match:
        url = url_match.group(0)
        # Clean up trailing punctuation
        url = url.rstrip('.,;:!?)')
        return url
    return None

def calculate_relevance_score(metrics: dict) -> int:
    """Calculate relevance score based on engagement metrics."""
    likes = metrics.get('like_count', 0)
    retweets = metrics.get('retweet_count', 0)
    replies = metrics.get('reply_count', 0)
    
    # Simple scoring algorithm
    score = min(10, int(
        (likes * 0.3 + retweets * 0.5 + replies * 0.2) / 10
    ))
    
    return max(1, score)

def get_sample_ai_trends() -> AITrendsResponse:
    """Return sample AI trends data when X API is not available."""
    sample_products = [
        AIProduct(
            id=1,
            product_name="Vercel AI SDK 4.0",
            description="React hooks and utilities for building AI-powered UIs with streaming responses and real-time updates",
            category="Frontend (Client-Side)",
            launch_date=datetime.now().isoformat()[:10],
            website="https://sdk.vercel.ai",
            company_or_creator="Vercel",
            twitter_handle="vercel",
            trend_tags=["AI Agents", "Streaming UI", "React Hooks"],
            source_tweet_url="https://twitter.com/vercel/status/123",
            relevance_score=9,
            avatar="https://pbs.twimg.com/profile_images/1604303031686590464/ZGa5K_Z0_400x400.jpg",
            engagement=ProductEngagement(likes=342, retweets=89, comments=45),
            timestamp=datetime.now().isoformat()
        ),
        AIProduct(
            id=2,
            product_name="LangGraph Cloud",
            description="Hosted infrastructure for deploying LangChain agents with built-in state management and streaming",
            category="Backend (Server-Side)",
            launch_date=(datetime.now() - timedelta(days=1)).isoformat()[:10],
            website="https://langchain.com/langgraph-cloud",
            company_or_creator="LangChain",
            twitter_handle="LangChainAI",
            trend_tags=["AI Agents", "Serverless", "LLM Orchestration"],
            source_tweet_url="https://twitter.com/langchain/status/456",
            relevance_score=8,
            avatar="https://pbs.twimg.com/profile_images/1674490330938318848/cD8OuEkH_400x400.jpg",
            engagement=ProductEngagement(likes=567, retweets=123, comments=78),
            timestamp=(datetime.now() - timedelta(days=1)).isoformat()
        )
    ]
    
    return AITrendsResponse(
        products=sample_products,
        total_count=len(sample_products),
        last_updated=datetime.now().isoformat()
    )

@app.post("/generate-progress-cards", response_model=ProgressCardsResponse)
async def generate_progress_cards(req: ProgressCardRequest):
    """Generate 5 major milestone cards for long-term career/learning goals using AI."""
    try:
        use_gemini = req.model == "gemini"
        
        instructions = f"""You are an expert career advisor and learning strategist.

Generate exactly 5 MAJOR MILESTONE cards for the long-term career/learning goal: "{req.project_name}"

IMPORTANT: This is a LONG-TERM CAREER or LEARNING GOAL, not a short-term project. Each milestone should represent months or years of work.

Each milestone should be:
1. A significant, high-level achievement (e.g., "Foundational Knowledge", "Professional Experience", "Career Advancement")
2. Ordered from beginner to expert level
3. Represent major phases of the learning/career journey
4. Brief title (3-5 words EXACTLY) with descriptive explanation of what this phase entails

Format your response EXACTLY as valid JSON:
{{
  "cards": [
    {{
      "title": "Build Foundational Knowledge",
      "description": "Learn core concepts, syntax, and fundamental principles through courses, books, and tutorials"
    }},
    {{
      "title": "Develop Practical Skills",
      "description": "Build real projects, contribute to open source, and gain hands-on experience"
    }}
  ]
}}

IMPORTANT:
- Titles must be 3-5 words only
- These are MAJOR phases, not small tasks
- Think in terms of months/years, not days/weeks
Generate EXACTLY 5 milestone cards. Return ONLY the JSON, no other text."""
        
        # Create an AI agent to generate progress cards
        if use_gemini:
            progress_agent = GeminiAgent(
                name="Progress Card Generator",
                instructions=instructions
            )
            result_text = await run_gemini_agent(
                progress_agent,
                f"Generate 20 progress cards for: {req.project_name}"
            )
            response_text = result_text.strip()
        else:
            progress_agent = Agent(
                name="Progress Card Generator",
                instructions=instructions
            )
            result = await Runner.run(
                starting_agent=progress_agent,
                input=f"Generate 20 progress cards for: {req.project_name}",
            )
            response_text = result.final_output.strip()
        
        # Parse the JSON response
        import json
        try:
            
            # Find JSON block in response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                response_text = json_match.group(0)
            
            parsed_response = json.loads(response_text)
            
            cards = []
            for card_data in parsed_response.get("cards", [])[:5]:  # Limit to 5
                cards.append(ProgressCard(
                    title=card_data.get("title", "Progress Step"),
                    description=card_data.get("description", "Complete this milestone")
                ))
            
            # Ensure we have exactly 5 cards
            while len(cards) < 5:
                cards.append(ProgressCard(
                    title=f"Milestone {len(cards) + 1}",
                    description=f"Continue working toward {req.project_name}"
                ))
            
            return ProgressCardsResponse(cards=cards[:5])
            
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            # Fallback: generate generic progress cards
            return generate_generic_cards(req.project_name)
            
    except Exception as e:
        print(f"Error generating progress cards: {e}")
        return generate_generic_cards(req.project_name)

def generate_generic_cards(project_name: str) -> ProgressCardsResponse:
    """Generate generic progress cards as fallback."""
    generic_steps = [
        ("Build Foundational Knowledge", "Learn core concepts, theories, and fundamental principles through structured learning"),
        ("Develop Practical Skills", "Apply knowledge through projects, exercises, and hands-on practice"),
        ("Gain Professional Experience", "Work on real-world applications, collaborate with others, and build portfolio"),
        ("Achieve Advanced Proficiency", "Master complex topics, optimize performance, and develop expertise"),
        ("Become Industry Expert", "Lead projects, mentor others, and contribute to the field's advancement")
    ]
    
    cards = [
        ProgressCard(title=title, description=desc)
        for title, desc in generic_steps
    ]
    

    return ProgressCardsResponse(cards=cards)

@app.post("/mini-challenge", response_model=MiniChallengeResponse)
async def generate_mini_challenge(req: MiniChallengeRequest):
    """Generate a bite-sized challenge perfect for mobile/iMessage."""
    import random
    
    challenge_types = [
        "debug",
        "data-structure",
        "guess-output",
        "comment-code",
        "explain-back",
        "20-questions",
        "check-in"
    ]
    
    # Select challenge type
    challenge_type = req.challenge_type if req.challenge_type in challenge_types else random.choice(challenge_types)
    use_gemini = req.model == "gemini"
    
    # Define prompts for each challenge type
    prompts = {
        "debug": "Create a SHORT (5-7 lines max) buggy code snippet and ask the user to find the bug. Make it educational but solvable on mobile.",
        "data-structure": "Ask a quick question about a data structure (list, dict, set, queue, stack, tree). Keep it SHORT and conversational.",
        "guess-output": "Show a SHORT (3-4 lines) code snippet and ask what it outputs. Make it interesting but mobile-friendly.",
        "comment-code": "Provide 3-4 lines of code and ask user to explain what each line does. Keep it simple and educational.",
        "explain-back": "Pick a simple CS concept (like 'recursion', 'hash table', 'API') and ask user to explain it in their own words. Be encouraging!",
        "20-questions": "Play 20 questions! Pick a CS/math concept and have user guess it by asking yes/no questions. Start by saying 'I'm thinking of a concept...'",
        "check-in": "Send a supportive, conversational message checking in on their learning journey. Ask about their progress or what they're working on. Be warm and encouraging!"
    }
    
    instructions = f"""You are a friendly coding tutor creating a MOBILE-FRIENDLY challenge.

Challenge Type: {challenge_type}

{prompts[challenge_type]}

CRITICAL RULES:
- MUST be SHORT enough for mobile screen (max 10 lines total)
- NO markdown formatting (plain text only for iMessage)
- Be warm, conversational, and encouraging
- Use simple, clear language
- Add relevant emojis for engagement

Format your response as plain text, NOT markdown. Make it feel like a text message from a friend!"""
    
    try:
        if use_gemini:
            agent = GeminiAgent(name="Mini Challenge Generator", instructions=instructions)
            result = await run_gemini_agent(agent, f"Generate a {challenge_type} challenge")
        else:
            agent = Agent(name="Mini Challenge Generator", instructions=instructions)
            result_obj = await Runner.run(starting_agent=agent, input=f"Generate a {challenge_type} challenge")
            result = result_obj.final_output
        
        # Add hint for certain challenge types
        hint = None
        if challenge_type in ["debug", "guess-output", "20-questions"]:
            hint = "Need a hint? Just ask!"
        
        return MiniChallengeResponse(
            challenge_type=challenge_type,
            prompt=result.strip(),
            hint=hint
        )
        
    except Exception as e:
        # Fallback challenges
        fallback_prompts = {
            "debug": "🐛 Debug Challenge!\n\nWhat's wrong with this code?\n\ndef add(a b):\n    return a + b\n\nHint: Check the function definition!",
            "check-in": "👋 Hey! How's your coding journey going today? What are you working on or learning right now? 🚀"
        }
        
        return MiniChallengeResponse(
            challenge_type=challenge_type,
            prompt=fallback_prompts.get(challenge_type, "💪 Keep coding! What would you like to learn today?"),
            hint=None
        )

@app.post("/send-test-imessage", response_model=SendTestMessageResponse)
async def send_test_imessage(req: SendTestMessageRequest):
    """Send a test iMessage to the provided phone number."""
    try:
        test_message = "👋 Test message from VibeChild.tech!\n\nYour daily challenges are set up and ready to go. You'll receive bite-sized coding challenges to keep your learning streak alive! 🚀"
        
        success = await send_imessage_async(req.phone_number, test_message)
        
        if success:
            return SendTestMessageResponse(
                success=True,
                message="Test message sent successfully!"
            )
        else:
            return SendTestMessageResponse(
                success=False,
                message="Failed to send message. Make sure Messages app is running and you have iMessage enabled."
            )
    except Exception as e:
        return SendTestMessageResponse(
            success=False,
            message=f"Error: {str(e)}"
        )

# Storage for daily challenge schedules (in production, use a database)
_daily_challenge_schedules = {}

@app.post("/schedule-daily-challenge", response_model=ScheduleDailyChallengeResponse)
async def schedule_daily_challenge(req: ScheduleDailyChallengeRequest):
    """Schedule or cancel daily challenge messages."""
    try:
        if req.enabled:
            # Save the schedule
            _daily_challenge_schedules[req.phone_number] = {
                'time': req.time,
                'model': req.model,
                'enabled': True
            }
            
            return ScheduleDailyChallengeResponse(
                success=True,
                message=f"Daily challenge scheduled for {req.time}. You'll receive a new challenge every day!"
            )
        else:
            # Remove the schedule
            if req.phone_number in _daily_challenge_schedules:
                del _daily_challenge_schedules[req.phone_number]
            
            return ScheduleDailyChallengeResponse(
                success=True,
                message="Daily challenges disabled."
            )
    except Exception as e:
        return ScheduleDailyChallengeResponse(
            success=False,
            message=f"Error: {str(e)}"
        )

@app.get("/daily-challenge-status/{phone_number}")
async def get_daily_challenge_status(phone_number: str):
    """Get the current daily challenge schedule status for a phone number."""
    schedule = _daily_challenge_schedules.get(phone_number)
    
    if schedule:
        return {
            "enabled": schedule.get('enabled', False),
            "time": schedule.get('time', '09:00'),
            "model": schedule.get('model', 'openai')
        }
    else:
        return {
            "enabled": False,
            "time": "09:00",
            "model": "openai"
        }
