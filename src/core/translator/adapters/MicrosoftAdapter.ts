
import { BaseAdapter } from "./BaseAdapter";
import { ITranslator, TranslationResult, AdapterConfig } from "../types";
import { TranslationError, TranslationErrorCode } from "../errors";
import { validateTranslationRequest } from "../validation";

interface MicrosoftTranslateResponse {
    data: string[];
    code: number;
    msg: string;
}

export class MicrosoftAdapter extends BaseAdapter implements ITranslator {
    constructor(config: AdapterConfig) {
        super(config);
    }

    async translate(text: string, from: string, to: string): Promise<TranslationResult> {
        validateTranslationRequest(text, from, to);

        // Remove trailing slash if present
        const cleanBaseUrl = this.config.apiUrl.replace(/\/$/, "");

        // Handle case where user provided full URL instead of base URL
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
                    response.msg || "Vendor error",
                    TranslationErrorCode.VENDOR_ERROR
                );
            }

            if (!response.data || response.data.length === 0) {
                throw new TranslationError(
                    "Empty translation result",
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
                "Translation failed",
                TranslationErrorCode.UNKNOWN_ERROR,
                error
            );
        }
    }
}
