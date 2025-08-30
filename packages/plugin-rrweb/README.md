# Rrweb Plugin - 录屏插件

本插件为 SDK 提供 rrweb 录屏能力，默认仅在前端内存中维护环形缓冲区，不做自动上报（由上层错误插件或业务逻辑决定何时取用）。



```bash
pnpm add @hawk-tracker/plugin-rrweb
```



```ts
import { init } from '@hawk-tracker/core';
import { RrwebPlugin } from '@hawk-tracker/plugin-rrweb';



```ts
const api = (window as any).$hawkRrweb;
const recent = api?.getReplay({ maxSize: 300, maxBytes: 64 * 1024 });
```


