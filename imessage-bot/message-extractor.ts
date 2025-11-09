import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';

const DB_PATH = join(homedir(), 'Library', 'Messages', 'chat.db');

/**
 * Extract plain text from NSAttributedString binary data
 * This handles the attributedBody column which stores text in binary format (NSKeyedArchiver)
 */
function extractTextFromAttributedBody(binaryData: Buffer | null): string | null {
  if (!binaryData) return null;
  
  try {
    // Strategy 1: Look for length-prefixed strings (common in NSKeyedArchiver)
    // Format is often: <length_marker><text_bytes>
    for (let i = 0; i < binaryData.length - 3; i++) {
      // Look for patterns like: [small_number] [printable chars]
      const possibleLength = binaryData[i];
      
      // Check if this could be a length marker (1-255)
      if (possibleLength > 0 && possibleLength < 256 && i + possibleLength < binaryData.length) {
        let textBytes: number[] = [];
        let allPrintable = true;
        
        // Extract the next 'possibleLength' bytes
        for (let j = i + 1; j <= i + possibleLength && j < binaryData.length; j++) {
          const byte = binaryData[j];
          // Check if it's a printable ASCII character (space to ~)
          if (byte >= 32 && byte <= 126) {
            textBytes.push(byte);
          } else if (byte >= 0xC0) {
            // Might be UTF-8 multibyte character, include it
            textBytes.push(byte);
          } else {
            allPrintable = false;
            break;
          }
        }
        
        // If we found a good string of the right length
        if (allPrintable && textBytes.length === possibleLength && textBytes.length > 0) {
          const text = Buffer.from(textBytes).toString('utf8').trim();
          // Verify it's meaningful text (not just symbols)
          if (text.length > 0 && /[a-zA-Z0-9]/.test(text)) {
            return text;
          }
        }
      }
    }
    
    // Strategy 2: Find continuous sequences of printable characters
    let bestText = '';
    let currentText = '';
    
    for (let i = 0; i < binaryData.length; i++) {
      const byte = binaryData[i];
      if ((byte >= 32 && byte <= 126) || byte >= 0xC0) { // Printable ASCII or UTF-8
        currentText += String.fromCharCode(byte);
      } else {
        if (currentText.length > bestText.length && /[a-zA-Z]/.test(currentText)) {
          bestText = currentText;
        }
        currentText = '';
      }
    }
    
    if (currentText.length > bestText.length && /[a-zA-Z]/.test(currentText)) {
      bestText = currentText;
    }
    
    if (bestText.length > 0) {
      return bestText.trim();
    }
  } catch (error) {
    console.error('Error extracting text from attributedBody:', error);
  }
  
  return null;
}

/**
 * Get message text, trying both text and attributedBody columns
 */
export function getMessageText(messageId: string): string | null {
  const db = new Database(DB_PATH, { readonly: true });
  
  try {
    const stmt = db.prepare('SELECT text, attributedBody FROM message WHERE ROWID = ?');
    const row = stmt.get(messageId) as { text: string | null; attributedBody: Buffer | null } | undefined;
    
    if (!row) {
      return null;
    }
    
    // First try the text column
    if (row.text && row.text.trim().length > 0) {
      return row.text;
    }
    
    // If text is null/empty, try extracting from attributedBody
    if (row.attributedBody) {
      const extracted = extractTextFromAttributedBody(row.attributedBody);
      if (extracted) {
        return extracted;
      }
    }
    
    return null;
  } finally {
    db.close();
  }
}