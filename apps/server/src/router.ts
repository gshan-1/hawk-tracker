import { gunzip, inflate, inflateRaw, brotliDecompress } from 'zlib';
import { promisify } from 'util';

const KoaRouter = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const router = new KoaRouter();
const apiRouter = new KoaRouter({ prefix: '/api' });

// ========== 存储结构：按 projectId 分组 ==========
interface DataStore {
  events: Record<string, any[]>;
  errors: Record<string, any[]>;
  performance: Record<string, any[]>;
  behaviors: Record<string, any[]>;
}
let dataStore: DataStore;

function getDataStore(): DataStore {
  if (!dataStore) {
    dataStore = { events: {}, errors: {}, performance: {}, behaviors: {} };
  }
  return dataStore;
}
function initProjectData(projectId: string) {
  const s = getDataStore();
  if (!s.events[projectId]) s.events[projectId] = [];
  if (!s.errors[projectId]) s.errors[projectId] = [];
  if (!s.performance[projectId]) s.performance[projectId] = [];
  if (!s.behaviors[projectId]) s.behaviors[projectId] = [];
}

// 主入口：不加 bodyParser，只读 index.ts 解析后的 body
apiRouter.post('/', async (ctx: any) => {
  const body: any = ctx.request?.body ?? {};
  console.log('📦 收到 SDK 数据包:', typeof body, Object.keys(body || {}));

  let dataQueue: any[] = [];
  let baseInfo: any = {};
  if (Array.isArray(body.dataQueue)) dataQueue = body.dataQueue;
  else if (Array.isArray(body?.data?.dataQueue))
    dataQueue = body.data.dataQueue;
  else if (Array.isArray(body.queue)) dataQueue = body.queue;
  baseInfo = body.baseInfo || body?.data?.baseInfo || {};

  if (!Array.isArray(dataQueue)) {
    ctx.status = 400;
    ctx.body = { success: false, error: '数据格式错误：dataQueue 必须是数组' };
    return;
  }

  for (const item of dataQueue) {
    if (!item) continue;
    const { type, subType, ...itemData } = item;
    const pid = String(item.projectId || subType?.projectId || 'default');
    initProjectData(pid);

    switch (type) {
      case 'error': {
        const rec = {
          ...itemData,
          projectId: pid,
          id: `error_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          receivedAt: new Date().toISOString(),
          subType,
          baseInfo,
        };
        getDataStore().errors[pid]!.push(rec);
        console.log('❌ 处理错误数据:', rec);
        break;
      }
      case 'performance': {
        const rec = {
          ...itemData,
          projectId: pid,
          id: `perf_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          receivedAt: new Date().toISOString(),
          subType,
          baseInfo,
        };
        getDataStore().performance[pid]!.push(rec);
        console.log('⚡ 处理性能数据:', rec);
        break;
      }
      case 'behavior': {
        const rec = {
          ...itemData,
          projectId: pid,
          id: `behavior_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          receivedAt: new Date().toISOString(),
          subType,
          baseInfo,
        };
        getDataStore().behaviors[pid]!.push(rec);
        console.log('🎯 处理行为数据:', rec);
        break;
      }
      default: {
        const rec = {
          ...itemData,
          projectId: pid,
          id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          receivedAt: new Date().toISOString(),
          type,
          subType,
          baseInfo,
        };
        getDataStore().events[pid]!.push(rec);
        console.log('📊 处理事件数据:', rec);
      }
    }
  }

  ctx.body = {
    success: true,
    message: `成功处理 ${dataQueue.length} 条数据`,
    processed: dataQueue.length,
  };
});

// 其他端点使用 per-route bodyParser
apiRouter.post('/error', bodyParser(), async (ctx: any) => {
  const body = ctx.request?.body ?? {};
  const pid = String(body.projectId || body.subType?.projectId || 'default');
  initProjectData(pid);
  const rec = {
    ...body,
    projectId: pid,
    id: `error_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    receivedAt: new Date().toISOString(),
  };
  getDataStore().errors[pid]!.push(rec);
  ctx.body = { success: true, message: '错误数据接收成功', dataId: rec.id };
});

apiRouter.post('/performance', bodyParser(), async (ctx: any) => {
  const body = ctx.request?.body ?? {};
  const pid = String(body.projectId || body.subType?.projectId || 'default');
  initProjectData(pid);
  const rec = {
    ...body,
    projectId: pid,
    id: `perf_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    receivedAt: new Date().toISOString(),
  };
  getDataStore().performance[pid]!.push(rec);
  ctx.body = { success: true, message: '性能数据接收成功', dataId: rec.id };
});

apiRouter.post('/behavior', bodyParser(), async (ctx: any) => {
  const body = ctx.request?.body ?? {};
  const pid = String(body.projectId || body.subType?.projectId || 'default');
  initProjectData(pid);
  const rec = {
    ...body,
    projectId: pid,
    id: `behavior_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    receivedAt: new Date().toISOString(),
  };
  getDataStore().behaviors[pid]!.push(rec);
  ctx.body = { success: true, message: '用户行为数据接收成功', dataId: rec.id };
});

apiRouter.post('/track', bodyParser(), async (ctx: any) => {
  const body = ctx.request?.body ?? {};
  const pid = String(body.projectId || body.subType?.projectId || 'default');
  initProjectData(pid);
  const rec = {
    ...body,
    projectId: pid,
    id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    receivedAt: new Date().toISOString(),
  };
  getDataStore().events[pid]!.push(rec);
  ctx.body = { success: true, message: '数据接收成功', dataId: rec.id };
});

// ========== 查询与统计 ==========
apiRouter.get('/data', async (ctx: any) => {
  const { type = 'all', limit = 100, page = 1, projectId } = ctx.query ?? {};
  const s = getDataStore();
  const pid = projectId ? String(projectId) : undefined;

  const pickAll = (m: Record<string, any[]>) => Object.values(m).flat();
  const pickPid = (m: Record<string, any[]>) =>
    pid ? (m[pid] ?? []) : pickAll(m);

  let data: any[] = [];
  switch (type) {
    case 'events':
      data = pickPid(s.events);
      break;
    case 'errors':
      data = pickPid(s.errors);
      break;
    case 'performance':
      data = pickPid(s.performance);
      break;
    case 'behaviors':
      data = pickPid(s.behaviors);
      break;
    default:
      data = [
        ...pickPid(s.events).map((x) => ({ ...x, type: 'event' })),
        ...pickPid(s.errors).map((x) => ({ ...x, type: 'error' })),
        ...pickPid(s.performance).map((x) => ({ ...x, type: 'performance' })),
        ...pickPid(s.behaviors).map((x) => ({ ...x, type: 'behavior' })),
      ];
  }

  data.sort(
    (a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
  );
  const total = data.length;
  const start = (parseInt(String(page)) - 1) * parseInt(String(limit));
  const end = start + parseInt(String(limit));

  ctx.body = {
    success: true,
    data: {
      list: data.slice(start, end),
      total,
      page: parseInt(String(page)),
      limit: parseInt(String(limit)),
      totalPages: Math.ceil(total / parseInt(String(limit))),
    },
  };
});

apiRouter.get('/stats', async (ctx: any) => {
  const { projectId } = ctx.query ?? {};
  const s = getDataStore();
  const pid = projectId ? String(projectId) : undefined;
  const pick = (m: Record<string, any[]>) =>
    pid ? (m[pid] ?? []) : Object.values(m).flat();
  const stats = {
    events: pick(s.events).length,
    errors: pick(s.errors).length,
    performance: pick(s.performance).length,
    behaviors: pick(s.behaviors).length,
    total:
      pick(s.events).length +
      pick(s.errors).length +
      pick(s.performance).length +
      pick(s.behaviors).length,
  };
  ctx.body = { success: true, data: stats };
});

// 清空（支持按项目）
apiRouter.delete('/data', async (ctx: any) => {
  const { projectId } = ctx.query ?? {};
  const s = getDataStore();
  if (projectId) {
    const pid = String(projectId);
    s.events[pid] = [];
    s.errors[pid] = [];
    s.performance[pid] = [];
    s.behaviors[pid] = [];
    ctx.body = { success: true, message: `项目 ${pid} 的数据已清空` };
  } else {
    s.events = {};
    s.errors = {};
    s.performance = {};
    s.behaviors = {};
    ctx.body = { success: true, message: '所有数据已清空' };
  }
});

router.use(apiRouter.routes());
router.use(apiRouter.allowedMethods());

export default router;
