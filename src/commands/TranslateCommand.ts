import * as vscode from "vscode";
import { TranslationApiClient } from "../infrastructure/TranslationApi";
import { TextFormatter } from "../core/TextFormatter";
import { LanguageDetector } from "../core/LanguageDetector";
import { PickItem, TranslateResponse } from "../shared/types";
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
        qp.items = [{ label: "翻译中…", description: "正在请求", value: "" }];
        qp.show();

        try {
            const resp: TranslateResponse = await TranslationApiClient.postTranslate(apiUrl, {
                translate_language: decided.to,
                text: pairs.map((p): string => p.text),
                from: decided.from
            });

            if (resp.code !== 200 || !resp.data) {
                qp.hide();
                await vscode.window.showErrorMessage(`翻译失败: ${resp.msg ?? ""}`);
                return;
            }

            const translations: string[] = resp.data;
            const t0: string = translations[primary.index] ?? "";

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
