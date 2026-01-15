
import * as vscode from "vscode";
import { TranslationService } from "@/core/TranslationService";
import { AdapterConfig, TranslationResult } from "@/core/translator/types";
import { TextFormatter } from "@/core/TextFormatter";
import { LanguageDetector } from "@/core/LanguageDetector";
import { PickItem } from "@/shared/types";
import { API_URL } from "@/env";
import { LANGUAGES } from "@/core/constants";
import { GlossaryService } from "@/core/GlossaryService";
import { HistoryService } from "@/core/HistoryService";
import { TTSService } from "@/core/TTSService";

/**
 * 翻译命令处理类
 * 负责处理 'starPivotTranslate.translateSelection' 命令
 */
export class TranslateCommand {
    /**
     * 处理翻译命令的主入口
     * 获取选区 -> 决定语言 -> 显示进度 -> 执行翻译 -> 显示结果选项 -> 应用更改
     */
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
        const vendor: string = "microsoft";
        const customApiKey: string = config.get<string>("starPivotTranslate.customApiKey") || "";
        const glossary: Record<string, string> = config.get<Record<string, string>>("starPivotTranslate.glossary") || {};

        if (!apiUrl) {
            await vscode.window.showErrorMessage("请配置翻译接口地址");
            return;
        }

        // 获取并过滤选区
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
        // 自动检测语言方向
        const decided = LanguageDetector.decideLanguages(primary.text, sourceLang, targetLang);

        // 创建并显示 QuickPick
        const qp: vscode.QuickPick<PickItem> = vscode.window.createQuickPick<PickItem>();
        qp.ignoreFocusOut = true;
        qp.items = [{ label: "翻译中…", description: "正在请求", value: "" }];
        qp.show();

        try {
            const adapterConfig: AdapterConfig = {
                apiUrl,
                customApiKey: customApiKey || undefined
            };
            const service = TranslationService.getInstance();
            const historyService = HistoryService.getInstance();

            // 并行处理所有选区的翻译请求
            const results = await Promise.all(pairs.map(async p => {
                const rawRes = await service.translate(p.text, decided.from, decided.to, vendor, adapterConfig);

                // 克隆结果以避免如果术语表更改它而改变缓存
                const res = { ...rawRes };

                // 应用术语表 (后处理)
                res.translatedText = GlossaryService.postProcess(res.translatedText, glossary);

                // 保存到历史记录
                await historyService.add(res);

                return { index: p.index, res };
            }));

            // 按索引排序以确保顺序与选区匹配
            results.sort((a, b) => a.index - b.index);
            const translations = results.map(r => r.res.translatedText);

            const t0: string = translations[0] ?? "";

            qp.placeholder = "选择格式";

            // 定义朗读按钮
            const speakButton: vscode.QuickInputButton = {
                iconPath: new vscode.ThemeIcon('play'),
                tooltip: '朗读'
            };

            // 构建选项列表
            const items: PickItem[] = decided.from === LANGUAGES.EN && decided.to === LANGUAGES.ZH_HANS
                ? [{ label: t0, description: "原文", value: t0, buttons: [speakButton] }]
                : TextFormatter.buildVariantItems(t0).map(item => ({ ...item, buttons: [speakButton] }));

            qp.items = items;
            let userSelected: boolean = false;

            await new Promise<void>((resolve: (value: void | PromiseLike<void>) => void): void => {
                // 处理朗读按钮点击
                qp.onDidTriggerItemButton((e) => {
                    const item = e.item as PickItem;
                    if (e.button === speakButton && item.value) {
                        TTSService.speak(item.value);
                    }
                });

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

                    // 应用翻译替换
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
