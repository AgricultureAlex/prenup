#!/usr/bin/env python3
"""
Test script to verify documentation file prioritization
"""
import sys
from pathlib import Path

# Add the current directory to sys.path so we can import load_repo_context
sys.path.insert(0, str(Path(__file__).parent))

import load_repo_context

def test_documentation_prioritization():
    """Test that documentation files are properly identified and prioritized."""
    
    # Test the is_documentation_file function
    test_cases = [
        # Should be documentation files
        (Path("README.md"), True),
        (Path("readme.txt"), True),
        (Path("CONTRIBUTING.md"), True),
        (Path("LICENSE"), True),
        (Path("docs/api.md"), True),
        (Path("documentation/setup.md"), True),
        (Path("quickstart.md"), True),
        
        # Should NOT be documentation files
        (Path("src/main.py"), False),
        (Path("config/settings.json"), False),
        (Path("tests/test_main.py"), False),
    ]
    
    print("Testing documentation file identification:")
    all_passed = True
    for path, expected in test_cases:
        result = load_repo_context.is_documentation_file(path)
        status = "✓" if result == expected else "✗"
        print(f"{status} {path}: {result} (expected {expected})")
        if result != expected:
            all_passed = False
    
    if all_passed:
        print("\n✓ All documentation identification tests passed!")
    else:
        print("\n✗ Some documentation identification tests failed!")
    
    return all_passed

def test_file_ordering():
    """Test that files are ordered with documentation first."""
    
    # Create a temporary directory structure for testing
    import tempfile
    import os
    
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        
        # Create some test files
        test_files = [
            "src/main.py",
            "README.md", 
            "tests/test.py",
            "CONTRIBUTING.md",
            "LICENSE",
            "docs/api.md",
            "config.json"
        ]
        
        for file_path in test_files:
            full_path = tmp_path / file_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(f"Content of {file_path}")
        
        # Test file iteration order
        files = list(load_repo_context.iter_code_files(tmp_path))
        file_names = [f.name for f in files]
        
        print("\nFile order from iter_code_files:")
        for i, name in enumerate(file_names, 1):
            print(f"{i}. {name}")
        
        # Check that README comes first
        if file_names[0].lower().startswith('readme'):
            print("✓ README file is prioritized first!")
            return True
        else:
            print("✗ README file is not first in the ordering!")
            return False

if __name__ == "__main__":
    print("Testing GitHub Integration Documentation Prioritization\n")
    
    test1_passed = test_documentation_prioritization()
    test2_passed = test_file_ordering()
    
    if test1_passed and test2_passed:
        print("\n🎉 All tests passed! Documentation prioritization is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the implementation.")