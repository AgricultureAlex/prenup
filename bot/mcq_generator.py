"""
Simple MCQ generator prototype.

This module inspects Python files in a repo and generates elementary multiple
choice questions for a handful of "modes". It's intentionally lightweight and
dependency-free so you can iterate on the heuristics.
"""

import ast
import os
import random
from typing import List, Dict


def _collect_python_files(repo_path: str) -> List[str]:
    py_files = []
    for root, _, files in os.walk(repo_path):
        for f in files:
            if f.endswith('.py'):
                py_files.append(os.path.join(root, f))
    return py_files


def _extract_functions(file_path: str) -> List[Dict]:
    """Return list of {'name', 'lineno', 'source', 'returns_hint'} for functions."""
    with open(file_path, 'r', encoding='utf-8') as fh:
        src = fh.read()

    tree = ast.parse(src)
    funcs = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            # attempt to get a short source snippet
            try:
                # Python 3.8+: ast.get_source_segment
                snippet = ast.get_source_segment(src, node) or ''
            except Exception:
                snippet = f"def {node.name}(...):"

            # simple return type hint by scanning Return nodes
            returns = 'unknown'
            for sub in ast.walk(node):
                if isinstance(sub, ast.Return) and sub.value is not None:
                    if isinstance(sub.value, ast.Constant):
                        returns = type(sub.value.value).__name__
                        break
                    elif isinstance(sub.value, ast.List):
                        returns = 'list'
                        break
                    elif isinstance(sub.value, ast.Dict):
                        returns = 'dict'
                    elif isinstance(sub.value, ast.Call):
                        returns = 'call'

            funcs.append({
                'name': node.name,
                'lineno': node.lineno,
                'source': snippet.strip(),
                'returns_hint': returns,
                'file': file_path,
            })

    return funcs


def generate_mcqs_for_repo(repo_path: str, mode: int = 1, max_q: int = 10) -> List[Dict]:
    """Generate a list of MCQs for a repo using simple heuristics.

    mode: integer mapping to the game modes you listed. The generator will choose
    a heuristic based on mode.
    Returns list of questions: each is {question, options, answer, snippet, explanation}
    """
    py_files = _collect_python_files(repo_path)
    funcs = []
    for p in py_files:
        funcs.extend(_extract_functions(p))

    if not funcs:
        return []

    random.shuffle(funcs)
    out = []

    for f in funcs[:max_q]:
        if mode in (1, 5):  # Code Detective / Guess the Output
            # If we have a return constant, ask what is returned
            if f['returns_hint'] != 'unknown' and f['returns_hint'] != 'call':
                correct = f['returns_hint']
                candidates = ['None', 'int', 'str', 'list', 'dict']
                if correct not in candidates:
                    candidates.append(correct)
                options = random.sample(candidates, k=min(4, len(candidates)))
                if correct not in options:
                    options[0] = correct
                random.shuffle(options)
                q = {
                    'question': f"What type/value does function '{f['name']}' return (best guess)?",
                    'options': options,
                    'answer': correct,
                    'snippet': f['source'],
                    'explanation': f"Heuristic: returns_hint={f['returns_hint']}"
                }
                out.append(q)
            else:
                # fallback: ask about purpose (docstring vs name)
                q = {
                    'question': f"What is the most likely purpose of function '{f['name']}'?",
                    'options': [
                        'Utility/helper', 'Data transformation', 'I/O operation', 'Unknown/other'
                    ],
                    'answer': 'Utility/helper',
                    'snippet': f['source'],
                    'explanation': 'Guessed from name/snippet'
                }
                out.append(q)

        elif mode == 4:  # Bug Bounty Hunt — present a small snippet and ask which fix
            q = {
                'question': f"Which issue is most likely in function '{f['name']}'?",
                'options': [
                    'Missing return', 'Off-by-one error', 'Type mismatch', 'No issue'
                ],
                'answer': 'Missing return',
                'snippet': f['source'],
                'explanation': 'Many simple functions forget a return, this is a safe heuristic.'
            }
            out.append(q)

        else:
            # generic question for other modes
            q = {
                'question': f"Which file contains function '{f['name']}'?",
                'options': [os.path.basename(f['file']), 'other_module.py', 'utils.py', 'main.py'],
                'answer': os.path.basename(f['file']),
                'snippet': f['source'],
                'explanation': 'Trivial identification by file name.'
            }
            out.append(q)

    return out


if __name__ == '__main__':
    print('mcq_generator module. Use generate_mcqs_for_repo(path, mode)')
