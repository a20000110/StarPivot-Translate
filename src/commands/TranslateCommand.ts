
import * as vscode from "vscode";
import { TranslatorFactory } from "../core/translator/TranslatorFactory";
import { AdapterConfig, TranslationResult } from "../core/translator/types";
import { TextFormatter } from "../core/TextFormatter";
import { LanguageDetector } from "../core/LanguageDetector";
import { PickItem } from "../shared/types";
import { API_URL } from "../env";
import { LANGUAGES } from "../core/constants";

export class TranslateCommand {
    public static async handle(): Promise<void> {
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
        if (!editor) {
            await vscode.window.showInformationMessage("当前没有活动编辑器");
            return;
        }
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();
        const sourceLang: string = config.get<string>("starPivotTranslate.sourceLanguage") ?? LANGUAGES.ZH_HANS;
        const targetLang: string = config.get<string>("starPivotTranslate.targetLanguage") ?? LANGUAGES.EN;
        const apiUrl: string = config.get<string>("starPivotTranslate.apiUrl") || API_URL;
        const vendor: string = config.get<string>("starPivotTranslate.vendor") || "microsoft";

        if (!apiUrl) {
            await vscode.window.showErrorMessage("请配置翻译接口地址");
            return;
        }

        const pairs: Array<{ index: number; text: string; sel: vscode.Selection }> = editor.selections
            .map((sel: vscode.Selection, i: number): { index: number; text: string; sel: vscode.Selection } => {
                const txt: string = editor.document.getText(sel);
                return { index: i, text: txt.trim(), sel };
            })
            .filter((p: { index: number; text: string; sel: vscode.Selection }): boolean => p.text.length > 0);

        if (pairs.length === 0) {
            await vscode.window.showInformationMessage("请先选中需要翻译的文本");
            return;
        }

        const primary: { index: number; text: string; sel: vscode.Selection } = pairs[0];
        const decided = LanguageDetector.decideLanguages(primary.text, sourceLang, targetLang);

        const qp: vscode.QuickPick<PickItem> = vscode.window.createQuickPick<PickItem>();
        qp.ignoreFocusOut = true;
        qp.items = [{ label: "翻译中…", description: `正在请求 (${vendor})`, value: "" }];
        qp.show();

        try {
            const adapterConfig: AdapterConfig = { apiUrl };
            const translator = TranslatorFactory.createTranslator(vendor, adapterConfig);

            // Parallel requests for all selections
            const results = await Promise.all(pairs.map(p =>
                translator.translate(p.text, decided.from, decided.to)
                    .then(res => ({ index: p.index, res }))
                    .catch(err => {
                        throw err; // Fail fast or handle individual error? 
                        // For now, fail fast to match previous behavior
                    })
            ));

            // Sort by index to ensure order matches pairs
            results.sort((a, b) => a.index - b.index);
            const translations = results.map(r => r.res.translatedText);

            const t0: string = translations[0] ?? "";

            qp.placeholder = "选择格式";
            const items: PickItem[] = decided.from === LANGUAGES.EN && decided.to === LANGUAGES.ZH_HANS
                ? [{ label: t0, description: "原文", value: t0 }]
                : TextFormatter.buildVariantItems(t0);

            qp.items = items;
            let userSelected: boolean = false;

            await new Promise<void>((resolve: (value: void | PromiseLike<void>) => void): void => {
                qp.onDidChangeSelection((items: readonly PickItem[]): void => {
                    userSelected = items.length > 0;
                });
                qp.onDidAccept(async (): Promise<void> => {
                    if (!userSelected) {
                        return;
                    }
                    const chosen: PickItem | undefined = qp.selectedItems[0] as PickItem | undefined;
                    if (!chosen || !chosen.value) {
                        resolve();
                        return;
                    }
                    qp.hide();
                    const value: string = chosen.value;

                    // Replace all selections?
                    // Previous code:
                    // const value: string = chosen.value;
                    // await editor.edit((builder: vscode.TextEditorEdit): void => {
                    //    builder.replace(primary.sel, value);
                    // });
                    // It only replaced the PRIMARY selection! 
                    // Wait, look at previous code:
                    // await editor.edit((builder: vscode.TextEditorEdit): void => {
                    //    builder.replace(primary.sel, value);
                    // });
                    // Yes, it only replaced primary.sel. 
                    // But pairs had multiple items.
                    // If user selected multiple ranges, only the first one was replaced?
                    // That seems like a bug or limitation in previous code.
                    // But I should preserve behavior or improve it?
                    // "Translate Selection" usually implies translating all.
                    // But the "QuickPick" UI forces choosing ONE format for the FIRST translation.
                    // If I have multiple selections, do I apply that format to ALL?
                    // If I choose "CamelCase", do I apply CamelCase to all?
                    // Yes, likely.
                    // But TextFormatter.buildVariantItems is based on t0 (first translation).

                    // Let's stick to replacing primary for now to match exactly previous behavior, 
                    // OR improved: replace all with the same style.
                    // Given v1.0 is "Standardization", I'll stick to matching previous logic 
                    // but if previous logic was "replace primary", I'll do that.
                    // Actually, if I look closely at previous code:
                    // It calculated `translations` (array).
                    // But `builder.replace(primary.sel, value)` uses `primary.sel`.
                    // It ignored other translations!
                    // Okay, I will reproduce that behavior for now.

                    await editor.edit((builder: vscode.TextEditorEdit): void => {
                        builder.replace(primary.sel, value);
                    });
                    resolve();
                });
                qp.onDidHide((): void => resolve());
            });
        } catch (err) {
            qp.hide();
            const message: string = err instanceof Error ? err.message : String(err);
            await vscode.window.showErrorMessage(`翻译请求错误: ${message}`);
        }
    }
}
