
export enum TranslationErrorCode {
    VALIDATION_ERROR = 1001,
    QUOTA_EXCEEDED = 2001,
    NETWORK_TIMEOUT = 3001,
    NETWORK_ERROR = 3002,
    UNKNOWN_ERROR = 9999,
    UNSUPPORTED_LANGUAGE = 1002,
    VENDOR_ERROR = 4001
}

export class TranslationError extends Error {
    public readonly code: TranslationErrorCode;
    public readonly originalError?: any;

    constructor(message: string, code: TranslationErrorCode, originalError?: any) {
        super(message);
        this.name = 'TranslationError';
        this.code = code;
        this.originalError = originalError;
    }
}
