import React from 'react';
import { useAuth } from '../../../../../../contexts/AuthContext';

interface BehaviorEvent {
  id: string;
  type: 'click' | 'scroll' | 'exposure' | 'pv' | 'uv' | 'fetch' | 'xhr';
  timestamp: number;
  pageUrl: string;
  userId: string;
  sessionId: string;
  context: any;
}

interface UserSessionAnalysisProps {
  events: BehaviorEvent[];
}

export default function UserSessionAnalysis({ events }: UserSessionAnalysisProps) {
  const { user } = useAuth();
  const hasData = events.length > 0;

  // 单用户分析：使用真实登录用户信息
  const userId = user?.name || user?.email || '未登录用户';
  const totalEvents = events.length;

  // 按时间分布分析用户行为（按小时分组）
  const hourlyActivity = new Array(24).fill(0);
  events.forEach(event => {
    const hour = new Date(event.timestamp).getHours();
    hourlyActivity[hour]++;
  });

  // 找出最活跃的时间段
  const maxActivityHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
  const totalActiveHours = hourlyActivity.filter(count => count > 0).length;



  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">用户会话分析</h3>
        <p className="text-sm text-gray-600">基于行为栈的用户会话统计和活跃度分析</p>
      </div>
      <div className="p-6">
        {!hasData ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-3">📈</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">暂无会话数据</h4>
            <p className="text-gray-600 mb-4">
              暂无用户行为数据，无法进行会话分析
            </p>
            <div className="text-sm text-gray-500">
              💡 提示：使用行为测试组件生成数据后，这里将显示详细的会话分析
            </div>
          </div>
        ) : (
          <>
            {/* 用户基本信息 */}
            <div className="mb-8">
              <h4 className="text-md font-medium text-gray-900 mb-4">用户基本信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{userId}</div>
                  <div className="text-sm text-gray-600 mt-1">用户ID</div>
                  <div className="text-xs text-gray-500 mt-1">当前测试用户</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{totalEvents}</div>
                  <div className="text-sm text-gray-600 mt-1">总事件数</div>
                  <div className="text-xs text-gray-500 mt-1">已触发的事件总数</div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{totalActiveHours}</div>
                  <div className="text-sm text-gray-600 mt-1">活跃小时数</div>
                  <div className="text-xs text-gray-500 mt-1">有活动的小时数</div>
                </div>
              </div>
            </div>

            {/* 时间活跃度分布 */}
            <div className="mb-8">
              <h4 className="text-md font-medium text-gray-900 mb-4">时间活跃度分布</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-center mb-3">
                  <span className="text-sm text-gray-600">最活跃时间段：</span>
                  <span className="font-medium text-blue-600">{maxActivityHour}:00 - {maxActivityHour + 1}:00</span>
                </div>
                <div className="grid grid-cols-12 gap-1">
                  {hourlyActivity.map((count, hour) => (
                    <div key={hour} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">{hour}</div>
                      <div
                        className={`h-8 rounded-sm ${count === 0 ? 'bg-gray-200' :
                          count <= 2 ? 'bg-green-200' :
                            count <= 5 ? 'bg-yellow-200' : 'bg-red-200'
                          }`}
                        style={{ height: `${Math.max(8, count * 4)}px` }}
                      ></div>
                      <div className="text-xs text-gray-600 mt-1">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>



            {/* 用户行为模式分析 */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">用户行为模式分析</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🖱️</span>
                    <div>
                      <div className="font-medium">点击行为模式</div>
                      <div className="text-sm text-gray-600">用户点击偏好和热点区域</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-600">
                      {events.filter(e => e.type === 'click').length} 次
                    </div>
                    <div className="text-xs text-gray-500">点击事件</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📜</span>
                    <div>
                      <div className="font-medium">滚动行为模式</div>
                      <div className="text-sm text-gray-600">页面浏览深度和停留时间</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      {events.filter(e => e.type === 'scroll').length} 次
                    </div>
                    <div className="text-xs text-gray-500">滚动事件</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📡</span>
                    <div>
                      <div className="font-medium">Fetch请求模式</div>
                      <div className="text-sm text-gray-600">Fetch API调用频率和响应时间</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-orange-600">
                      {events.filter(e => e.type === 'fetch').length} 次
                    </div>
                    <div className="text-xs text-gray-500">Fetch请求</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🌐</span>
                    <div>
                      <div className="font-medium">XHR请求模式</div>
                      <div className="text-sm text-gray-600">XMLHttpRequest调用频率和响应时间</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-purple-600">
                      {events.filter(e => e.type === 'xhr').length} 次
                    </div>
                    <div className="text-xs text-gray-500">XHR请求</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
