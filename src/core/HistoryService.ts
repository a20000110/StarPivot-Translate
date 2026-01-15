
import * as vscode from "vscode";
import { TranslationResult } from "@/core/translator/types";

export interface HistoryItem extends TranslationResult {
    /** 时间戳 */
    timestamp: number;
}

/**
 * 历史记录服务
 * 管理翻译历史记录的存储和检索
 */
export class HistoryService {
    private static readonly STORAGE_KEY = "starPivotTranslate.history";
    private static readonly MAX_ITEMS = 50;
    private static instance: HistoryService;
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * 初始化历史服务
     * @param context 扩展上下文
     */
    public static initialize(context: vscode.ExtensionContext): void {
        if (!HistoryService.instance) {
            HistoryService.instance = new HistoryService(context);
        }
    }

    /**
     * 获取历史服务单例
     * @returns HistoryService 实例
     * @throws 当服务未初始化时抛出错误
     */
    public static getInstance(): HistoryService {
        if (!HistoryService.instance) {
            throw new Error("HistoryService 尚未初始化，请先调用 initialize()。");
        }
        return HistoryService.instance;
    }

    /**
     * 获取所有历史记录
     * @returns 历史记录数组
     */
    public getHistory(): HistoryItem[] {
        return this.context.globalState.get<HistoryItem[]>(HistoryService.STORAGE_KEY, []);
    }

    /**
     * 添加一条历史记录
     * @param result 翻译结果
     */
    public async add(result: TranslationResult): Promise<void> {
        const item: HistoryItem = {
            ...result,
            timestamp: Date.now()
        };

        let history = this.getHistory();
        
        // 添加到开头
        history.unshift(item);

        // 裁剪到最大条目数
        if (history.length > HistoryService.MAX_ITEMS) {
            history = history.slice(0, HistoryService.MAX_ITEMS);
        }

        await this.context.globalState.update(HistoryService.STORAGE_KEY, history);
    }

    /**
     * 清空历史记录
     */
    public async clear(): Promise<void> {
        await this.context.globalState.update(HistoryService.STORAGE_KEY, []);
    }
}
