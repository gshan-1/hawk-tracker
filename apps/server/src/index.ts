import Koa from 'koa';
import cors from '@koa/cors';
import router from './router';
import { gunzip, inflate, inflateRaw, brotliDecompress } from 'zlib';
import { promisify } from 'util';

const gunzipAsync = promisify(gunzip);
const inflateAsync = promisify(inflate);
const inflateRawAsync = promisify(inflateRaw);
const brotliAsync = promisify(brotliDecompress);

const app = new Koa();
console.log('INDEX_TS_BUILD_MARK v1');
app.use(cors({ origin: '*', credentials: true }));

// 唯一入口：仅解析 POST /api 的原始请求体（压缩 -> JSON）
app.use(async (ctx, next) => {
  if (ctx.method === 'POST' && ctx.path.startsWith('/api')) {
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve) => {
      ctx.req.on('data', (c: Buffer) => chunks.push(c));
      ctx.req.on('end', resolve);
    });
    const raw = Buffer.concat(chunks);
    const ce = String(ctx.headers['content-encoding'] || '');
    const ct = String(ctx.headers['content-type'] || '');

    async function tryJSON(buf: Buffer) {
      try {
        return JSON.parse(buf.toString('utf8'));
      } catch {
        return null;
      }
    }

    let parsed: any = null;
    try {
      if (ce === 'gzip') parsed = await tryJSON(await gunzipAsync(raw));
      else if (ce === 'deflate') {
        parsed = await tryJSON(await inflateAsync(raw));
        if (!parsed) parsed = await tryJSON(await inflateRawAsync(raw));
      } else if (ce === 'br') parsed = await tryJSON(await brotliAsync(raw));
    } catch (e) {
      console.error('decode by content-encoding failed:', e);
    }

    if (!parsed && raw.length > 2 && raw[0] === 0x1f && raw[1] === 0x8b) {
      try {
        parsed = await tryJSON(await gunzipAsync(raw));
      } catch {}
    }
    if (!parsed) parsed = await tryJSON(raw);

    if (parsed) {
      ctx.request.body = parsed;
      console.log('✅ 入口解析成功 keys:', Object.keys(parsed));
    } else {
      ctx.request.body = { rawData: raw.toString('base64') }; // 兜底便于排查
      console.warn('⚠️ 入口解析失败，写入 rawData(base64)');
    }
  }
  await next();
});

// 注意：不要再 app.use(bodyParser(...))

app.use(router.routes());
app.use(router.allowedMethods());

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📊 API endpoints available at http://localhost:${port}/api`);
});
