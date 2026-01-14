
import * as vscode from "vscode";
import { TranslationResult } from "./translator/types";

export interface HistoryItem extends TranslationResult {
    timestamp: number;
}

export class HistoryService {
    private static readonly STORAGE_KEY = "starPivotTranslate.history";
    private static readonly MAX_ITEMS = 50;
    private static instance: HistoryService;
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static initialize(context: vscode.ExtensionContext): void {
        if (!HistoryService.instance) {
            HistoryService.instance = new HistoryService(context);
        }
    }

    public static getInstance(): HistoryService {
        if (!HistoryService.instance) {
            throw new Error("HistoryService not initialized. Call initialize() first.");
        }
        return HistoryService.instance;
    }

    public getHistory(): HistoryItem[] {
        return this.context.globalState.get<HistoryItem[]>(HistoryService.STORAGE_KEY, []);
    }

    public async add(result: TranslationResult): Promise<void> {
        const item: HistoryItem = {
            ...result,
            timestamp: Date.now()
        };

        let history = this.getHistory();
        
        // Add to beginning
        history.unshift(item);

        // Trim to max items
        if (history.length > HistoryService.MAX_ITEMS) {
            history = history.slice(0, HistoryService.MAX_ITEMS);
        }

        await this.context.globalState.update(HistoryService.STORAGE_KEY, history);
    }

    public async clear(): Promise<void> {
        await this.context.globalState.update(HistoryService.STORAGE_KEY, []);
    }
}
