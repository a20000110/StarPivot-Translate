
import * as vscode from "vscode";
import * as path from "path";
import { TranslationService } from "@/core/TranslationService";
import { AdapterConfig } from "@/core/translator/types";
import { TextFormatter } from "@/core/TextFormatter";
import { LanguageDetector } from "@/core/LanguageDetector";
import { PickItem } from "@/shared/types";
import { API_URL } from "@/env";
import { LANGUAGES } from "@/core/constants";
import { GlossaryService } from "@/core/GlossaryService";
import { HistoryService } from "@/core/HistoryService";
import { TTSService } from "@/core/TTSService";

/**
 * 翻译文件名命令处理类
 * 负责处理 'starPivotTranslate.translateFile' 命令
 */
export class TranslateFileCommand {
    /**
     * 处理翻译文件名命令的主入口
     * @param uri 文件 URI
     */
    public static async handle(uri?: vscode.Uri): Promise<void> {
        // 如果没有传入 URI（通过快捷键触发且焦点不在资源管理器项上时），尝试使用当前活动编辑器的 URI
        if (!uri) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                uri = editor.document.uri;
            }
        }

        if (!uri) {
            // 仍然没有 URI，可能是焦点在资源管理器空白处，或者无法确定上下文
            // 这种情况下静默失败或提示用户
            return;
        }

        const targetUri = uri; // 确保在闭包中使用非空 URI

        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();
        const sourceLang: string = config.get<string>("starPivotTranslate.sourceLanguage") ?? LANGUAGES.ZH_HANS;
        const targetLang: string = config.get<string>("starPivotTranslate.targetLanguage") ?? LANGUAGES.EN;
        const apiUrl: string = config.get<string>("starPivotTranslate.apiUrl") || API_URL;
        const vendor: string = config.get<string>("starPivotTranslate.vendor") || "microsoft";
        const customApiKey: string = config.get<string>("starPivotTranslate.customApiKey") || "";
        const glossary: Record<string, string> = config.get<Record<string, string>>("starPivotTranslate.glossary") || {};

        if (!apiUrl) {
            await vscode.window.showErrorMessage("请配置翻译接口地址");
            return;
        }

        // 获取文件名（不含扩展名）
        const ext = path.extname(targetUri.fsPath);
        const fileName = path.basename(targetUri.fsPath, ext);

        if (!fileName) {
            return;
        }

        // 解决重命名输入框激活时按快捷键导致的焦点冲突问题
        // 先聚焦到编辑器，迫使资源管理器中的重命名输入框关闭（取消重命名）
        await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');

        // 增加短暂延时，确保 UI 状态完全更新，避免重命名框关闭时的事件干扰 QuickPick
        await new Promise(resolve => setTimeout(resolve, 150));

        // 自动检测语言方向
        const decided = LanguageDetector.decideLanguages(fileName, sourceLang, targetLang);

        // 创建并显示 QuickPick
        const qp: vscode.QuickPick<PickItem> = vscode.window.createQuickPick<PickItem>();
        qp.ignoreFocusOut = true;
        qp.items = [{ label: "翻译中…", description: `正在请求 (${vendor})`, value: "" }];
        qp.show();

        try {
            const adapterConfig: AdapterConfig = {
                apiUrl,
                customApiKey: customApiKey || undefined
            };
            const service = TranslationService.getInstance();
            const historyService = HistoryService.getInstance();

            const rawRes = await service.translate(fileName, decided.from, decided.to, vendor, adapterConfig);

            // 克隆结果
            const res = { ...rawRes };

            // 应用术语表 (后处理)
            res.translatedText = GlossaryService.postProcess(res.translatedText, glossary);

            // 保存到历史记录
            await historyService.add(res);

            const t0: string = res.translatedText;

            qp.placeholder = "选择以重命名文件 (Esc 取消)";

            // 定义朗读按钮
            const speakButton: vscode.QuickInputButton = {
                iconPath: new vscode.ThemeIcon('play'),
                tooltip: '朗读'
            };

            // 定义复制按钮
            const copyButton: vscode.QuickInputButton = {
                iconPath: new vscode.ThemeIcon('copy'),
                tooltip: '仅复制'
            };

            // 构建选项列表
            const items: PickItem[] = decided.from === LANGUAGES.EN && decided.to === LANGUAGES.ZH_HANS
                ? [{ label: t0, description: "原文 (点击重命名)", value: t0, buttons: [speakButton, copyButton] }]
                : TextFormatter.buildVariantItems(t0).map(item => ({
                    ...item,
                    description: `${item.description || ''} (点击重命名)`,
                    buttons: [speakButton, copyButton]
                }));

            qp.items = items;
            let userSelected: boolean = false;

            await new Promise<void>((resolve: (value: void | PromiseLike<void>) => void): void => {
                // 处理按钮点击
                qp.onDidTriggerItemButton(async (e: vscode.QuickPickItemButtonEvent<PickItem>): Promise<void> => {
                    const item = e.item as PickItem;
                    if (!item.value) { return; }

                    if (e.button === speakButton) {
                        TTSService.speak(item.value);
                    } else if (e.button === copyButton) {
                        await vscode.env.clipboard.writeText(item.value);
                        await vscode.window.showInformationMessage(`已复制: ${item.value}`);
                        qp.hide();
                        resolve();
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
                    const newValue: string = chosen.value;

                    // 执行文件重命名
                    try {
                        const newPath = path.join(path.dirname(targetUri.fsPath), newValue + ext);
                        const newUri = vscode.Uri.file(newPath);

                        const edit = new vscode.WorkspaceEdit();
                        edit.renameFile(targetUri, newUri);
                        await vscode.workspace.applyEdit(edit);
                        // 不需要提示消息，UI变化很明显
                    } catch (err) {
                        const message: string = err instanceof Error ? err.message : String(err);
                        await vscode.window.showErrorMessage(`重命名失败: ${message}`);
                    }

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
