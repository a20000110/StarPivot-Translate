
import { ITranslator, AdapterConfig } from "./types";
import { MicrosoftAdapter } from "./adapters/MicrosoftAdapter";
import { AliAdapter } from "./adapters/AliAdapter";
import { TranslationError, TranslationErrorCode } from "./errors";

export type VendorType = 'microsoft' | 'ali' | 'youdao' | 'tencent' | 'sogou' | 'iciba';

export class TranslatorFactory {
    /**
     * Create a translator instance based on vendor type
     * @param vendor The vendor identifier
     * @param config Configuration for the adapter
     * @returns ITranslator instance
     */
    public static createTranslator(vendor: string, config: AdapterConfig): ITranslator {
        switch (vendor.toLowerCase()) {
            case 'microsoft':
                return new MicrosoftAdapter(config);
            case 'ali':
                return new AliAdapter(config);
            // Add other cases as adapters are implemented
            default:
                throw new TranslationError(`Unsupported vendor: ${vendor}`, TranslationErrorCode.VALIDATION_ERROR);
        }
    }
}
