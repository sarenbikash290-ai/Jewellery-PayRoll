import fs from 'fs';
import path from 'path';

/**
 * Safely writes JSON content atomically to a file to prevent concurrent write corruptions.
 */
export function writeJsonAtomic(filePath: string, data: any): void {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  // Create a unique temporary file path in the same directory
  const tempPath = path.join(directory, `.${path.basename(filePath)}.${Math.random().toString(36).substring(2)}.tmp`);

  try {
    // Write contents to temporary file
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    // Rename temporary file to target file (atomic rename)
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    // Clean up temporary file in case of error
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch {}
    }
    throw error;
  }
}
