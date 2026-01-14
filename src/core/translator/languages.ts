
export enum SupportedLanguage {
    ZH = 'zh-Hans',
    EN = 'en',
    JA = 'ja',
    KO = 'ko',
    FR = 'fr',
    DE = 'de'
}

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    [SupportedLanguage.ZH]: 'Chinese (Simplified)',
    [SupportedLanguage.EN]: 'English',
    [SupportedLanguage.JA]: 'Japanese',
    [SupportedLanguage.KO]: 'Korean',
    [SupportedLanguage.FR]: 'French',
    [SupportedLanguage.DE]: 'German'
};

/**
 * Standardize language code to internal format
 * @param code The language code to normalize
 * @returns SupportedLanguage or undefined if not supported
 */
export function normalizeLanguage(code: string): SupportedLanguage | undefined {
    // Basic normalization map
    const map: Record<string, SupportedLanguage> = {
        'zh': SupportedLanguage.ZH,
        'zh-CN': SupportedLanguage.ZH,
        'zh-Hans': SupportedLanguage.ZH,
        'cn': SupportedLanguage.ZH,
        'en': SupportedLanguage.EN,
        'en-US': SupportedLanguage.EN,
        'ja': SupportedLanguage.JA,
        'jp': SupportedLanguage.JA,
        'ko': SupportedLanguage.KO,
        'kr': SupportedLanguage.KO,
        'fr': SupportedLanguage.FR,
        'de': SupportedLanguage.DE
    };
    
    return map[code] || (Object.values(SupportedLanguage).includes(code as SupportedLanguage) ? code as SupportedLanguage : undefined);
}
