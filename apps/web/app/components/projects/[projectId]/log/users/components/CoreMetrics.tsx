import React from 'react';

interface BehaviorStats {
  totalEvents: number;
  pv: number;
  uv: number;
  clickEvents: number;
  scrollEvents: number;
  exposureEvents: number;
  networkEvents: number;
}

interface CoreMetricsProps {
  stats: BehaviorStats;
}

export default function CoreMetrics({ stats }: CoreMetricsProps) {
  const hasData = stats.totalEvents > 0;

  return (
    <div className="mb-8">
      {hasData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">页面访问量 (PV)</div>
            <div className="text-2xl font-bold text-blue-600">{stats.pv.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">页面浏览次数</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">独立访客 (UV)</div>
            <div className="text-2xl font-bold text-green-600">{stats.uv.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">独立用户数量</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">点击事件</div>
            <div className="text-2xl font-bold text-purple-600">{stats.clickEvents.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">用户点击行为</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">网络请求</div>
            <div className="text-2xl font-bold text-orange-600">{stats.networkEvents.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">API调用次数</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">滚动事件</div>
            <div className="text-2xl font-bold text-teal-600">{stats.scrollEvents.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">页面滚动行为</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">曝光事件</div>
            <div className="text-2xl font-bold text-indigo-600">{stats.exposureEvents.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">元素曝光次数</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">总事件数</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">累计记录总数</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">活跃度指数</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.totalEvents > 0 ? Math.round((stats.clickEvents / stats.totalEvents) * 100) : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">点击事件占比</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-400 text-4xl mb-3">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">核心指标</h3>
          <p className="text-gray-600 mb-4">
            暂无用户行为数据，点击上方的测试按钮来生成数据
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500">
            <div>页面访问量 (PV): 0</div>
            <div>独立访客 (UV): 0</div>
            <div>点击事件: 0</div>
            <div>网络请求: 0</div>
            <div>滚动事件: 0</div>
            <div>曝光事件: 0</div>
            <div>总事件数: 0</div>
            <div>活跃度指数: 0%</div>
          </div>
        </div>
      )}
    </div>
  );
}
