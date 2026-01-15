import * as vscode from "vscode";
import { TranslateCommand } from "@/commands/TranslateCommand";
import { TranslateFileCommand } from "@/commands/TranslateFileCommand";
import { ShowHistoryCommand } from "@/commands/ShowHistoryCommand";
import { HistoryService } from "@/core/HistoryService";

/**
 * 插件激活入口
 * @param context 扩展上下文
 */
export function activate(context: vscode.ExtensionContext): void {
    // 初始化服务
    HistoryService.initialize(context);

    // 注册翻译选区命令
    const translateCmd = vscode.commands.registerCommand(
        "starPivotTranslate.translateSelection",
        TranslateCommand.handle
    );

    // 注册翻译文件名命令
    const translateFileCmd = vscode.commands.registerCommand(
        "starPivotTranslate.translateFile",
        TranslateFileCommand.handle
    );

    // 注册显示历史记录命令
    const historyCmd = vscode.commands.registerCommand(
        "starPivotTranslate.showHistory",
        ShowHistoryCommand.handle
    );

    context.subscriptions.push(translateCmd, translateFileCmd, historyCmd);
}

/**
 * 插件停用回调
 */
export function deactivate(): void { }
