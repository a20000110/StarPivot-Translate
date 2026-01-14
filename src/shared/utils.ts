export function wordsOf(input: string): string[] {
    const matches: RegExpMatchArray | null = input.trim().match(/[A-Za-z0-9]+/g);
    return (matches ?? []).map((w: string): string => w);
}

export function capitalize(word: string): string {
    if (word.length === 0) return word;
    const head: string = word.charAt(0).toUpperCase();
    const tail: string = word.slice(1).toLowerCase();
    return head + tail;
}

export function containsChinese(input: string): boolean {
    const re: RegExp = /[\u4E00-\u9FFF]/;
    return re.test(input);
}

export function containsLatinLetters(input: string): boolean {
    const re: RegExp = /[A-Za-z]/;
    return re.test(input);
}
