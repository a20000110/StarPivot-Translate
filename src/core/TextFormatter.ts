import { capitalize, wordsOf } from "../shared/utils";
import { VariantItem } from "../shared/types";

export class TextFormatter {
    public static toTitleCase(input: string): string {
        const ws: string[] = wordsOf(input).map((w: string): string => capitalize(w));
        return ws.join(" ");
    }

    public static toKebabCase(input: string, upper: boolean = false): string {
        const ws: string[] = wordsOf(input).map((w: string): string => upper ? w.toUpperCase() : w.toLowerCase());
        return ws.join("-");
    }

    public static toSnakeCase(input: string, upper: boolean = false): string {
        const ws: string[] = wordsOf(input).map((w: string): string => upper ? w.toUpperCase() : w.toLowerCase());
        return ws.join("_");
    }

    public static toPascalCase(input: string): string {
        const ws: string[] = wordsOf(input).map((w: string): string => capitalize(w));
        return ws.join("");
    }

    public static toCamelCase(input: string): string {
        const ws: string[] = wordsOf(input);
        if (ws.length === 0) return "";
        const head: string = ws[0].toLowerCase();
        const tail: string = ws.slice(1).map((w: string): string => capitalize(w)).join("");
        return head + tail;
    }

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
