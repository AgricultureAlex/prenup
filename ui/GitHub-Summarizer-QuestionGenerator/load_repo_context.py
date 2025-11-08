import os
import tempfile
import subprocess
from pathlib import Path

# Clone a GitHub repository into a temporary directory.
def clone_repo_to_tmp(repo_url: str, ref: str = "main") -> Path:
    # Create a new temporary folder (deleted automatically later)
    tmp_dir = Path(tempfile.mkdtemp(prefix="repo-"))
    # Run a shell command: `git clone --depth 1 --branch <ref> <repo_url> <tmp_dir>`
    # --depth 1 = shallow clone (only latest commit) for speed
    # --branch ref = choose which branch or tag to checkout
    subprocess.run(
        ["git", "clone", "--depth", "1", "--branch", ref, repo_url, str(tmp_dir)],
        check=True,  # raises error if git returns nonzero code
    )
    # Return the path to the freshly cloned repo
    return tmp_dir

# Check if a file is a documentation file that should be prioritized
def is_documentation_file(path: Path) -> bool:
    """Check if a file is documentation that should be prioritized."""
    filename = path.name.lower()
    
    # Priority documentation files
    priority_files = {
        'readme.md', 'readme.txt', 'readme.rst', 'readme',
        'contributing.md', 'contributing.txt', 'contributors.md',
        'license', 'license.md', 'license.txt', 'licence', 'licence.md',
        'changelog.md', 'changelog.txt', 'history.md', 'changes.md',
        'install.md', 'installation.md', 'setup.md',
        'config.md', 'configuration.md',
        'api.md', 'docs.md', 'documentation.md',
        'getting-started.md', 'quickstart.md',
        'usage.md', 'examples.md'
    }
    
    # Check exact filename matches
    if filename in priority_files:
        return True
    
    # Check if it's in a docs directory
    if any(part.lower() in {'docs', 'doc', 'documentation'} for part in path.parts[:-1]):
        return path.suffix.lower() in {'.md', '.txt', '.rst'}
    
    # Check if it's a markdown file in the root directory
    if len(path.parts) == 1 and path.suffix.lower() == '.md':
        return True
    
    return False

# Generator that yields all code file paths under a directory, with documentation files prioritized.
def iter_code_files(root: Path):
    all_files = []
    doc_files = []
    
    for path in root.rglob("*"):  # walk recursively through all files/folders
        if path.is_dir():         # skip folders
            continue
        if ".git" in path.parts:  # skip Git metadata directory
            continue
        # skip repo noise
        if any(part in {".git", "node_modules", "dist", "build", ".next", ".cache"} for part in path.parts):
            continue
        # skip binary files
        if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".pdf", ".exe", ".zip"}:
            continue
        
        # Categorize files: documentation vs regular code files
        if is_documentation_file(path):
            doc_files.append(path)
        else:
            all_files.append(path)
    
    # Sort documentation files by priority (README.md first, then others alphabetically)
    def doc_priority(path: Path) -> tuple:
        filename = path.name.lower()
        if filename.startswith('readme'):
            return (0, filename)  # Highest priority for README files
        elif filename in {'contributing.md', 'contributing.txt', 'contributors.md'}:
            return (1, filename)
        elif filename.startswith('license') or filename.startswith('licence'):
            return (2, filename)
        else:
            return (3, filename)
    
    doc_files.sort(key=doc_priority)
    
    # Yield documentation files first, then regular files
    yield from doc_files
    yield from all_files

# Combine both: clone the repo and load each text file’s contents as context.
def load_repo_as_context(repo_url: str, ref: str = "main", max_bytes=200_000):
    repo_path = clone_repo_to_tmp(repo_url, ref)  # step 1: clone
    context_chunks = []                           # container for {path, content}

    # Iterate through all code/text files in the repo
    for file_path in iter_code_files(repo_path):
        text = file_path.read_text(errors="ignore")   # read safely ignoring bad chars
        context_chunks.append({
            "path": str(file_path.relative_to(repo_path)),  # file path relative to repo root
            "content": text[:max_bytes],                    # trim huge files
        })
    # Return list of dicts like [{'path': 'src/main.py', 'content': '...'}, ...]
    return context_chunks

# Example usage when run directly (not imported as a module)
if __name__ == "__main__":
    url = "https://github.com/AgricultureAlex/prenup"     # replace with real repo URL
    context = load_repo_as_context(url, ref="main")  # get list of file contents
    print(f"Loaded {len(context)} files")         # show how many files were read
    