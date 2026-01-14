/**
 * 提取字符串中的所有单词
 * @param input 输入字符串
 * @returns 单词数组
 */
export function wordsOf(input: string): string[] {
    const matches: RegExpMatchArray | null = input.trim().match(/[A-Za-z0-9]+/g);
    return (matches ?? []).map((w: string): string => w);
}

/**
 * 将单词首字母大写
 * @param word 输入单词
 * @returns 首字母大写的单词
 */
export function capitalize(word: string): string {
    if (word.length === 0) return word;
    const head: string = word.charAt(0).toUpperCase();
    const tail: string = word.slice(1).toLowerCase();
    return head + tail;
}

/**
 * 检查字符串是否包含中文字符
 * @param input 输入字符串
 * @returns 如果包含中文返回 true，否则返回 false
 */
export function containsChinese(input: string): boolean {
    const re: RegExp = /[\u4E00-\u9FFF]/;
    return re.test(input);
}

/**
 * 检查字符串是否包含拉丁字母 (A-Z, a-z)
 * @param input 输入字符串
 * @returns 如果包含拉丁字母返回 true，否则返回 false
 */
export function containsLatinLetters(input: string): boolean {
    const re: RegExp = /[A-Za-z]/;
    return re.test(input);
}
