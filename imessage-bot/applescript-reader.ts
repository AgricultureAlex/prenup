import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Use AppleScript to read the last message from a specific chat
 * This bypasses the database complexity
 */
export async function getLastMessageFromChat(chatId: string): Promise<string | null> {
  try {
    // AppleScript to get the last message text from the chat
    const script = `
      tell application "Messages"
        set targetService to 1st account whose service type = iMessage
        set targetBuddy to participant "${chatId}" of targetService
        set chatList to chats whose participants contains targetBuddy
        
        if (count of chatList) > 0 then
          set targetChat to item 1 of chatList
          set msgList to messages of targetChat
          if (count of msgList) > 0 then
            set lastMsg to item -1 of msgList
            return text of lastMsg
          end if
        end if
        
        return ""
      end tell
    `;
    
    const { stdout, stderr } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    
    if (stderr) {
      console.error('AppleScript error:', stderr);
      return null;
    }
    
    const text = stdout.trim();
    return text.length > 0 ? text : null;
  } catch (error) {
    console.error('Error reading message via AppleScript:', error);
    return null;
  }
}