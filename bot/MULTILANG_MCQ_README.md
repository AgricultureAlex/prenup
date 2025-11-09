# Multi-Language MCQ Generator

## Overview

The Multi-Language MCQ Generator extends the original Python-only MCQ generation system to support repositories in multiple programming languages including JavaScript, TypeScript, React, Java, C++, and more.

## Features

- **Automatic Language Detection**: Automatically identifies the primary programming language used in a repository
- **Python Support**: Uses AST-based static analysis for Python code (existing functionality)
- **JavaScript/TypeScript Support**: AI-powered question generation for JS, JSX, TS, TSX files
- **React Support**: Special handling for React components and hooks
- **Extensible**: Easy to add support for additional languages

## Supported Languages

Currently supports MCQ generation for:

- **Python** - AST-based analysis (original implementation)
- **JavaScript** - AI-powered analysis
- **JavaScript (React)** - .jsx files
- **TypeScript** - AI-powered analysis  
- **TypeScript (React)** - .tsx files
- **Java** - AI-powered analysis
- **C++** - AI-powered analysis
- **C** - AI-powered analysis
- **C#** - AI-powered analysis
- **Go** - AI-powered analysis
- **Ruby** - AI-powered analysis
- **PHP** - AI-powered analysis
- **Swift** - AI-powered analysis
- **Kotlin** - AI-powered analysis
- **Rust** - AI-powered analysis

## How It Works

### 1. Language Detection

The system analyzes the repository's file structure to determine the primary programming language:

```python
from multilang_mcq_generator import detect_repository_languages, get_primary_language

# Detect all languages in repo
languages = detect_repository_languages('/path/to/repo')
# Returns: {'JavaScript': 45, 'TypeScript': 12, 'Python': 3}

# Get primary language
primary_lang, count = get_primary_language('/path/to/repo')
# Returns: ('JavaScript', 45)
```

### 2. Code Snippet Extraction

For non-Python languages, the system:
1. Collects relevant source files
2. Extracts meaningful code snippets (functions, classes, components)
3. Limits snippets to readable size (max 30 lines)

### 3. Question Generation

**For Python repositories:**
- Uses AST (Abstract Syntax Tree) parsing
- Analyzes function definitions, return types, and structure
- Generates questions about code behavior

**For other languages:**
- Creates AI-powered question templates
- Uses OpenAI or Gemini to generate:
  - Question text
  - 4 multiple choice options
  - Correct answer
  - Explanation

## Usage

### Basic Usage

```python
from multilang_mcq_generator import generate_mcqs_for_multilang_repo

# Generate MCQs for any repository
questions = generate_mcqs_for_multilang_repo(
    repo_path='/path/to/repo',
    mode=1,  # 1=Code Detective, 4=Bug Hunt
    max_q=5  # Number of questions
)

for q in questions:
    if q.get('type') == 'ai_powered':
        # This is an AI template that needs processing
        print(f"AI Template for {q['language']}")
        print(q['prompt_template'])
    else:
        # This is a complete Python MCQ
        print(f"Question: {q['question']}")
        print(f"Answer: {q['answer']}")
```

### Via API Endpoint

The system integrates seamlessly with the existing `/challenge` endpoint:

```bash
# Test with a JavaScript/React repository
curl -X POST http://localhost:8000/challenge \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "https://github.com/AgricultureAlex/prenup",
    "model": "openai"
  }'
```

**Response Format:**
```json
{
  "questions": [
    {
      "question": "What does this React component do?\n\n```javascript\nconst Navigation = () => { ... }\n```",
      "options": [
        "Renders navigation menu",
        "Handles routing",
        "Manages state",
        "Fetches data"
      ],
      "answer": "Renders navigation menu",
      "explanation": "This component returns JSX for a navigation menu"
    }
  ]
}
```

## Question Modes

The generator supports different question types:

### Mode 1: Code Detective
Asks about what code does, its purpose, or behavior
```python
questions = generate_mcqs_for_multilang_repo(repo_path, mode=1)
```

### Mode 4: Bug Hunt
Identifies potential bugs or improvements in code
```python
questions = generate_mcqs_for_multilang_repo(repo_path, mode=4)
```

## Examples

### Example 1: JavaScript React Repository

