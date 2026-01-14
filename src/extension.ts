import * as vscode from "vscode";
import { TranslateCommand } from "./commands/TranslateCommand";

export function activate(context: vscode.ExtensionContext): void {
    const disposable: vscode.Disposable = vscode.commands.registerCommand(
        "starPivotTranslate.translateSelection",
        TranslateCommand.handle
    );
    context.subscriptions.push(disposable);
}

export function deactivate(): void { }
