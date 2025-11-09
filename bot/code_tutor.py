# from the folder you want to serve:
"""
Interactive CLI to import a repo and run MCQ exercises.

Usage: run this script and follow prompts. It uses `github_importer.import_repo`
to clone or copy a repo, then `mcq_generator.generate_mcqs_for_repo` to produce
questions. No external libraries required (needs `git` in PATH to clone repos).
"""

import os
import json
import tempfile
from typing import Optional

from bot.github_importer import import_repo
from bot.mcq_generator import generate_mcqs_for_repo


MODES = {
    1: "Code Detective (guess output)",
    2: "Reverse Engineer (which line caused this)",
    3: "Concept Roulette (mixed topics)",
    4: "Bug Bounty Hunt",
    5: "Guess the Output (fast)",
    # other modes map to generic heuristics in the generator
}


def prompt_repo_source() -> str:
    src = input("Enter a Git URL (or local path) to import: ").strip()
    return src


def choose_mode() -> int:
    print('\nSelect a learning mode:')
    for k in sorted(MODES.keys()):
        print(f"{k}. {MODES[k]}")
    print("0. Generic / All modes")

    while True:
        raw = input("Mode (number): ").strip()
        if raw == '0':
            return 0
        try:
            m = int(raw)
            if m in MODES:
                return m
        except Exception:
            pass
        print("Invalid mode. Try again.")


def run_session(repo_path: str, mode: int, max_q: int = 10):
    qlist = generate_mcqs_for_repo(repo_path, mode=mode or 1, max_q=max_q)
    if not qlist:
        print("No questions generated. The repo may not contain Python files.")
        return

    score = 0
    for i, q in enumerate(qlist, 1):
        print(f"\nQuestion {i}: {q['question']}")
        print("Snippet:")
        print('-----')
        print(q.get('snippet') or '(no snippet)')
        print('-----')
        opts = q['options']
        for j, o in enumerate(opts, 1):
            print(f"  {j}. {o}")

        ans = input("Your answer (number): ").strip()
        try:
            ai = int(ans) - 1
            chosen = opts[ai]
        except Exception:
            chosen = None

        correct = q['answer']
        if chosen == correct:
            print("✅ Correct")
            score += 1
        else:
            print(f"❌ Incorrect — correct: {correct}")

        print(f"Explanation: {q.get('explanation', 'No explanation')}")

    print(f"\nSession complete. Score: {score}/{len(qlist)}")

    out = input("Export questions & results to JSON? (y/N): ").strip().lower()
    if out == 'y':
        fn = os.path.join(os.getcwd(), f"mcq_results_{os.path.basename(repo_path)}.json")
        with open(fn, 'w', encoding='utf-8') as fh:
            json.dump({'repo': repo_path, 'mode': mode, 'questions': qlist, 'score': score}, fh, indent=2)
        print(f"Saved to {fn}")


def main():
    print("Code Tutor CLI — import a repo and run MCQ exercises")
    source = prompt_repo_source()
    workdir = None
    try:
        workdir = import_repo(source)
        print(f"Repo imported to: {workdir}")

        mode = choose_mode()
        run_session(workdir, mode)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        # we do not auto-delete clone so user can inspect, but if cloned into a tmpdir
        # user can remove it manually. Print hint.
        if workdir and os.path.exists(workdir):
            print(f"\nWorking copy available at: {workdir}")
            print("Remove the directory when you're done.")


if __name__ == '__main__':
    main()
