
import { ITranslator, AdapterConfig } from "./types";
import { MicrosoftAdapter } from "./adapters/MicrosoftAdapter";
import { AliAdapter } from "./adapters/AliAdapter";
import { TranslationError, TranslationErrorCode } from "./errors";

export type VendorType = 'microsoft' | 'ali' | 'youdao' | 'tencent' | 'sogou' | 'iciba';

export class TranslatorFactory {
    /**
     * 根据服务商类型创建翻译器实例
     * @param vendor 服务商标识
     * @param config 适配器配置
     * @returns 翻译器实例 (ITranslator)
     * @throws {TranslationError} 当服务商不支持时抛出
     */
    public static createTranslator(vendor: string, config: AdapterConfig): ITranslator {
        switch (vendor.toLowerCase()) {
            case 'microsoft':
                return new MicrosoftAdapter(config);
            case 'ali':
                return new AliAdapter(config);
            // 随着适配器的实现添加其他 case
            default:
                throw new TranslationError(`不支持的服务商: ${vendor}`, TranslationErrorCode.VALIDATION_ERROR);
        }
    }
}
