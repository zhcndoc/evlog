---
'evlog': 补丁
---

修复 `mockAudit()`，使其在 emit 时捕获请求内的 `log.audit()` 事件（使用已最终确定的 `idempotencyKey`）。在 mock 结果上新增 `assertAudit()` 匹配器。通过新的 `AuditChanges` 导出为 `AuditFields.changes.patch` 添加类型。
