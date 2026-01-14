
import * as cp from 'child_process';
import * as os from 'os';

export class TTSService {
    /**
     * Speak the given text using system TTS capabilities
     * @param text The text to speak
     */
    public static async speak(text: string): Promise<void> {
        const platform = os.platform();
        let command = '';
        let args: string[] = [];

        try {
            if (platform === 'darwin') {
                // macOS: Use 'say' command
                command = 'say';
                args = [text];
            } else if (platform === 'win32') {
                // Windows: Use PowerShell System.Speech
                // Escape single quotes for PowerShell
                const escapedText = text.replace(/'/g, "''");
                const psCommand = `Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Speak('${escapedText}')`;
                
                command = 'powershell';
                args = ['-NoProfile', '-Command', psCommand];
            } else {
                // Linux or others: Not fully supported yet, try 'espeak' if available?
                // For now, we just log a warning to avoid errors
                console.warn(`TTS not fully supported on platform: ${platform}`);
                return;
            }

            if (command) {
                // Fire and forget, don't await the process
                const process = cp.spawn(command, args, { stdio: 'ignore' });
                process.unref(); // Allow the plugin to not wait for this process
                process.on('error', (err) => {
                    console.error('TTS execution failed:', err);
                });
            }
        } catch (error) {
            console.error('Error in TTSService:', error);
        }
    }
}
