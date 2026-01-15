
import * as vscode from "vscode";
import { HistoryService, HistoryItem } from "@/core/HistoryService";

/**
 * 显示历史记录命令处理类
 * 负责处理 'starPivotTranslate.showHistory' 命令
 */
export class ShowHistoryCommand {
    /**
     * 处理显示历史记录命令
     * 从 HistoryService 获取记录 -> 显示 QuickPick -> 选中后复制到剪贴板
     */
    public static async handle(): Promise<void> {
        const history = HistoryService.getInstance().getHistory();

        if (history.length === 0) {
            await vscode.window.showInformationMessage("暂无翻译历史");
            return;
        }

        const items = history.map(item => {
            return {
                label: `${item.originalText} → ${item.translatedText}`,
                description: `${item.from} -> ${item.to} [${item.vendor}]`,
                detail: new Date(item.timestamp).toLocaleString(),
                item: item
            };
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: "最近翻译记录 (点击复制译文)",
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected) {
            await vscode.env.clipboard.writeText(selected.item.translatedText);
            await vscode.window.showInformationMessage("译文已复制到剪贴板");
        }
    }
}
