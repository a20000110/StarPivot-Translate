
import { TranslationResult } from "./types";
import * as crypto from 'crypto';

interface CacheEntry {
    result: TranslationResult;
    expiresAt: number;
}

/**
 * 翻译缓存服务 (单例模式)
 * 用于存储和检索翻译结果，减少重复 API 调用
 */
export class TranslationCache {
    private static instance: TranslationCache;
    private cache: Map<string, CacheEntry> = new Map();
    private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24小时

    private constructor() { }

    /**
     * 获取 TranslationCache 单例
     * @returns TranslationCache 实例
     */
    public static getInstance(): TranslationCache {
        if (!TranslationCache.instance) {
            TranslationCache.instance = new TranslationCache();
        }
        return TranslationCache.instance;
    }

    /**
     * 从缓存中获取翻译结果
     * @param text 原始文本
     * @param from 源语言
     * @param to 目标语言
     * @param vendor 服务商
     * @returns 缓存的翻译结果，如果未找到或已过期则返回 null
     */
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

    /**
     * 将翻译结果存入缓存
     * @param result 翻译结果对象
     */
    public set(result: TranslationResult): void {
        const key = this.generateKey(result.originalText, result.from, result.to, result.vendor);
        this.cache.set(key, {
            result,
            expiresAt: Date.now() + this.DEFAULT_TTL
        });
    }

    /**
     * 生成缓存键 (MD5)
     * @param text 文本
     * @param from 源语言
     * @param to 目标语言
     * @param vendor 服务商
     * @returns 唯一的缓存键字符串 (MD5 hash)
     */
    private generateKey(text: string, from: string, to: string, vendor: string): string {
        const rawKey = `${vendor}:${from}:${to}:${text}`;
        return crypto.createHash('md5').update(rawKey).digest('hex');
    }

    /**
     * 清空所有缓存
     */
    public clear(): void {
        this.cache.clear();
    }
}
