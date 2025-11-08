#!/usr/bin/env python3
"""
Test script for the enhanced GitHub repository analyzer.

This script tests the complete workflow including:
- Repository cloning and content extraction
- File prioritization and filtering
- Database storage and retrieval
- Analysis result structure
"""

import sys
import tempfile
import shutil
from pathlib import Path
import json
import sqlite3
from unittest.mock import patch, MagicMock

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from github_analyzer import RepositoryAnalyzer, RepositoryMetadata, AnalysisResult

def test_file_prioritization():
    """Test that file prioritization logic works correctly."""
    print("🧪 Testing file prioritization...")
    
    analyzer = RepositoryAnalyzer()
    
    test_cases = [
        # (file_path, expected_important, expected_priority_range)
        (Path("README.md"), True, 1),
        (Path("package.json"), True, 2),
        (Path("src/main.py"), True, (5, 6)),
        (Path("docs/api.md"), True, 3),
        (Path("config.json"), True, 4),
        (Path("node_modules/something.js"), False, 999),
        (Path("dist/bundle.js"), False, 999),
        (Path("image.png"), False, 999),
    ]
    
    all_passed = True
    for file_path, expected_important, expected_priority in test_cases:
        is_important, priority = analyzer._is_important_file(file_path)
        
        if isinstance(expected_priority, tuple):
            priority_ok = expected_priority[0] <= priority <= expected_priority[1]
        else:
            priority_ok = priority == expected_priority
        
        if is_important == expected_important and priority_ok:
            print(f"  ✓ {file_path}: important={is_important}, priority={priority}")
        else:
            print(f"  ✗ {file_path}: expected important={expected_important}, priority={expected_priority}, got important={is_important}, priority={priority}")
            all_passed = False
    
    return all_passed

def test_database_operations():
    """Test database storage and retrieval."""
    print("🧪 Testing database operations...")
    
    # Use temporary database
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_db:
        tmp_db_path = tmp_db.name
    
    try:
        analyzer = RepositoryAnalyzer(db_path=tmp_db_path)
        
        # Create test metadata and result
        metadata = RepositoryMetadata(
            repo_url="https://github.com/test/repo",
            ref="main",
            analysis_timestamp="2023-01-01T00:00:00Z",
            total_files=10,
            analyzed_files=5,
            total_lines=1000,
            file_types={"py": 3, "md": 2},
            repo_hash="test123"
        )
        
        analysis_result = AnalysisResult(
            repository_metadata=metadata,
            summary="Test repository",
            objectives=["Test objective"],
            architecture={"pattern": "MVC"},
            key_components=[{"name": "TestComponent", "type": "class", "purpose": "testing"}],
            tech_stack=["Python"],
            complexity_score=5,
            recommendations=["Test recommendation"],
            raw_response="Raw test response"
        )
        
        # Test storage
        analyzer._store_analysis_result(analysis_result)
        print("  ✓ Analysis stored successfully")
        
        # Test retrieval
        retrieved = analyzer._get_stored_analysis("test123")
        if retrieved and retrieved.summary == "Test repository":
            print("  ✓ Analysis retrieved successfully")
        else:
            print("  ✗ Analysis retrieval failed")
            return False
        
        # Test history
        history = analyzer.get_analysis_history()
        if len(history) > 0 and history[0]['repo_url'] == "https://github.com/test/repo":
            print("  ✓ Analysis history retrieved successfully")
        else:
            print("  ✗ Analysis history retrieval failed")
            return False
            
        return True
        
    finally:
        # Cleanup
        Path(tmp_db_path).unlink(missing_ok=True)

def create_test_repository():
    """Create a test repository structure for testing."""
    test_repo = Path(tempfile.mkdtemp(prefix="test-repo-"))
    
    # Create test files
    test_files = {
        "README.md": "# Test Repository\nThis is a test repository for analysis.",
        "package.json": '{"name": "test-repo", "version": "1.0.0"}',
        "src/main.py": """
def main():
    print("Hello, World!")

class TestClass:
    def __init__(self):
        self.value = 42
    
    def get_value(self):
        return self.value

if __name__ == "__main__":
    main()
""",
        "src/utils.py": """
def helper_function(x, y):
    return x + y

def another_helper(data):
    return len(data)
""",
        "docs/api.md": "# API Documentation\nAPI endpoints and usage.",
        "config.json": '{"debug": true, "port": 8080}',
        "tests/test_main.py": """
import unittest
from src.main import TestClass

class TestMain(unittest.TestCase):
    def test_value(self):
        tc = TestClass()
        self.assertEqual(tc.get_value(), 42)
""",
        ".gitignore": """
__pycache__/
*.pyc
node_modules/
""",
    }
    
    for file_path, content in test_files.items():
        full_path = test_repo / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content)
    
    return test_repo

