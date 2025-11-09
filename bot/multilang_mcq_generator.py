"""
Multi-language MCQ generator for repositories.

This module analyzes repositories in various programming languages and generates
educational multiple-choice questions using a combination of static analysis
(for Python) and AI-powered analysis (for other languages).
"""

import os
import random
from typing import List, Dict, Optional, Tuple
from collections import Counter


# File extension to language mapping
LANGUAGE_MAP = {
    '.py': 'Python',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (React)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (React)',
    '.java': 'Java',
    '.cpp': 'C++',
    '.c': 'C',
    '.cs': 'C#',
    '.go': 'Go',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.rs': 'Rust',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.sql': 'SQL',
}


def detect_repository_languages(repo_path: str) -> Dict[str, int]:
    """
    Detect programming languages used in a repository.
    
    Returns a dictionary mapping language names to file counts.
    """
    language_counts = Counter()
    
    for root, _, files in os.walk(repo_path):
        # Skip common directories that shouldn't be analyzed
        if any(skip in root for skip in ['node_modules', '.git', 'venv', '__pycache__', 'dist', 'build']):
            continue
            
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in LANGUAGE_MAP:
                language_counts[LANGUAGE_MAP[ext]] += 1
    
    return dict(language_counts)


def get_primary_language(repo_path: str) -> Tuple[str, int]:
    """
    Get the primary programming language of a repository.
    
    Returns (language_name, file_count)
    """
    languages = detect_repository_languages(repo_path)
    if not languages:
        return ('Unknown', 0)
    
    # Sort by count and return the most common
    primary = max(languages.items(), key=lambda x: x[1])
    return primary


def collect_code_files(repo_path: str, extensions: List[str]) -> List[str]:
    """
    Collect all files with specified extensions from a repository.
    
    Args:
        repo_path: Path to the repository
        extensions: List of file extensions to collect (e.g., ['.js', '.jsx'])
    
    Returns:
        List of file paths
    """
    code_files = []
    
    for root, _, files in os.walk(repo_path):
        # Skip common directories
        if any(skip in root for skip in ['node_modules', '.git', 'venv', '__pycache__', 'dist', 'build']):
            continue
            
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                code_files.append(os.path.join(root, file))
    
    return code_files


def extract_code_snippets(file_path: str, max_lines: int = 30) -> List[Dict[str, str]]:
    """
    Extract meaningful code snippets from a file.
    
    Returns list of snippets, each with 'code', 'file', and 'start_line'
    """
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception:
        return []
    
    snippets = []
    
    # For JavaScript/TypeScript, look for function definitions, class definitions, etc.
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Detect function definitions, class definitions, etc.
        is_definition = any([
            line.startswith('function '),
            line.startswith('const ') and '=>' in line,
            line.startswith('class '),
            line.startswith('export '),
            line.startswith('async '),
            'function(' in line,
        ])
        
        if is_definition:
            # Extract a snippet starting from this line
            snippet_lines = []
            start_line = i + 1
            brace_count = 0
            
            for j in range(i, min(i + max_lines, len(lines))):
                snippet_lines.append(lines[j].rstrip())
                
                # Track braces to find end of function/class
                brace_count += lines[j].count('{')
                brace_count -= lines[j].count('}')
                
                # Stop if we've closed all braces or reached max lines
                if brace_count == 0 and '{' in ''.join(snippet_lines):
                    break
            
            if snippet_lines:
                snippets.append({
                    'code': '\n'.join(snippet_lines),
                    'file': os.path.basename(file_path),
                    'start_line': start_line
                })
            
            # Move past this snippet
            i = j + 1
        else:
            i += 1
    
    return snippets


