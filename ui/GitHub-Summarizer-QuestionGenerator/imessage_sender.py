# imessage_sender.py
import subprocess
import asyncio
from typing import Optional

def send_imessage(phone_number: str, message: str) -> bool:
    """Send an iMessage using AppleScript (macOS only)."""
    try:
        # Clean phone number and message for AppleScript
        phone_number = phone_number.strip()
        message = message.replace('"', '\\"').replace('\n', '\\n')
        
        # AppleScript to send iMessage
        applescript = f'''
        tell application "Messages"
            set targetService to 1st account whose service type = iMessage
            set targetBuddy to participant "{phone_number}" of targetService
            send "{message}" to targetBuddy
        end tell
        '''
        
        # Execute AppleScript
        result = subprocess.run(
            ['osascript', '-e', applescript],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print(f"Successfully sent iMessage to {phone_number}")
            return True
        else:
            print(f"Failed to send iMessage: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("iMessage send timeout")
        return False
    except Exception as e:
        print(f"Error sending iMessage: {e}")
        return False

async def send_imessage_async(phone_number: str, message: str) -> bool:
    """Async wrapper for sending iMessages."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, send_imessage, phone_number, message)