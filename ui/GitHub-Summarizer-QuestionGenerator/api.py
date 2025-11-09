# api.py
import os
import asyncio
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import ask_GPT

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

codebase_analyst = Agent(
    name="Codebase Analyst",
    instructions="Say I'm codebase Analyst"
)

code_coach = Agent(
    name="Tutor",
    instructions="say I'm tutor"
    #instructions="You are a helpful and approachable advisor in programming, coding, computer science. Your goal is to help your conversation partner achieve their goals."
)
assistant = Agent(
    name="App assistant",
    instructions="You will divide tasks up depending on whether the user is asking for an explanation/analysis/summary/help with a codebase, or general coding advice. If a summary of the requested github has already been given, refer to Tutor. If not, send link to code_coach",
    handoffs=[codebase_analyst,code_coach]
)


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
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