def generate_ai_questions_for_snippet(snippet: Dict[str, str], language: str, mode: int = 1) -> Optional[Dict]:
    """
    Generate a question template for AI to process.
    This returns a structure that the API will use to call AI and generate actual questions.
    
    Returns a question template with code context.
    """
    code = snippet['code']
    
    # Don't generate questions for very short snippets
    if len(code.strip()) < 20:
        return None
    
    # Create different question types based on mode
    if mode == 1:  # Code Detective
        return {
            'type': 'ai_powered',
            'language': language,
            'code': code,
            'file': snippet['file'],
            'mode': 'code_detective',
            'prompt_template': f"""Analyze this {language} code and create a multiple-choice question about what it does or how it works.

Code:
```{language.lower()}
{code}
```

Generate a question with 4 options where:
1. One option is correct
2. Three options are plausible but incorrect
3. The question tests understanding of the code's purpose or behavior

Format as JSON:
{{
  "question": "What does this code do?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Option A",
  "explanation": "Brief explanation"
}}"""
        }
    
    elif mode == 4:  # Bug Hunt
        return {
            'type': 'ai_powered',
            'language': language,
            'code': code,
            'file': snippet['file'],
            'mode': 'bug_hunt',
            'prompt_template': f"""Analyze this {language} code and identify a potential bug or improvement.

Code:
```{language.lower()}
{code}
```

Create a multiple-choice question asking what issue might exist or what could be improved:

Format as JSON:
{{
  "question": "What potential issue exists in this code?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Option A",
  "explanation": "Brief explanation"
}}"""
        }
    
    else:  # General understanding
        return {
            'type': 'ai_powered',
            'language': language,
            'code': code,
            'file': snippet['file'],
            'mode': 'general',
            'prompt_template': f"""Create an educational multiple-choice question about this {language} code.

Code:
```{language.lower()}
{code}
```

Format as JSON:
{{
  "question": "Your question here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Option A",
  "explanation": "Brief explanation"
}}"""
        }


def generate_mcqs_for_multilang_repo(repo_path: str, mode: int = 1, max_q: int = 5) -> List[Dict]:
    """
    Generate MCQs for repositories in any language.
    
    For Python repos, uses AST-based analysis.
    For other languages, returns AI question templates.
    
    Args:
        repo_path: Path to the repository
        mode: Question mode (1=Code Detective, 4=Bug Hunt, etc.)
        max_q: Maximum number of questions to generate
    
    Returns:
        List of question dictionaries (mix of complete questions and AI templates)
    """
    # Detect primary language
    primary_lang, file_count = get_primary_language(repo_path)
    
    if file_count == 0:
        return []
    
    print(f"Detected primary language: {primary_lang} ({file_count} files)")
    
    # For Python, use existing AST-based approach
    if primary_lang == 'Python':
        try:
            from mcq_generator import generate_mcqs_for_repo
            return generate_mcqs_for_repo(repo_path, mode=mode, max_q=max_q)
        except ImportError:
            print("Warning: Python mcq_generator not available")
            return []
    
    # For other languages, collect code snippets and create AI question templates
    language_extensions = {
        'JavaScript': ['.js'],
        'JavaScript (React)': ['.jsx'],
        'TypeScript': ['.ts'],
        'TypeScript (React)': ['.tsx'],
        'Java': ['.java'],
        'C++': ['.cpp'],
        'C': ['.c'],
        'C#': ['.cs'],
        'Go': ['.go'],
        'Ruby': ['.rb'],
        'PHP': ['.php'],
        'Swift': ['.swift'],
        'Kotlin': ['.kt'],
        'Rust': ['.rs'],
    }
    
    # Get file extensions for the primary language
    extensions = language_extensions.get(primary_lang, [])
    if not extensions:
        # Try to find any programming language files
        all_langs = detect_repository_languages(repo_path)
        for lang, count in sorted(all_langs.items(), key=lambda x: x[1], reverse=True):
            if lang in language_extensions:
                primary_lang = lang
                extensions = language_extensions[lang]
                break
    
    if not extensions:
        return []
    
    # Collect code files
    code_files = collect_code_files(repo_path, extensions)
    
    if not code_files:
        return []
    
    print(f"Found {len(code_files)} {primary_lang} files")
    
    # Extract snippets from random files
    all_snippets = []
    random.shuffle(code_files)
    
    for file_path in code_files[:min(10, len(code_files))]:  # Limit to 10 files
        snippets = extract_code_snippets(file_path)
        all_snippets.extend(snippets)
    
    if not all_snippets:
        return []
    
    print(f"Extracted {len(all_snippets)} code snippets")
    
    # Generate AI question templates
    random.shuffle(all_snippets)
    questions = []
    
    for snippet in all_snippets[:max_q]:
        question_template = generate_ai_questions_for_snippet(snippet, primary_lang, mode)
        if question_template:
            questions.append(question_template)
    
    return questions


if __name__ == '__main__':
    print('multilang_mcq_generator module')
    print('Use generate_mcqs_for_multilang_repo(repo_path, mode, max_q)')