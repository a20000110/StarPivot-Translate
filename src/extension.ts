import * as vscode from "vscode";
import { postTranslate, TranslateResponse } from "./api";
import { API_URL } from "./env";

type PickItem = vscode.QuickPickItem & { value: string };

function wordsOf(input: string): string[] {
    const matches: RegExpMatchArray | null = input.trim().match(/[A-Za-z0-9]+/g);
    return (matches ?? []).map((w: string): string => w);
}

function capitalize(word: string): string {
    if (word.length === 0) return word;
    const head: string = word.charAt(0).toUpperCase();
    const tail: string = word.slice(1).toLowerCase();
    return head + tail;
}

function containsChinese(input: string): boolean {
    const re: RegExp = /[\u4E00-\u9FFF]/;
    return re.test(input);
}

function containsLatinLetters(input: string): boolean {
    const re: RegExp = /[A-Za-z]/;
    return re.test(input);
}

function decideLanguages(input: string, fallbackSource: string, fallbackTarget: string): { from: string; to: string } {
    if (containsChinese(input)) {
        return { from: "zh-Hans", to: "en" };
    }
    if (containsLatinLetters(input)) {
        return { from: "en", to: "zh-Hans" };
    }
    return { from: fallbackSource, to: fallbackTarget };
}

function toTitleCase(input: string): string {
    const ws: string[] = wordsOf(input).map((w: string): string => capitalize(w));
    return ws.join(" ");
}

function toKebabCase(input: string, upper: boolean = false): string {
    const ws: string[] = wordsOf(input).map((w: string): string => upper ? w.toUpperCase() : w.toLowerCase());
    return ws.join("-");
}

function toSnakeCase(input: string, upper: boolean = false): string {
    const ws: string[] = wordsOf(input).map((w: string): string => upper ? w.toUpperCase() : w.toLowerCase());
    return ws.join("_");
}

function toPascalCase(input: string): string {
    const ws: string[] = wordsOf(input).map((w: string): string => capitalize(w));
    return ws.join("");
}

function toCamelCase(input: string): string {
    const ws: string[] = wordsOf(input);
    if (ws.length === 0) return "";
    const head: string = ws[0].toLowerCase();
    const tail: string = ws.slice(1).map((w: string): string => capitalize(w)).join("");
    return head + tail;
}

function buildVariantItems(text: string): PickItem[] {
    const items: PickItem[] = [
        { label: text, description: "原文", value: text },
        { label: text.toLowerCase(), description: "小写", value: text.toLowerCase() },
        { label: text.toUpperCase(), description: "大写", value: text.toUpperCase() },
        { label: toTitleCase(text), description: "首字母大写", value: toTitleCase(text) },
        { label: toPascalCase(text), description: "大驼峰", value: toPascalCase(text) },
        { label: toCamelCase(text), description: "小驼峰", value: toCamelCase(text) },
        { label: toKebabCase(text), description: "kebab-case", value: toKebabCase(text) },
        { label: toSnakeCase(text), description: "snake_case", value: toSnakeCase(text) },
        { label: toKebabCase(text, true), description: "大写kebab-case", value: toKebabCase(text, true) },
        { label: toSnakeCase(text, true), description: "大写snake_case", value: toSnakeCase(text, true) },
    ];
    return items;
}

export function activate(context: vscode.ExtensionContext): void {
    const disposable: vscode.Disposable = vscode.commands.registerCommand("starPivotTranslate.translateSelection", async (): Promise<void> => {
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
        if (!editor) {
            await vscode.window.showInformationMessage("当前没有活动编辑器");
            return;
        }
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();
        const sourceLang: string = config.get<string>("starPivotTranslate.sourceLanguage") ?? "zh-Hans";
        const targetLang: string = config.get<string>("starPivotTranslate.targetLanguage") ?? "en";
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
        const decided: { from: string; to: string } = decideLanguages(primary.text, sourceLang, targetLang);
        const qp: vscode.QuickPick<PickItem> = vscode.window.createQuickPick<PickItem>();
        qp.ignoreFocusOut = true;
        qp.items = [{ label: "翻译中…", description: "正在请求", value: "" }];
        qp.show();

        try {
            const resp: TranslateResponse = await postTranslate(apiUrl, {
                translate_language: decided.to,
                text: pairs.map((p: { index: number; text: string; sel: vscode.Selection }): string => p.text),
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
            const items: PickItem[] = decided.from === "en" && decided.to === "zh-Hans"
                ? [{ label: t0, description: "原文", value: t0 }]
                : buildVariantItems(t0);
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
    });
    context.subscriptions.push(disposable);
}

export function deactivate(): void { }