```python
from github_importer import import_repo
from multilang_mcq_generator import generate_mcqs_for_multilang_repo

# Clone and analyze a React repository
repo_path = import_repo('https://github.com/username/react-app')
questions = generate_mcqs_for_multilang_repo(repo_path, mode=1, max_q=3)

# Process AI templates (happens automatically in API)
for q in questions:
    if q.get('type') == 'ai_powered':
        print(f"Language: {q['language']}")
        print(f"File: {q['file']}")
        print(f"Code snippet length: {len(q['code'])} chars")
```

### Example 2: Mixed Language Repository

For repositories with multiple languages, the system:
1. Detects the primary language
2. Generates questions based on that language
3. Falls back to AI-powered generation for non-Python languages

```python
# Repository with Python, JavaScript, and CSS
repo_path = '/path/to/fullstack/app'

# Will use Python AST if Python is primary
# Will use AI generation if JavaScript is primary
questions = generate_mcqs_for_multilang_repo(repo_path, mode=1)
```

## Architecture

### File Structure

```
bot/
├── mcq_generator.py           # Original Python MCQ generator
├── multilang_mcq_generator.py # New multi-language generator
├── github_importer.py         # Repository cloning utilities
└── MULTILANG_MCQ_README.md   # This file

ui/GitHub-Summarizer-QuestionGenerator/
└── api.py                     # FastAPI endpoint integration
```

### Integration Flow

```
User Request (GitHub URL)
    ↓
detect_github_url()
    ↓
import_repo() - Clone repository
    ↓
generate_mcqs_for_multilang_repo()
    ↓
detect_repository_languages()
    ↓
┌─────────────────┬──────────────────┐
│                 │                  │
Python Detected   Other Language     
│                 │                  
AST Analysis      Extract Snippets   
│                 │                  
Complete MCQs     AI Templates       
│                 │                  
└─────────────────┴──────────────────┘
             ↓
    Process AI Templates
             ↓
    Return Complete Questions
             ↓
    Clean up temp directory
```

## Configuration

### Skip Directories

The following directories are automatically skipped during analysis:
- `node_modules`
- `.git`
- `venv`
- `__pycache__`
- `dist`
- `build`

### Language Extensions

Customize supported file extensions in `LANGUAGE_MAP`:

```python
LANGUAGE_MAP = {
    '.py': 'Python',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (React)',
    # Add more as needed
}
```

## Performance Considerations

- **File Limit**: Analyzes up to 10 files per repository to prevent overload
- **Snippet Limit**: Maximum 30 lines per code snippet for readability
- **Cache**: Consider implementing caching for frequently analyzed repositories
- **AI Rate Limits**: Be mindful of OpenAI/Gemini API rate limits

## Troubleshooting

### No Questions Generated

**Problem**: `generate_mcqs_for_multilang_repo()` returns empty list

**Solutions**:
1. Check if repository contains supported file types
2. Verify files aren't in skip directories
3. Ensure code files have substantive content (>20 chars)

### Language Not Detected

**Problem**: Returns 'Unknown' language

**Solutions**:
1. Add file extension to `LANGUAGE_MAP`
2. Ensure repository has actual code files (not just README/config)
3. Check file extensions match expected patterns

### AI Generation Failures

**Problem**: AI-powered questions fail to generate

**Solutions**:
1. Verify OpenAI/Gemini API keys are configured
2. Check API rate limits haven't been exceeded
3. Ensure code snippets aren't too large or complex
4. Review AI prompt templates for clarity

## Future Enhancements

Potential improvements for the system:

1. **Smarter Code Selection**: Use dependency analysis to select more relevant code
2. **Multi-File Context**: Generate questions spanning multiple related files
3. **Difficulty Levels**: Classify questions by difficulty (beginner/intermediate/advanced)
4. **Code Explanation**: Add detailed explanations with line-by-line breakdowns
5. **Interactive Debugging**: Allow users to modify code and see impact
6. **Language-Specific Patterns**: Add language-specific heuristics (like Python's AST)

## Contributing

To add support for a new language:

1. Add file extension to `LANGUAGE_MAP` in `multilang_mcq_generator.py`
2. Add to `language_extensions` dictionary (if needed)
3. Optionally create language-specific snippet extraction logic
4. Test with sample repositories in that language

## License

This module extends the existing MCQ generation system and follows the same license as the parent project.