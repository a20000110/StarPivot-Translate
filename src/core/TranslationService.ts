
import { TranslatorFactory } from "./translator/TranslatorFactory";
import { TranslationResult, AdapterConfig } from "./translator/types";
import { TranslationCache } from "./translator/TranslationCache";

export class TranslationService {
    private static instance: TranslationService;
    private cache: TranslationCache;

    private constructor() {
        this.cache = TranslationCache.getInstance();
    }

    public static getInstance(): TranslationService {
        if (!TranslationService.instance) {
            TranslationService.instance = new TranslationService();
        }
        return TranslationService.instance;
    }

    /**
     * Translate text with auto-switch and cache support
     */
    public async translate(
        text: string, 
        from: string, 
        to: string, 
        primaryVendor: string, 
        config: AdapterConfig
    ): Promise<TranslationResult> {
        // 1. Check Cache
        const cached = this.cache.get(text, from, to, primaryVendor);
        if (cached) {
            return cached;
        }

        // 2. Try Primary Vendor
        try {
            const result = await this.translateWithVendor(text, from, to, primaryVendor, config);
            this.cache.set(result);
            return result;
        } catch (error) {
            console.warn(`Primary vendor ${primaryVendor} failed, trying fallback...`, error);
            
            // 3. Auto-switch / Fallback
            const fallbackVendor = this.getFallbackVendor(primaryVendor);
            if (fallbackVendor && fallbackVendor !== primaryVendor) {
                 try {
                    const result = await this.translateWithVendor(text, from, to, fallbackVendor, config);
                    // Update vendor in result to match actual vendor used
                    const finalResult = { ...result, vendor: fallbackVendor };
                    this.cache.set(finalResult);
                    return finalResult;
                } catch (fallbackError) {
                    console.warn(`Fallback vendor ${fallbackVendor} failed:`, fallbackError);
                    throw error; // Throw the original error from primary to avoid confusion, or throw fallback error?
                }
            }
            throw error;
        }
    }

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

    private getFallbackVendor(current: string): string | null {
        // Simple toggle between microsoft and ali for now
        if (current === 'microsoft') return 'ali';
        if (current === 'ali') return 'microsoft';
        return null;
    }
}
