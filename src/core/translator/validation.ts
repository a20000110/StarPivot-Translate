
import { TranslationError, TranslationErrorCode } from "@/core/translator/errors";
import { normalizeLanguage } from "@/core/translator/languages";

/**
 * 验证翻译请求参数
 * @param text 待翻译文本
 * @param from 源语言
 * @param to 目标语言
 * @throws {TranslationError} 当参数无效时抛出
 */
export function validateTranslationRequest(text: string, from: string, to: string): void {
    if (!text || text.trim().length === 0) {
        throw new TranslationError("文本不能为空", TranslationErrorCode.VALIDATION_ERROR);
    }

    if (text.length > 500) {
        throw new TranslationError("文本长度超过500字符限制", TranslationErrorCode.VALIDATION_ERROR);
    }

    if (!normalizeLanguage(from) && from !== 'auto') {
        // 警告或错误? 计划中提到 "标准语言映射"。
        // 如果我们想严格限制:
        // throw new TranslationError(`不支持的源语言: ${from}`, TranslationErrorCode.UNSUPPORTED_LANGUAGE);
        // 但也许我们允许透传，如果供应商支持的话?
        // v1.0 说 "输入文本长度检查，必填字段"。
        // 语言映射是一个功能。
    }

    if (!normalizeLanguage(to)) {
        // throw new TranslationError(`不支持的目标语言: ${to}`, TranslationErrorCode.UNSUPPORTED_LANGUAGE);
    }
}
