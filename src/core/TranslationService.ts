
import { TranslatorFactory } from "./translator/TranslatorFactory";
import { TranslationResult, AdapterConfig } from "./translator/types";
import { TranslationCache } from "./translator/TranslationCache";

/**
 * 翻译服务核心类 (单例模式)
 * 负责协调缓存、主/备翻译器切换以及调用具体的翻译实现
 */
export class TranslationService {
    private static instance: TranslationService;
    private cache: TranslationCache;

    private constructor() {
        this.cache = TranslationCache.getInstance();
    }

    /**
     * 获取 TranslationService 单例
     * @returns TranslationService 实例
     */
    public static getInstance(): TranslationService {
        if (!TranslationService.instance) {
            TranslationService.instance = new TranslationService();
        }
        return TranslationService.instance;
    }

    /**
     * 执行翻译，包含自动切换引擎和缓存支持
     * @param text 待翻译文本
     * @param from 源语言
     * @param to 目标语言
     * @param primaryVendor 首选服务商
     * @param config 适配器配置
     * @returns 翻译结果 Promise
     */
    public async translate(
        text: string, 
        from: string, 
        to: string, 
        primaryVendor: string, 
        config: AdapterConfig
    ): Promise<TranslationResult> {
        // 1. 检查缓存
        const cached = this.cache.get(text, from, to, primaryVendor);
        if (cached) {
            return cached;
        }

        // 2. 尝试使用首选服务商翻译
        try {
            const result = await this.translateWithVendor(text, from, to, primaryVendor, config);
            this.cache.set(result);
            return result;
        } catch (error) {
            console.warn(`首选服务商 ${primaryVendor} 失败，尝试降级...`, error);
            
            // 3. 自动切换 / 降级策略
            const fallbackVendor = this.getFallbackVendor(primaryVendor);
            if (fallbackVendor && fallbackVendor !== primaryVendor) {
                 try {
                    const result = await this.translateWithVendor(text, from, to, fallbackVendor, config);
                    // 更新结果中的 vendor 字段以匹配实际使用的服务商
                    const finalResult = { ...result, vendor: fallbackVendor };
                    this.cache.set(finalResult);
                    return finalResult;
                } catch (fallbackError) {
                    console.warn(`备选服务商 ${fallbackVendor} 失败:`, fallbackError);
                    throw error; // 抛出原始错误以避免混淆，或者抛出备选错误?
                }
            }
            throw error;
        }
    }

    /**
     * 使用指定服务商执行翻译
     * @param text 文本
     * @param from 源语言
     * @param to 目标语言
     * @param vendor 服务商
     * @param config 配置
     * @returns 翻译结果
     */
    private async translateWithVendor(
        text: string, 
        from: string, 
        to: string, 
        vendor: string, 
        config: AdapterConfig
    ): Promise<TranslationResult> {
        const translator = TranslatorFactory.createTranslator(vendor, config);
        return await translator.translate(text, from, to);
    }

    /**
     * 获取备选服务商
     * @param current 当前服务商
     * @returns 备选服务商标识或 null
     */
    private getFallbackVendor(current: string): string | null {
        // 目前简单的在 microsoft 和 ali 之间切换
        if (current === 'microsoft') return 'ali';
        if (current === 'ali') return 'microsoft';
        return null;
    }
}
