# api.py
import os
import asyncio
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

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

assistant = Agent(
    name="App assistant",
    instructions="You are a helpful assistant for my web app."
)

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    result = await Runner.run(
        starting_agent=assistant,
        input=req.message,
    )
    # result.final_output is the agent's text reply
    return ChatResponse(reply=result.final_output)
