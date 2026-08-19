# OpenTelemetry

检查时间：2026-08-14 · 来源：https://opentelemetry.io/docs/

它不是竞争对手，而将其视为竞争对手的页面会失去运行 Collector 的读者。evlog 提供 OTLP drain，因此真正的关系是“evlog 使用这一标准”。

## 它的作用

- 三种信号：traces、metrics、logs。一个 span 包含名称、持续时间、状态和属性。
- 语义约定固定属性名称（`http.request.method`、`server.address`、`error.type`）。遵循这些约定的字段可以在任何地方查询；不遵循的字段则只有你自己能使用。
- SDK 为运行时添加检测；Collector 接收、处理并导出数据。OTLP 是通过 gRPC 或 HTTP 传输的线协议。
- 采样可以在 SDK 中基于头部进行，也可以在 Collector 中基于尾部进行。
- 上下文传播会跨服务传递 `traceparent`。

## evlog 所处的位置

- 一个宽泛事件和一个带有丰富属性的 span 是近亲。区别在于字段写入的位置及其成本，而不在于它本身是什么。
- `evlog/otlp` 可导出到任意 OTLP 端点，因此 evlog 事件会与栈中其他部分已经发出的 span 并列出现。
- `TraceContext` enrich­er 会读取传入的 `traceparent`，这使 evlog 事件可以关联到由其他人发起的 trace。

## 我们绝不能说什么

- OpenTelemetry 很重、很复杂或大材小用。这是定位话术，而不是事实判断；运行 Collector 的读者会将其视为无知。
- evlog 可以取代它。evlog 是导出到它。
- 属性命名是任意的。语义约定确实存在，而在其旁边自创字段名称的页面，实际上是在教读者养成一种会受到其供应商惩罚的习惯。
