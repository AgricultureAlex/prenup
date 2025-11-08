from dotenv import load_dotenv
import os
from agents import Agent, Runner
import load_repo_context
import json
from dotenv import load_dotenv

# Key is loaded
load_dotenv()


url = "https://github.com/AgricultureAlex/prenup"     # replace with real repo URL
context = load_repo_context.load_repo_as_context(url, ref="main")  # get list of file contents
print(f"Loaded {len(context)} files")         # show how many files were read


# Convert from context to a string
MAX_FILES = 15
MAX_CHARS_PER_FILE = 4000  # 4k * 15 = 60k chars ≈ 15k tokens

trimmed = context[:MAX_FILES]
# Note structure of content: [{'path':'filepath', 'content':'filecontents'}, {'path':..., 'content':...}, ...]

codebase_text = "\n".join(
    f"FILE: {f['path']}\n{f['content'][:MAX_CHARS_PER_FILE]}"
    for f in trimmed
)

prompt = f"""
You are analyzing this repository.

Below is the codebase (file paths plus contents):

{codebase_text}

Now answer:

1. What does this codebase do overall?
2. What are its main objectives?
3. What is the general module/file hierarchy?
4. What are the core functions/classes and how do they fit together?
"""


agent = Agent(model="gpt-4o-mini",
                name="High-level Codebase Analyzer",
                handoff_description="Analyzes codebase as a whole at a high level, providing \
                a breakdown of the codebase's function and usage.", 
                instructions=prompt)

result = Runner.run_sync(agent, prompt, context=context)

print(result.final_output)