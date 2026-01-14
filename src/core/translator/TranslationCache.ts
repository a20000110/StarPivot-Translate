
import { TranslationResult } from "./types";

interface CacheEntry {
    result: TranslationResult;
    expiresAt: number;
}

export class TranslationCache {
    private static instance: TranslationCache;
    private cache: Map<string, CacheEntry> = new Map();
    private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

    private constructor() {}

    public static getInstance(): TranslationCache {
        if (!TranslationCache.instance) {
            TranslationCache.instance = new TranslationCache();
        }
        return TranslationCache.instance;
    }

    public get(text: string, from: string, to: string, vendor: string): TranslationResult | null {
        const key = this.generateKey(text, from, to, vendor);
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.result;
    }

    public set(result: TranslationResult): void {
        const key = this.generateKey(result.originalText, result.from, result.to, result.vendor);
        this.cache.set(key, {
            result,
            expiresAt: Date.now() + this.DEFAULT_TTL
        });
    }

    private generateKey(text: string, from: string, to: string, vendor: string): string {
        return `${vendor}:${from}:${to}:${text}`;
    }
    
    public clear(): void {
        this.cache.clear();
    }
}
