
export class GlossaryService {
    /**
     * 应用术语表替换到文本
     * @param text 待处理的文本
     * @param glossary 用于替换的键值对术语表
     * @returns 处理后的文本
     */
    public static postProcess(text: string, glossary: Record<string, string>): string {
        if (!glossary || Object.keys(glossary).length === 0) {
            return text;
        }

        let result = text;
        // 简单的查找替换。对于更高级的需求，我们可能需要正则转义。
        // 我们遍历键并替换所有出现的地方。
        for (const [key, value] of Object.entries(glossary)) {
            // 转义键中的特殊正则字符
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedKey, 'g');
            result = result.replace(regex, value);
        }
        return result;
    }
}
