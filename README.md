# StarPivot Translate

StarPivot Translate 是一个 VS Code 扩展，专注于为开发者提供高效的**选词翻译**与**变量命名风格转换**功能。它能够自动识别中英文，并在翻译后提供多种编程常用的命名格式（如驼峰、下划线等），极大提升编码效率。

## ✨ 主要特性

*   **智能语言检测**：
    *   选中中文 → 自动翻译为英文。
    *   选中英文（拉丁字母）→ 自动翻译为中文。
*   **多格式输出**（变量命名神器）：
    *   当翻译结果为英文时，自动生成多种代码风格供选择：
        *   `camelCase` (小驼峰)
        *   `PascalCase` (大驼峰)
        *   `snake_case` (下划线)
        *   `kebab-case` (短横线)
        *   `UPPER_CASE` (全大写)
        *   以及更多...
*   **快捷键触发**：默认绑定 `Shift + Alt + T`，快速唤起。
*   **自定义接口**：支持配置私有翻译 API 服务。

## 🚀 使用方法

1.  在编辑器中选中一段文本（例如：`用户登录` 或 `user login`）。
2.  按下快捷键 `Shift + Alt + T`（或在命令面板执行 `翻译选区`）。
3.  **中文转英文时**：顶部弹窗会显示翻译结果的多种格式列表。
    *   使用上下键选择你需要的格式（例如作为变量名需用小驼峰）。
    *   回车确认，原文将被替换。
4.  **英文转中文时**：直接显示中文翻译结果，回车替换。

## ⚙️ 配置说明

在 VS Code 设置 (`settings.json`) 中可配置以下选项：

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `starPivotTranslate.apiUrl` | `string` | `""` | **(必须)** 翻译服务的 API 接口地址。 |
| `starPivotTranslate.sourceLanguage` | `string` | `"zh-Hans"` | 默认源语言（当自动检测失效时使用）。 |
| `starPivotTranslate.targetLanguage` | `string` | `"en"` | 默认目标语言（当自动检测失效时使用）。 |
| `starPivotTranslate.replaceSelection` | `boolean` | `false` | (备用) 是否直接替换选区。 |

### API 接口规范

本插件需要配合后端翻译服务使用。如果您配置了自己的 `apiUrl`，请确保接口满足以下规范：

**请求 (POST):**

```json
{
  "translate_language": "en", // 目标语言
  "text": ["需要翻译的内容"],   // 文本数组
  "from": "zh-Hans"           // 源语言
}
```

**响应:**

```json
{
  "code": 200,
  "data": ["Translated Content"],
  "msg": "success"
}
```

## ⌨️ 快捷键

*   `Shift + Alt + T`: 触发翻译选区命令。

## 📦 安装与开发

1.  克隆仓库：
    ```bash
    git clone <repository-url>
    ```
2.  安装依赖：
    ```bash
    pnpm install
    ```
3.  编译运行：
    *   按 `F5` 启动 VS Code 调试窗口。

## 📄 License

MIT
