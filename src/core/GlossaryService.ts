
export class GlossaryService {
    /**
     * Apply glossary replacements to text
     * @param text The text to process
     * @param glossary Key-Value pairs for replacement
     * @returns Processed text
     */
    public static postProcess(text: string, glossary: Record<string, string>): string {
        if (!glossary || Object.keys(glossary).length === 0) {
            return text;
        }

        let result = text;
        // Simple find-replace. For more advanced, we might need regex escaping.
        // We iterate over keys and replace all occurrences.
        for (const [key, value] of Object.entries(glossary)) {
            // Escape special regex characters in key
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedKey, 'g');
            result = result.replace(regex, value);
        }
        return result;
    }
}
