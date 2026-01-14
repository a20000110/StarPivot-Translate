
import { TranslationError } from "./errors";

export interface TranslationResult {
    originalText: string;
    translatedText: string;
    from: string;
    to: string;
    vendor: string;
}

export interface ITranslator {
    /**
     * Translate text from source language to target language
     * @param text The text to translate
     * @param from Source language code
     * @param to Target language code
     * @returns Promise resolving to TranslationResult
     * @throws TranslationError
     */
    translate(text: string, from: string, to: string): Promise<TranslationResult>;
}

export interface AdapterConfig {
    apiUrl: string;
    apiKey?: string;
    customApiKey?: string;
    timeout?: number;
    maxRetries?: number;
    qps?: number;
}
