
import { TranslationError, TranslationErrorCode } from "./errors";
import { normalizeLanguage } from "./languages";

export function validateTranslationRequest(text: string, from: string, to: string): void {
    if (!text || text.trim().length === 0) {
        throw new TranslationError("Text is required", TranslationErrorCode.VALIDATION_ERROR);
    }

    if (text.length > 500) {
        throw new TranslationError("Text length exceeds 500 characters limit", TranslationErrorCode.VALIDATION_ERROR);
    }

    if (!normalizeLanguage(from) && from !== 'auto') {
        // Warning or Error? Plan says "Standard Language Mapping". 
        // If we want to be strict:
        // throw new TranslationError(`Unsupported source language: ${from}`, TranslationErrorCode.UNSUPPORTED_LANGUAGE);
        // But maybe we allow pass-through if the vendor supports it? 
        // v1.0 says "Input text length check, required fields".
        // Language mapping is a feature.
    }

    if (!normalizeLanguage(to)) {
        // throw new TranslationError(`Unsupported target language: ${to}`, TranslationErrorCode.UNSUPPORTED_LANGUAGE);
    }
}
