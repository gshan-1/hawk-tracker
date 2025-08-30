import React from 'react';
import { useAuth } from '../../../../../../contexts/AuthContext';

interface BehaviorEvent {
  id: string;
  type: 'click' | 'scroll' | 'exposure' | 'pv' | 'uv' | 'fetch' | 'xhr';
  timestamp: number;
  pageUrl: string;
  userId: string;
  sessionId: string;
  context: {
    element?: {
      tagName: string;
      textContent?: string;
      className?: string;
      position?: { x: number; y: number };
    };
    network?: {
      url: string;
      method: string;
      status: number;
      duration: number;
    };
    scroll?: {
      scrollTop: number;
      scrollPercentage: number;
    };
    exposure?: {
      elementId: string;
      elementText: string;
      viewportPercentage: number;
    };
    customData?: Record<string, any>;
  };
}

interface EventListProps {
  events: BehaviorEvent[];
  onRefresh: () => void;
}

export default function EventList({
  events,
  onRefresh
}: EventListProps) {
  const { user } = useAuth();
  const hasData = events.length > 0;
  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      click: '🖱️',
      scroll: '📜',
      exposure: '👁️',
      pv: '📊',
      uv: '👤',
      fetch: '🌐',
      xhr: '🌐'
    };
    return icons[type] || '📊';
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      click: 'bg-blue-100 text-blue-800',
      scroll: 'bg-green-100 text-green-800',
      exposure: 'bg-purple-100 text-purple-800',
      pv: 'bg-indigo-100 text-indigo-800',
      uv: 'bg-pink-100 text-pink-800',
      fetch: 'bg-orange-100 text-orange-800',
      xhr: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const filteredEvents = events;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">用户行为事件列表</h3>
        <p className="text-sm text-gray-600 mb-4">
          基于行为栈的用户行为事件记录，包含点击、滚动、曝光、网络请求等详细信息
        </p>
      </div>

      <div className="p-6">
        {!hasData ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-3">📋</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">暂无事件数据</h4>
            <p className="text-gray-600 mb-4">
              暂无用户行为事件记录，无法显示事件列表
            </p>
            <div className="text-sm text-gray-500">
              💡 提示：使用行为测试组件生成数据后，这里将显示详细的事件列表
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    序号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    事件类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    页面URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    事件详情
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    时间
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.slice(-50).reverse().map((event, index) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(event.type)}`}>
                        {getEventTypeIcon(event.type)} {event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {user?.name || user?.email || '未登录用户'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {event.pageUrl}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {event.type === 'click' && event.context.element && (
                        <div>
                          <div className="font-medium">{event.context.element.tagName}</div>
                          {event.context.element.position && (
                            <div className="text-xs text-gray-500">
                              位置: ({event.context.element.position.x}, {event.context.element.position.y})
                            </div>
                          )}
                        </div>
                      )}
                      {event.type === 'scroll' && event.context.scroll && (
                        <div>
                          <div className="font-medium">滚动到 {event.context.scroll.scrollPercentage}%</div>
                          <div className="text-xs text-gray-500">
                            位置: {event.context.scroll.scrollTop}px
                          </div>
                        </div>
                      )}
                      {event.type === 'exposure' && event.context.exposure && (
                        <div>
                          <div className="font-medium">{event.context.exposure.elementText}</div>
                          <div className="text-xs text-gray-500">
                            曝光度: {event.context.exposure.viewportPercentage}%
                          </div>
                        </div>
                      )}
                      {['fetch', 'xhr'].includes(event.type) && event.context.network && (
                        <div>
                          <div className="font-medium">{event.context.network.method} {event.context.network.url}</div>
                          <div className="text-xs text-gray-500">
                            状态: {event.context.network.status} | 耗时: {event.context.network.duration}ms
                          </div>
                        </div>
                      )}
                      {event.type === 'pv' && (
                        <div className="text-gray-600">页面访问</div>
                      )}
                      {event.type === 'uv' && (
                        <div className="text-gray-600">用户标识</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(event.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEvents.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">暂无用户行为事件</p>
              </div>
            )}
          </div>
        )}

        {filteredEvents.length > 50 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            显示最近50条事件，共 {filteredEvents.length} 条
          </div>
        )}
      </div>
    </div>
  );
}
