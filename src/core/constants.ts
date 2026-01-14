/**
 * 支持的语言代码常量
 */
export const LANGUAGES = {
    ZH_HANS: "zh-Hans",
    EN: "en",
    JA: "ja",
    KO: "ko",
    FR: "fr",
    DE: "de"
} as const;

/**
 * 语言代码类型定义
 */
export type LanguageCode = typeof LANGUAGES[keyof typeof LANGUAGES];
