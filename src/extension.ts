import * as vscode from "vscode";
import { TranslateCommand } from "./commands/TranslateCommand";
import { ShowHistoryCommand } from "./commands/ShowHistoryCommand";
import { HistoryService } from "./core/HistoryService";

export function activate(context: vscode.ExtensionContext): void {
    // Initialize Services
    HistoryService.initialize(context);

    const translateCmd = vscode.commands.registerCommand(
        "starPivotTranslate.translateSelection",
        TranslateCommand.handle
    );

    const historyCmd = vscode.commands.registerCommand(
        "starPivotTranslate.showHistory",
        ShowHistoryCommand.handle
    );

    context.subscriptions.push(translateCmd, historyCmd);
}

export function deactivate(): void { }
