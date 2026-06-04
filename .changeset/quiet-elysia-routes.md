---
'evlog': patch
---

修复 `evlog/elysia`，使其能够捕获未匹配的路由，从而让 Elysia 的 404 响应以正确的路径和错误级别发出 HTTP 事件。
