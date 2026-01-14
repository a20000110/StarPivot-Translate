import { containsChinese, containsLatinLetters } from "../shared/utils";
import { LanguagePair } from "../shared/types";
import { LANGUAGES } from "./constants";

export class LanguageDetector {
    public static decideLanguages(input: string, fallbackSource: string, fallbackTarget: string): LanguagePair {
        if (containsChinese(input)) {
            return { from: LANGUAGES.ZH_HANS, to: LANGUAGES.EN };
        }
        if (containsLatinLetters(input)) {
            return { from: LANGUAGES.EN, to: LANGUAGES.ZH_HANS };
        }
        return { from: fallbackSource, to: fallbackTarget };
    }
}
