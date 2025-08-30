import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// 监控数据接口
interface MonitorStats {
  events: number;
  errors: number;
  performance: number;
  behaviors: number;
  total: number;
}

interface MonitorData {
  list: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProjectOverviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [stats, setStats] = useState<MonitorStats | null>(null);
  const [recentData, setRecentData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      
      try {
        // 获取统计数据（带 projectId）
        const statsResponse = await fetch(`http://localhost:3001/api/stats?projectId=${projectId}`);
        const statsData = await statsResponse.json();

        // 用 /data 的 total 作为“错误数量”（与错误日志页一致）
        const errorsCountRes = await fetch(
          `http://localhost:3001/api/data?type=errors&projectId=${projectId}&limit=1`,
        );
        const errorsCountJson = await errorsCountRes.json();
        const errorsTotal = errorsCountJson?.data?.total ?? 0;

        // 获取该项目最近数据
        const dataResponse = await fetch(
          `http://localhost:3001/api/data?projectId=${projectId}&limit=10`,
        );
        const dataResult = await dataResponse.json();

        setStats({
          ...(statsData?.data || { events: 0, errors: 0, performance: 0, behaviors: 0, total: 0 }),
          errors: errorsTotal, // 覆盖为与错误日志相同的口径
        });
        setRecentData(dataResult?.data?.list || []);
      } catch (error) {
        console.error('获取监控数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // 每30秒刷新一次
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* 面包屑导航 */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              应用首页
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <Link to="/projects" className="text-gray-700 hover:text-blue-600 transition-colors">
                项目管理
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900 font-medium">监控概览</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* 页面标题 */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">监控概览</h1>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                <span className="text-red-600 text-lg">🚨</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">错误数量</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.errors || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <span className="text-blue-600 text-lg">⚡</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">性能数据</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.performance || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <span className="text-green-600 text-lg">🎯</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">用户行为</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.behaviors || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <span className="text-purple-600 text-lg">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总数据量</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.total || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 最近数据 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">最近数据</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  页面
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  详情
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentData.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.type === 'error' ? 'bg-red-100 text-red-800' :
                      item.type === 'performance' ? 'bg-blue-100 text-blue-800' :
                      item.type === 'behavior' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.type || 'event'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.receivedAt || item.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.page || item.pageUrl || 'unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.errorMessage || item.eventName || item.message || '无详情'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">快速操作</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to={`/projects/${projectId}/errors-log`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            查看错误日志
          </Link>
          <Link
            to={`/projects/${projectId}/performance`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            查看性能日志
          </Link>
          <Link
            to={`/projects/${projectId}/custom`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            查看自定义埋点
          </Link>
        </div>
      </div>
    </div>
  );
}
