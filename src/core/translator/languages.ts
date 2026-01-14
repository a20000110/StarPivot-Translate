
/**
 * 支持的语言枚举
 */
export enum SupportedLanguage {
    ZH = 'zh-Hans',
    EN = 'en',
    JA = 'ja',
    KO = 'ko',
    FR = 'fr',
    DE = 'de'
}

/**
 * 语言名称映射表 (语言代码 -> 英文显示名称)
 */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    [SupportedLanguage.ZH]: 'Chinese (Simplified)',
    [SupportedLanguage.EN]: 'English',
    [SupportedLanguage.JA]: 'Japanese',
    [SupportedLanguage.KO]: 'Korean',
    [SupportedLanguage.FR]: 'French',
    [SupportedLanguage.DE]: 'German'
};

/**
 * 将语言代码标准化为内部格式
 * @param code 待标准化的语言代码
 * @returns 标准化的 SupportedLanguage 枚举值，如果不支持则返回 undefined
 */
export function normalizeLanguage(code: string): SupportedLanguage | undefined {
    // 基础标准化映射表
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
