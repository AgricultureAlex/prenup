"""
Progress indicators and loading utilities for GitHub Repository Analyzer
"""

import threading
import time
import sys
from typing import Optional

class LoadingSpinner:
    """A simple spinning loading indicator."""
    
    def __init__(self, message: str = "Loading", show_time: bool = True):
        self.message = message
        self.show_time = show_time
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.start_time = 0
        
    def _spin(self):
        """Internal method to display the spinning animation."""
        spinner_chars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
        i = 0
        
        while self.is_running:
            elapsed = time.time() - self.start_time if self.show_time else 0
            if self.show_time and elapsed > 0:
                time_str = f" ({elapsed:.1f}s)"
            else:
                time_str = ""
                
            # Clear line and show spinner
            sys.stdout.write(f'\r{spinner_chars[i]} {self.message}{time_str}')
            sys.stdout.flush()
            
            i = (i + 1) % len(spinner_chars)
            time.sleep(0.1)
    
    def start(self):
        """Start the loading spinner."""
        if not self.is_running:
            self.is_running = True
            self.start_time = time.time()
            self.thread = threading.Thread(target=self._spin, daemon=True)
            self.thread.start()
    
    def stop(self, success_message: Optional[str] = None):
        """Stop the loading spinner and optionally show a success message."""
        if self.is_running:
            self.is_running = False
            if self.thread:
                self.thread.join(timeout=1)
            
            # Clear the spinner line
            sys.stdout.write('\r' + ' ' * 80 + '\r')
            
            if success_message:
                elapsed = time.time() - self.start_time if self.show_time else 0
                if self.show_time and elapsed > 0:
                    print(f"✓ {success_message} ({elapsed:.1f}s)")
                else:
                    print(f"✓ {success_message}")
            sys.stdout.flush()
    
    def __enter__(self):
        """Context manager entry."""
        self.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        if exc_type is None:
            self.stop()
        else:
            # If there was an exception, show an error
            self.stop()
            print("✗ Operation failed")

class ProgressBar:
    """A simple progress bar for operations with known progress."""
    
    def __init__(self, total: int, message: str = "Progress", width: int = 40):
        self.total = total
        self.current = 0
        self.message = message
        self.width = width
        self.start_time = time.time()
    
    def update(self, increment: int = 1):
        """Update progress by increment amount."""
        self.current = min(self.current + increment, self.total)
        self._display()
    
    def set_progress(self, current: int):
        """Set absolute progress value."""
        self.current = min(current, self.total)
        self._display()
    
    def _display(self):
        """Internal method to display the progress bar."""
        if self.total == 0:
            percentage = 100
            filled_length = self.width
        else:
            percentage = (self.current / self.total) * 100
            filled_length = int(self.width * self.current // self.total)
        
        # Create the progress bar
        bar = '█' * filled_length + '░' * (self.width - filled_length)
        elapsed = time.time() - self.start_time
        
        # Clear line and show progress
        sys.stdout.write(f'\r{self.message}: |{bar}| {self.current}/{self.total} ({percentage:.1f}%) {elapsed:.1f}s')
        sys.stdout.flush()
    
    def finish(self, success_message: Optional[str] = None):
        """Complete the progress bar."""
        self.current = self.total
        self._display()
        print()  # New line
        
        if success_message:
            elapsed = time.time() - self.start_time
            print(f"✓ {success_message} ({elapsed:.1f}s)")

class DotProgress:
    """Simple dot-based progress indicator for unknown duration tasks."""
    
    def __init__(self, message: str = "Processing", max_dots: int = 3):
        self.message = message
        self.max_dots = max_dots
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.start_time = 0
    
    def _animate(self):
        """Internal method to display dot animation."""
        dots = 0
        while self.is_running:
            dot_str = '.' * dots + ' ' * (self.max_dots - dots)
            elapsed = time.time() - self.start_time
            
            sys.stdout.write(f'\r{self.message}{dot_str} ({elapsed:.1f}s)')
            sys.stdout.flush()
            
            dots = (dots + 1) % (self.max_dots + 1)
            time.sleep(0.5)
    
    def start(self):
        """Start the dot animation."""
        if not self.is_running:
            self.is_running = True
            self.start_time = time.time()
            self.thread = threading.Thread(target=self._animate, daemon=True)
            self.thread.start()
    
    def stop(self, success_message: Optional[str] = None):
        """Stop the dot animation."""
        if self.is_running:
            self.is_running = False
            if self.thread:
                self.thread.join(timeout=1)
            
            # Clear the line
            sys.stdout.write('\r' + ' ' * 80 + '\r')
            
            if success_message:
                elapsed = time.time() - self.start_time
                print(f"✓ {success_message} ({elapsed:.1f}s)")
            sys.stdout.flush()
    
    def __enter__(self):
        """Context manager entry."""
        self.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        if exc_type is None:
            self.stop()
        else:
            self.stop()
            print("✗ Operation failed")

def no_progress_context():
    """A dummy context manager that does nothing - for programmatic usage."""
    class NoProgress:
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc_val, exc_tb):
            pass
    return NoProgress()