import { containsChinese, containsLatinLetters } from "../shared/utils";
import { LanguagePair } from "../shared/types";
import { LANGUAGES } from "./constants";

/**
 * 语言检测器
 * 基于简单的字符集判断源语言和目标语言
 */
export class LanguageDetector {
    /**
     * 决定翻译方向 (源语言和目标语言)
     * @param input 输入文本
     * @param fallbackSource 默认源语言
     * @param fallbackTarget 默认目标语言
     * @returns 确定的语言对 (from, to)
     */
    public static decideLanguages(input: string, fallbackSource: string, fallbackTarget: string): LanguagePair {
        if (containsChinese(input)) {
            // 如果包含中文，则默认翻译为英文
            return { from: LANGUAGES.ZH_HANS, to: LANGUAGES.EN };
        }
        if (containsLatinLetters(input)) {
            // 如果包含拉丁字母 (英文等)，则默认翻译为中文
            return { from: LANGUAGES.EN, to: LANGUAGES.ZH_HANS };
        }
        // 无法判定时使用默认配置
        return { from: fallbackSource, to: fallbackTarget };
    }
}
