export const LANGUAGES = {
    ZH_HANS: "zh-Hans",
    EN: "en",
    JA: "ja",
    KO: "ko",
    FR: "fr",
    DE: "de"
} as const;

export type LanguageCode = typeof LANGUAGES[keyof typeof LANGUAGES];
