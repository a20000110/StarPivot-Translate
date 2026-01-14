# Change Log

All notable changes to the "StarPivot Translate" extension will be documented in this file.

## [1.0.0] - 2026-01-14

### Added
- **多厂商支持**: 新增 `starPivotTranslate.vendor` 配置项，支持切换翻译服务商。
  - 支持 `microsoft` (默认)
  - 支持 `ali` (阿里翻译)
- **参数校验**: 新增对翻译文本长度（最大 500 字符）及必填项的校验，防止无效请求。
- **错误处理**: 实现了统一的错误处理机制，针对网络超时、配额耗尽等情况提供更友好的错误提示。

### Changed
- **核心重构**: 重写了翻译核心逻辑，采用工厂模式与适配器模式，提升扩展性与稳定性。
- **配置更新**: `apiUrl` 配置项现在作为适配器的基础 URL 使用。

### Fixed
- 修复了网络请求在某些情况下无法正确解析错误响应的问题。
