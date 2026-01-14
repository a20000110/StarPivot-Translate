import * as vscode from "vscode";

/**
 * 翻译请求数据结构
 */
export interface TranslateRequest {
    /** 目标语言 */
    translate_language: string;
    /** 待翻译文本数组 */
    text: string[];
    /** 源语言 */
    from: string;
}

/**
 * 翻译响应数据结构
 */
export interface TranslateResponse {
    /** 翻译结果数组 */
    data: string[];
    /** 响应代码 */
    code: number;
    /** 响应消息 */
    msg: string;
}

/**
 * 格式变体项
 * 用于展示不同大小写格式的翻译结果
 */
export interface VariantItem {
    /** 显示标签 */
    label: string;
    /** 描述信息 */
    description: string;
    /** 实际值 */
    value: string;
}

/**
 * 扩展的 QuickPickItem
 * 包含实际的值
 */
export type PickItem = vscode.QuickPickItem & { value: string };

/**
 * 语言对
 */
export interface LanguagePair {
    /** 源语言代码 */
    from: string;
    /** 目标语言代码 */
    to: string;
}
