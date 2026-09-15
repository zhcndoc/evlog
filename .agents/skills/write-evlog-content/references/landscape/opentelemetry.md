# OpenTelemetry

已检查：2026-09-08 · 来源：https://opentelemetry.io/docs/

它不是竞争对手，而将其视为竞争对手的页面会失去运行 Collector 的读者。evlog 提供 OTLP drain，因此真正的关系是“evlog 使用这一标准”。

## 它的作用

- 三种信号：链路、指标、日志。一个 span 包含名称、持续时间、状态和属性。
- 语义约定会将 `http.request.method`、`server.address` 和 `error.type` 等共享属性标准化。自定义应用属性同样有效。查询支持取决于后端。
- SDK 负责为运行时添加检测；Collector 负责接收、处理和导出。OTLP 是线协议，可通过 gRPC 或 HTTP 传输。
- 链路采样可以在 SDK 中基于头部进行，也可以在 Collector 中基于尾部进行。不要将链路采样等同于日志事件采样。
- 上下文传播会在服务之间传递 `traceparent`。

## evlog 所处的位置

- 宽事件是一条日志记录，而 span 表示链路中的一个计时操作。两者都可以携带应用属性。evlog 不会创建 span 或指标。
- `evlog/otlp` 通过 OTLP HTTP 将日志导出到 `/v1/logs`，而不是导出到仅支持 gRPC 的端点，因此 evlog 事件会落在整个技术栈已经生成的 span 旁边。
- `TraceContext` 增强器会读取传入的 `traceparent`，从而可以将事件与其他人启动的链路关联起来。其传入的父 span ID 不一定是当前活动的服务器 span ID。使用活动的 OTel SDK 上下文进行该关联。

## 我们绝不能说什么

- OpenTelemetry 很重、很复杂或大材小用。这是定位话术，而不是事实判断；运行 Collector 的读者会将其视为无知。
- evlog 可以取代它。evlog 是导出到它。
- 属性命名是任意的。语义约定确实存在，而在其旁边自创字段名称的页面，实际上是在教读者养成一种会受到其供应商惩罚的习惯。
