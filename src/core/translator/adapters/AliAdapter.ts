
import { BaseAdapter } from "./BaseAdapter";
import { ITranslator, TranslationResult } from "../types";
import { TranslationError, TranslationErrorCode } from "../errors";
import { validateTranslationRequest } from "../validation";

interface AliTranslateResponse {
    // Based on existing code logic, likely same wrapper { data: string[], ... } or just string?
    // Doc says: 
    // POST /api/ali_translate
    // Body: text: string
    // Response: 200 OK Inline.
    // If the gateway is unified, it likely returns { data: string[], code: number } for all?
    // Or maybe specific structure.
    // Looking at "TranslationApi.ts", it expects { data: string[] }.
    // I will assume the gateway normalizes responses to { data: string[] } even for single text inputs.
    // If not, I might need to adjust.
    data: string[];
    code: number;
    msg: string;
}

export class AliAdapter extends BaseAdapter implements ITranslator {
    constructor(private baseUrl: string) {
        super();
    }

    async translate(text: string, from: string, to: string): Promise<TranslationResult> {
        validateTranslationRequest(text, from, to);
        const cleanBaseUrl = this.baseUrl.replace(/\/$/, "");

        // Handle case where user provided full URL instead of base URL
        const endpoint = "/api/ali_translate";
        const url = cleanBaseUrl.endsWith(endpoint) ? cleanBaseUrl : `${cleanBaseUrl}${endpoint}`;

        const body = {
            translate_language: to,
            text: text, // Ali takes string, not array
            from: from
        };

        try {
            const response = await this.post<AliTranslateResponse>(url, body);

            if (response.code !== 200) {
                throw new TranslationError(
                    response.msg || "Vendor error",
                    TranslationErrorCode.VENDOR_ERROR
                );
            }

            // Assuming response.data is array even for single text, or string?
            // Existing code handled array.
            const result = Array.isArray(response.data) ? response.data[0] : response.data;

            if (!result) {
                throw new TranslationError(
                    "Empty translation result",
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
                "Translation failed",
                TranslationErrorCode.UNKNOWN_ERROR,
                error
            );
        }
    }
}
