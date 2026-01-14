
import { BaseAdapter } from "./BaseAdapter";
import { ITranslator, TranslationResult } from "../types";
import { TranslationError, TranslationErrorCode } from "../errors";
import { validateTranslationRequest } from "../validation";

interface MicrosoftTranslateResponse {
    // Define based on doc if known, otherwise any.
    // Doc says 200 OK, return data model Inline.
    // Usually it returns the translated text or an object.
    // The existing TranslationApi.ts had { data: string[], code: number, msg: string }
    // Assuming the aggregator returns unified response structure or specific?
    // Doc: "200 Response ... Inline".
    // Existing code: TranslateResponse { data: string[], code: number, msg: string }
    // I will assume the server returns a consistent wrapper if it's the same gateway.
    data: string[];
    code: number;
    msg: string;
}

export class MicrosoftAdapter extends BaseAdapter implements ITranslator {
    constructor(private baseUrl: string) {
        super();
    }

    async translate(text: string, from: string, to: string): Promise<TranslationResult> {
        validateTranslationRequest(text, from, to);

        // Remove trailing slash if present
        const cleanBaseUrl = this.baseUrl.replace(/\/$/, "");

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
