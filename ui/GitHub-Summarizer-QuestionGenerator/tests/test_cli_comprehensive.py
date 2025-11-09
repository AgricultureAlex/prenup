#!/usr/bin/env python3
"""
Comprehensive CLI testing for GitHub Repository Analyzer
Tests various option combinations, help displays, and error handling.
"""

import subprocess
import sys
import tempfile
import json
from pathlib import Path
import os

class CLITestRunner:
    """Test runner for CLI functionality."""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.cli_script = self.base_dir / "cli_analyzer.py"
        self.test_artifacts = []
        self.passed = 0
        self.total = 0
    
    def run_cli_command(self, args, expect_success=True):
        """Run a CLI command and return result."""
        cmd = [sys.executable, str(self.cli_script)] + args
        try:
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                timeout=30,
                cwd=self.base_dir
            )
            
            if expect_success and result.returncode != 0:
                print(f"  ✗ Command failed: {' '.join(cmd)}")
                print(f"    Error: {result.stderr}")
                return False, result.stdout, result.stderr
            elif not expect_success and result.returncode == 0:
                print(f"  ✗ Command should have failed but succeeded: {' '.join(cmd)}")
                return False, result.stdout, result.stderr
            
            return True, result.stdout, result.stderr
            
        except subprocess.TimeoutExpired:
            print(f"  ✗ Command timed out: {' '.join(cmd)}")
            return False, "", "Timeout"
        except Exception as e:
            print(f"  ✗ Command exception: {' '.join(cmd)}: {e}")
            return False, "", str(e)
    
    def test_help_commands(self):
        """Test all help command variations."""
        print("🧪 Testing Help Commands...")
        
        help_tests = [
            # Main help
            (["-h"], "Main help display"),
            (["--help"], "Main help with --help"),
            
            # Subcommand help
            (["analyze", "-h"], "Analyze command help"),
            (["analyze", "--help"], "Analyze command help with --help"),
            (["history", "-h"], "History command help"),
            (["export", "-h"], "Export command help"),
        ]
        
        for args, description in help_tests:
            success, stdout, stderr = self.run_cli_command(args)
            self.total += 1
            
            if success and "usage:" in stdout and not stderr:
                print(f"  ✓ {description}")
                self.passed += 1
                
                # Check for specific elements in analyze help
                if "analyze" in args:
                    if "--subfolder" in stdout and "-s" in stdout:
                        print(f"  ✓ Subfolder option visible in help")
                    else:
                        print(f"  ✗ Subfolder option missing from help")
                        self.total += 1
                        continue
                    self.total += 1
                    self.passed += 1
            else:
                print(f"  ✗ {description}")
                if stderr:
                    print(f"    Error: {stderr}")
    
    def test_invalid_commands(self):
        """Test invalid command handling."""
        print("🧪 Testing Invalid Commands...")
        
        invalid_tests = [
            # Invalid subcommand
            (["invalid-command"], "Invalid subcommand"),
            
            # Missing required arguments
            (["analyze"], "Missing repository URL"),
            (["export"], "Missing repository URL"),
            (["export", "https://github.com/user/repo"], "Missing required output file"),
            
            # Invalid options
            (["analyze", "https://github.com/user/repo", "--invalid-option"], "Invalid option"),
            (["analyze", "https://github.com/user/repo", "--max-files", "invalid"], "Invalid max-files value"),
        ]
        
        for args, description in invalid_tests:
            success, stdout, stderr = self.run_cli_command(args, expect_success=False)
            self.total += 1
            
            if success:  # success here means it failed as expected
                print(f"  ✓ {description} - properly rejected")
                self.passed += 1
            else:
                print(f"  ✗ {description} - should have failed")
    
    def test_valid_option_combinations(self):
        """Test valid option combinations (without actual execution)."""
        print("🧪 Testing Valid Option Combinations...")
        
        # Create test database file for these tests
        test_db = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
        test_db.close()
        self.test_artifacts.append(test_db.name)
        
        test_output = tempfile.NamedTemporaryFile(suffix='.json', delete=False)
        test_output.close() 
        self.test_artifacts.append(test_output.name)
        
        # Since we can't actually analyze repos without API keys, we'll test dry-run scenarios
        # Note: Global arguments (--db-path, --verbose) must come before subcommand
        option_tests = [
            # Basic analyze command variations
            (["--db-path", test_db.name, "analyze", "https://github.com/octocat/Hello-World"],
             "Basic analyze with custom DB"),
             
            # Analyze with subfolder
            (["--db-path", test_db.name, "analyze", "https://github.com/octocat/Hello-World", "--subfolder", "docs"],
             "Analyze with subfolder"),
             
            # Analyze with multiple options
            (["--db-path", test_db.name, "analyze", "https://github.com/octocat/Hello-World",
              "--ref", "main", "--subfolder", "src", "--max-files", "10",
              "--max-chars", "5000", "--model", "gpt-4o-mini",
              "--output", test_output.name],
             "Analyze with all options"),
             
            # History commands
            (["--db-path", test_db.name, "history"], "History command"),
            (["--db-path", test_db.name, "history", "https://github.com/octocat/Hello-World"],
             "History for specific repo"),
             
            # Export commands
            (["--db-path", test_db.name, "export", "https://github.com/octocat/Hello-World",
              "--output", test_output.name],
             "Basic export"),
             
            (["--db-path", test_db.name, "export", "https://github.com/octocat/Hello-World",
              "--ref", "main", "--subfolder", "docs",
              "--output", test_output.name],
             "Export with subfolder"),
        ]
        
        for args, description in option_tests:
            # We expect these to fail gracefully (no API key, no actual repo)
            # but the argument parsing should work
            success, stdout, stderr = self.run_cli_command(args, expect_success=False)
            self.total += 1
            
            # Check if it failed for the right reasons (missing API key, network issues)
            # rather than argument parsing issues
            if ("Error during analysis" in stderr or 
                "OPENAI_API_KEY" in stderr or 
                "Failed to clone" in stderr or
                "No analysis found" in stdout or
                "No analysis history found" in stdout):
                print(f"  ✓ {description} - arguments parsed correctly")
                self.passed += 1
            else:
                print(f"  ✗ {description} - unexpected error")
                print(f"    stdout: {stdout[:100]}...")
                print(f"    stderr: {stderr[:100]}...")
    
    def test_verbose_logging(self):
        """Test verbose logging option."""
        print("🧪 Testing Verbose Logging...")
        
        # Test with verbose flag
        success, stdout, stderr = self.run_cli_command(
            ["--verbose", "history"], expect_success=True
        )
        self.total += 1
        
        if success and ("No analysis history found" in stdout or "ANALYSIS HISTORY" in stdout):
            print(f"  ✓ Verbose logging works")
            self.passed += 1
        else:
            print(f"  ✗ Verbose logging test failed")
            print(f"    stdout: {stdout}")
            print(f"    stderr: {stderr}")
    
    def cleanup(self):
        """Clean up test artifacts."""
        print("🧹 Cleaning up test artifacts...")
        for artifact in self.test_artifacts:
            try:
                if os.path.exists(artifact):
                    os.unlink(artifact)
                    print(f"  ✓ Removed {artifact}")
            except Exception as e:
                print(f"  ✗ Failed to remove {artifact}: {e}")
    
    def run_all_tests(self):
        """Run all CLI tests."""
        print("🚀 Running Comprehensive CLI Tests")
        print("=" * 60)
        
        try:
            self.test_help_commands()
            print()
            
            self.test_invalid_commands()  
            print()
            
            self.test_valid_option_combinations()
            print()
            
            self.test_verbose_logging()
            print()
            
        finally:
            self.cleanup()
            
        print("=" * 60)
        print(f"CLI TEST RESULTS: {self.passed}/{self.total} tests passed")
        print("=" * 60)
        
        if self.passed == self.total:
            print("🎉 All CLI tests passed!")
            return True
        else:
            print(f"⚠️  {self.total - self.passed} test(s) failed.")
            return False

def main():
    """Run CLI tests."""
    runner = CLITestRunner()
    success = runner.run_all_tests()
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())