"""
Lightweight GitHub / local importer utilities.

Provides functions to clone a repository using the local git binary or copy a
local path into a working directory. This avoids external dependencies and
works for public GitHub repos (or any repo accessible by git).
"""

import os
import shutil
import subprocess
import tempfile
from typing import Optional


def clone_repo(git_url: str, dest_dir: Optional[str] = None) -> str:
    """Clone a git repo to dest_dir (or a temp dir) and return the path.

    Raises CalledProcessError if cloning fails.
    """
    target = dest_dir or tempfile.mkdtemp(prefix="repo_clone_")
    if os.path.exists(target) and os.listdir(target):
        # ensure target is empty
        raise FileExistsError(f"Destination {target} exists and is not empty")

    cmd = ["git", "clone", git_url, target]
    subprocess.run(cmd, check=True)
    return target


def copy_local_path(src_path: str, dest_dir: Optional[str] = None) -> str:
    """Copy a local repository (or folder) to a working folder and return path."""
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Source path not found: {src_path}")

    target = dest_dir or tempfile.mkdtemp(prefix="repo_copy_")
    shutil.copytree(src_path, target, dirs_exist_ok=True)
    return target


def import_repo(source: str, dest_dir: Optional[str] = None) -> str:
    """Import a repository from `source`.

    If `source` looks like a git URL (contains 'github.com' or endswith '.git' or
    starts with 'http'), we attempt to clone via `git clone`. Otherwise, if it
    is a local path we copy it. Returns the path to the imported repo folder.
    """
    source = source.strip()
    # crude detection of git url
    is_git_like = (
        source.startswith("git@")
        or source.startswith("http://")
        or source.startswith("https://")
        or source.endswith(".git")
        or "github.com" in source
    )

    if is_git_like:
        return clone_repo(source, dest_dir=dest_dir)
    else:
        return copy_local_path(source, dest_dir=dest_dir)


if __name__ == "__main__":
    print("github_importer module. Use import_repo(source) from your script.")
