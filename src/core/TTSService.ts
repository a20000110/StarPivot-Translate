
import * as cp from 'child_process';
import * as os from 'os';

/**
 * 文本转语音 (TTS) 服务
 * 提供跨平台的朗读功能
 */
export class TTSService {
    /**
     * 使用系统 TTS 能力朗读文本
     * @param text 待朗读的文本
     */
    public static async speak(text: string): Promise<void> {
        const platform = os.platform();
        let command = '';
        let args: string[] = [];

        try {
            if (platform === 'darwin') {
                // macOS: 使用 'say' 命令
                command = 'say';
                args = [text];
            } else if (platform === 'win32') {
                // Windows: 使用 PowerShell System.Speech
                // 为 PowerShell 转义单引号
                const escapedText = text.replace(/'/g, "''");
                const psCommand = `Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Speak('${escapedText}')`;
                
                command = 'powershell';
                args = ['-NoProfile', '-Command', psCommand];
            } else {
                // Linux 或其他平台: 暂未完全支持，尝试 'espeak' 如果可用?
                // 目前仅打印警告以避免错误
                console.warn(`当前平台暂未完全支持 TTS: ${platform}`);
                return;
            }

            if (command) {
                // 发送即忘，不等待进程结束
                const process = cp.spawn(command, args, { stdio: 'ignore' });
                process.unref(); // 允许插件不等待此进程
                process.on('error', (err) => {
                    console.error('TTS 执行失败:', err);
                });
            }
        } catch (error) {
            console.error('TTSService 发生错误:', error);
        }
    }
}
