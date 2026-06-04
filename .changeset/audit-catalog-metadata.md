---
'evlog': minor
---

在 `defineAuditCatalog` 和 `defineAuditAction` 条目上添加可选的目录元数据：`description`、`severity`、`requiresChanges`、`requiresReason` 和 `redactPaths`。这些元数据会暴露在每个工厂上，用于自省、文档和审查工具。
