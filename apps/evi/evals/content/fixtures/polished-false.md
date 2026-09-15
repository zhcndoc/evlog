---
title: 在测试中检查事件
description: 捕获事件并在测试套件中添加请求上下文。
---

在测试中捕获 stdout，以检查 evlog 事件。evlog 不提供内存中的 drain，因此测试必须自行解析发出的 JSON。

对于共享的事件处理，请编辑 logger 实现。evlog 没有用于扩展 logger 生命周期的插件 API。

一份内部参考重复说明了这两个限制。更改断言前，请检查测试设置。
