
import { BaseAdapter } from "@/core/translator/adapters/BaseAdapter";
import { ITranslator, TranslationResult, AdapterConfig } from "@/core/translator/types";
import { TranslationError, TranslationErrorCode } from "@/core/translator/errors";
import { validateTranslationRequest } from "@/core/translator/validation";

interface MicrosoftTranslateResponse {
    data: string[];
    code: number;
    msg: string;
}

/**
 * 微软翻译适配器
 */
export class MicrosoftAdapter extends BaseAdapter implements ITranslator {
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

        // 如果存在尾部斜杠则移除
        const cleanBaseUrl = this.config.apiUrl.replace(/\/$/, "");

        // 处理用户提供完整 URL 而非基础 URL 的情况
        const endpoint = "/translate-api/translate";
        const url = cleanBaseUrl.endsWith(endpoint) ? cleanBaseUrl : `${cleanBaseUrl}${endpoint}`;

        const body = {
            translate_language: to,
            text: [text],
            from: from
        };

        try {
            const response = await this.post<MicrosoftTranslateResponse>(url, body);

            if (response.code !== 200) {
                throw new TranslationError(
                    response.msg || "供应商错误",
                    TranslationErrorCode.VENDOR_ERROR
                );
            }

            if (!response.data || response.data.length === 0) {
                throw new TranslationError(
                    "翻译结果为空",
                    TranslationErrorCode.VENDOR_ERROR
                );
            }

            return {
                originalText: text,
                translatedText: response.data[0],
                from,
                to,
                vendor: 'microsoft'
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
