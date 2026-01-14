
import { BaseAdapter } from "./BaseAdapter";
import { ITranslator, TranslationResult, AdapterConfig } from "../types";
import { TranslationError, TranslationErrorCode } from "../errors";
import { validateTranslationRequest } from "../validation";

interface AliTranslateResponse {
    data: string[];
    code: number;
    msg: string;
}

/**
 * 阿里翻译适配器
 */
export class AliAdapter extends BaseAdapter implements ITranslator {
    constructor(config: AdapterConfig) {
        super(config);
    }

    /**
     * 执行翻译
     * @param text 待翻译文本
     * @param from 源语言
     * @param to 目标语言
     * @returns 翻译结果
     */
    async translate(text: string, from: string, to: string): Promise<TranslationResult> {
        validateTranslationRequest(text, from, to);
        const cleanBaseUrl = this.config.apiUrl.replace(/\/$/, "");

        // 处理用户提供完整 URL 而非基础 URL 的情况
        const endpoint = "/api/ali_translate";
        const url = cleanBaseUrl.endsWith(endpoint) ? cleanBaseUrl : `${cleanBaseUrl}${endpoint}`;

        const body = {
            translate_language: to,
            text: text, // 阿里接口接收字符串，不是数组
            from: from
        };

        try {
            const response = await this.post<AliTranslateResponse>(url, body);

            if (response.code !== 200) {
                throw new TranslationError(
                    response.msg || "供应商错误",
                    TranslationErrorCode.VENDOR_ERROR
                );
            }

            // 假设 response.data 即使是单条文本也是数组，或者是字符串?
            // 现有代码处理了数组的情况。
            const result = Array.isArray(response.data) ? response.data[0] : response.data;

            if (!result) {
                throw new TranslationError(
                    "翻译结果为空",
                    TranslationErrorCode.VENDOR_ERROR
                );
            }

            return {
                originalText: text,
                translatedText: result as string,
                from,
                to,
                vendor: 'ali'
            };
        } catch (error) {
            if (error instanceof TranslationError) {
                throw error;
            }
            throw new TranslationError(
                "翻译失败",
                TranslationErrorCode.UNKNOWN_ERROR,
                error
            );
        }
    }
}
