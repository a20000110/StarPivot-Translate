import { capitalize, wordsOf } from "../shared/utils";
import { VariantItem } from "../shared/types";

/**
 * 文本格式化工具类
 * 提供各种大小写转换功能
 */
export class TextFormatter {
    /**
     * 转换为 Title Case (每个单词首字母大写，空格分隔)
     * @param input 输入字符串
     * @returns 转换后的字符串
     */
    public static toTitleCase(input: string): string {
        const ws: string[] = wordsOf(input).map((w: string): string => capitalize(w));
        return ws.join(" ");
    }

    /**
     * 转换为 kebab-case (短横线连接)
     * @param input 输入字符串
     * @param upper 是否全大写 (默认 false)
     * @returns 转换后的字符串
     */
    public static toKebabCase(input: string, upper: boolean = false): string {
        const ws: string[] = wordsOf(input).map((w: string): string => upper ? w.toUpperCase() : w.toLowerCase());
        return ws.join("-");
    }

    /**
     * 转换为 snake_case (下划线连接)
     * @param input 输入字符串
     * @param upper 是否全大写 (默认 false)
     * @returns 转换后的字符串
     */
    public static toSnakeCase(input: string, upper: boolean = false): string {
        const ws: string[] = wordsOf(input).map((w: string): string => upper ? w.toUpperCase() : w.toLowerCase());
        return ws.join("_");
    }

    /**
     * 转换为 PascalCase (大驼峰)
     * @param input 输入字符串
     * @returns 转换后的字符串
     */
    public static toPascalCase(input: string): string {
        const ws: string[] = wordsOf(input).map((w: string): string => capitalize(w));
        return ws.join("");
    }

    /**
     * 转换为 camelCase (小驼峰)
     * @param input 输入字符串
     * @returns 转换后的字符串
     */
    public static toCamelCase(input: string): string {
        const ws: string[] = wordsOf(input);
        if (ws.length === 0) return "";
        const head: string = ws[0].toLowerCase();
        const tail: string = ws.slice(1).map((w: string): string => capitalize(w)).join("");
        return head + tail;
    }

    /**
     * 构建所有格式变体的列表项
     * @param text 基础文本
     * @returns 包含各种格式变体的 VariantItem 数组
     */
    public static buildVariantItems(text: string): VariantItem[] {
        const items: VariantItem[] = [
            { label: text, description: "原文", value: text },
            { label: text.toLowerCase(), description: "小写", value: text.toLowerCase() },
            { label: text.toUpperCase(), description: "大写", value: text.toUpperCase() },
            { label: TextFormatter.toTitleCase(text), description: "首字母大写", value: TextFormatter.toTitleCase(text) },
            { label: TextFormatter.toPascalCase(text), description: "大驼峰", value: TextFormatter.toPascalCase(text) },
            { label: TextFormatter.toCamelCase(text), description: "小驼峰", value: TextFormatter.toCamelCase(text) },
            { label: TextFormatter.toKebabCase(text), description: "kebab-case", value: TextFormatter.toKebabCase(text) },
            { label: TextFormatter.toSnakeCase(text), description: "snake_case", value: TextFormatter.toSnakeCase(text) },
            { label: TextFormatter.toKebabCase(text, true), description: "大写kebab-case", value: TextFormatter.toKebabCase(text, true) },
            { label: TextFormatter.toSnakeCase(text, true), description: "大写snake_case", value: TextFormatter.toSnakeCase(text, true) },
        ];
        return items;
    }
}
