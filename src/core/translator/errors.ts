
/**
 * 翻译错误代码枚举
 */
export enum TranslationErrorCode {
    /** 验证错误 (参数无效) */
    VALIDATION_ERROR = 1001,
    /** 配额超限 */
    QUOTA_EXCEEDED = 2001,
    /** 网络超时 */
    NETWORK_TIMEOUT = 3001,
    /** 网络错误 */
    NETWORK_ERROR = 3002,
    /** 未知错误 */
    UNKNOWN_ERROR = 9999,
    /** 不支持的语言 */
    UNSUPPORTED_LANGUAGE = 1002,
    /** 供应商特定错误 */
    VENDOR_ERROR = 4001
}

/**
 * 翻译异常类
 */
export class TranslationError extends Error {
    /** 错误代码 */
    public readonly code: TranslationErrorCode;
    /** 原始错误对象 (可选) */
    public readonly originalError?: any;

    /**
     * 构造函数
     * @param message 错误消息
     * @param code 错误代码
     * @param originalError 原始错误对象
     */
    constructor(message: string, code: TranslationErrorCode, originalError?: any) {
        super(message);
        this.name = 'TranslationError';
        this.code = code;
        this.originalError = originalError;
    }
}
