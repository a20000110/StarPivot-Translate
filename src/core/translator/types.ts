
import { TranslationError } from "@/core/translator/errors";

/**
 * 翻译结果接口
 */
export interface TranslationResult {
    /** 原始文本 */
    originalText: string;
    /** 翻译后文本 */
    translatedText: string;
    /** 源语言代码 */
    from: string;
    /** 目标语言代码 */
    to: string;
    /** 服务提供商标识 */
    vendor: string;
}

/**
 * 翻译器接口
 * 定义了所有翻译适配器必须实现的方法
 */
export interface ITranslator {
    /**
     * 将文本从源语言翻译为目标语言
     * @param text 待翻译的文本
     * @param from 源语言代码
     * @param to 目标语言代码
     * @returns 返回包含翻译结果的 Promise
     * @throws {TranslationError} 当翻译过程中发生错误时抛出
     */
    translate(text: string, from: string, to: string): Promise<TranslationResult>;
}

/**
 * 适配器配置接口
 */
export interface AdapterConfig {
    /** 接口地址 */
    apiUrl: string;
    /** API 密钥 */
    apiKey?: string;
    /** 自定义 API Key (通过 Header 传递) */
    customApiKey?: string;
    /** 超时时间 (毫秒) */
    timeout?: number;
    /** 最大重试次数 */
    maxRetries?: number;
    /** 每秒查询限制 (QPS) */
    qps?: number;
}