def test_repository_loading():
    """Test repository content loading and analysis."""
    print("🧪 Testing repository loading...")
    
    test_repo = create_test_repository()
    
    try:
        analyzer = RepositoryAnalyzer(max_files=10, max_chars_per_file=1000)
        
        # Mock the clone operation to use our test repo
        with patch.object(analyzer, '_clone_repo_to_tmp', return_value=test_repo):
            context_chunks, metadata = analyzer._load_repository_context(
                "https://github.com/test/repo", "main"
            )
        
        # Verify context was loaded
        if len(context_chunks) > 0:
            print(f"  ✓ Loaded {len(context_chunks)} files")
        else:
            print("  ✗ No files loaded")
            return False
        
        # Check that important files are prioritized
        file_paths = [chunk['path'] for chunk in context_chunks]
        if 'README.md' in file_paths and file_paths.index('README.md') < 3:
            print("  ✓ README.md properly prioritized")
        else:
            print("  ✗ README.md not properly prioritized")
        
        # Verify metadata
        if metadata.total_files > 0 and metadata.analyzed_files > 0:
            print(f"  ✓ Metadata: {metadata.analyzed_files}/{metadata.total_files} files, {metadata.total_lines} lines")
        else:
            print("  ✗ Invalid metadata")
            return False
        
        # Check file types analysis
        if 'py' in metadata.file_types and metadata.file_types['py'] >= 2:
            print("  ✓ File type analysis working")
        else:
            print("  ✗ File type analysis not working correctly")
        
        return True
        
    finally:
        shutil.rmtree(test_repo, ignore_errors=True)

def test_prompt_generation():
    """Test OpenAI prompt generation."""
    print("🧪 Testing prompt generation...")
    
    analyzer = RepositoryAnalyzer()
    
    # Sample context and metadata
    context_chunks = [
        {"path": "README.md", "content": "# Test\nA sample repository", "size": 100, "truncated": False},
        {"path": "main.py", "content": "def main():\n    pass", "size": 50, "truncated": False}
    ]
    
    metadata = RepositoryMetadata(
        repo_url="https://github.com/test/repo",
        ref="main",
        analysis_timestamp="2023-01-01T00:00:00Z",
        total_files=10,
        analyzed_files=2,
        total_lines=150,
        file_types={"md": 1, "py": 1},
        repo_hash="test123"
    )
    
    prompt = analyzer._create_analysis_prompt(context_chunks, metadata)
    
    # Check that prompt contains key elements
    required_elements = [
        "REPOSITORY METADATA:",
        "FILES ANALYZED:",
        "CODEBASE CONTENTS:",
        "JSON format",
        "summary",
        "objectives",
        "architecture"
    ]
    
    missing_elements = [elem for elem in required_elements if elem not in prompt]
    
    if not missing_elements:
        print("  ✓ Prompt contains all required elements")
        return True
    else:
        print(f"  ✗ Missing elements in prompt: {missing_elements}")
        return False

def test_response_parsing():
    """Test OpenAI response parsing."""
    print("🧪 Testing response parsing...")
    
    analyzer = RepositoryAnalyzer()
    
    metadata = RepositoryMetadata(
        repo_url="https://github.com/test/repo",
        ref="main",
        analysis_timestamp="2023-01-01T00:00:00Z",
        total_files=10,
        analyzed_files=2,
        total_lines=150,
        file_types={"md": 1, "py": 1},
        repo_hash="test123"
    )
    
    # Test valid JSON response
    valid_response = """
Here is the analysis:

{
    "summary": "This is a test repository",
    "objectives": ["Testing", "Learning"],
    "architecture": {"pattern": "Simple", "layers": ["main"]},
    "key_components": [{"name": "Main", "type": "function", "purpose": "Entry point"}],
    "tech_stack": ["Python"],
    "complexity_score": 3,
    "recommendations": ["Add more tests"]
}
"""
    
    result = analyzer._parse_openai_response(valid_response, metadata)
    
    if (result.summary == "This is a test repository" and 
        result.objectives == ["Testing", "Learning"] and
        result.complexity_score == 3):
        print("  ✓ Valid JSON response parsed correctly")
    else:
        print("  ✗ Valid JSON response parsing failed")
        return False
    
    # Test invalid response (fallback behavior)
    invalid_response = "This is just plain text without JSON structure."
    result = analyzer._parse_openai_response(invalid_response, metadata)
    
    if result.summary and result.raw_response == invalid_response:
        print("  ✓ Invalid response handled gracefully")
        return True
    else:
        print("  ✗ Invalid response not handled properly")
        return False

def run_all_tests():
    """Run all tests."""
    print("🚀 Running Enhanced GitHub Analyzer Tests\n")
    
    tests = [
        ("File Prioritization", test_file_prioritization),
        ("Database Operations", test_database_operations), 
        ("Repository Loading", test_repository_loading),
        ("Prompt Generation", test_prompt_generation),
        ("Response Parsing", test_response_parsing),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"Testing: {test_name}")
        print('='*60)
        
        try:
            if test_func():
                print(f"✅ {test_name} PASSED")
                passed += 1
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} FAILED with exception: {e}")
    
    print(f"\n{'='*60}")
    print(f"TEST RESULTS: {passed}/{total} tests passed")
    print('='*60)
    
    if passed == total:
        print("🎉 All tests passed! The enhanced analyzer is working correctly.")
        return True
    else:
        print(f"⚠️  {total - passed} test(s) failed. Please review the implementation.")
        return False

if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)