import * as vscode from "vscode";

export interface TranslateRequest {
    translate_language: string;
    text: string[];
    from: string;
}

export interface TranslateResponse {
    data: string[];
    code: number;
    msg: string;
}

export interface VariantItem {
    label: string;
    description: string;
    value: string;
}

export type PickItem = vscode.QuickPickItem & { value: string };

export interface LanguagePair {
    from: string;
    to: string;
}
