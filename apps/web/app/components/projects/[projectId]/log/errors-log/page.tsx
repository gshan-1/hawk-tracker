import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ErrorLog } from '../../../../../api/mockAPI';
import { trackError,flush} from '../../../../../monitor'; // 添加缺失的导入
import { useServerWatch } from '../../../../../hooks/useServerWatch';

export default function ErrorLogsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 从Server获取错误日志数据
  const fetchErrorLogsFromServer = async () => {
    if (!projectId || isRefreshing) return; // 防止重复请求
    
    setIsRefreshing(true);
    try {
      console.log('🔄 正在从Server获取错误数据...');
      
      const response = await fetch(`http://localhost:3001/api/data?type=errors&projectId=${projectId}&limit=50`);
      const result = await response.json();
      
      console.log('📊 Server返回的错误数据:', result);
      
      if (result.success && result.data) {
        const list = result.data.list || [];
        const mapped = list.map((it: any) => ({
          id: it.id,
          eventId: it.id,
          eventType: it.subType?.errorType || it.errorType || it.type || 'error',
          currentPageUrl: it.subType?.currentPageUrl || it.url || it.pageUrl || it.page || 'unknown',
          timestamp: it.receivedAt ? new Date(it.receivedAt).toLocaleString()
                   : it.timestamp ? new Date(it.timestamp).toLocaleString() : '',
          errorMessage: it.subType?.errorMessage || it.errorMessage,
          stackTrace: it.subType?.stackTrace || it.stackTrace,
        }));
        setErrorLogs(mapped);
        setErrorCount(result.data.total || mapped.length);
        console.log(`✅ 成功获取 ${result.data.list?.length || 0} 条错误数据`);
      } else {
        console.warn('⚠️ Server返回数据格式异常:', result);
      }
    } catch (error) {
      console.error('❌ 获取错误日志失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  };


  // 组件挂载时设置加载成功
  useEffect(() => {
    if (!projectId) return;
    setIsLoading(false); // 立即设置加载完成
  }, [projectId]);

  // 测试错误功能
  const testError = async (errorType: string, event?: React.MouseEvent) => {
    if (!projectId) return;
    try {
      console.log(`🔄 开始测试 ${errorType} 错误...`);
      
      let testError: Error;
      
      switch (errorType) {
        case 'TypeError':
          testError = new TypeError('这是一个TypeError测试错误');
          break;
        case 'ReferenceError':
          testError = new ReferenceError('这是一个ReferenceError测试错误');
          break;
        case '手动错误':
          testError = new Error('这是一个手动触发的测试错误');
          break;
        case '异步错误':
          setTimeout(() => {
            const asyncError = new Error('这是一个异步测试错误');
            console.log('🔄 上报异步错误:', asyncError);
            trackError(asyncError, { 
              errorType: 'async',
              projectId,
              testMode: true 
            });
            flush();//立即把队列推送到server
            setTimeout(fetchErrorLogsFromServer, 300);
          }, 100);
          alert(`${errorType}错误测试已触发！`);
          return;
        default:
          testError = new Error(`测试${errorType}错误`);
      }
      
      console.log('🔄 上报错误:', testError);
      trackError(testError, { 
        errorType,
        projectId,
        testMode: true,
        currentPageUrl: window.location.href
      });
      alert(`${errorType}错误测试成功！已通过Hawk Tracker SDK上报`);
    } catch (error) {
      console.error('测试错误失败:', error);
      alert('测试错误失败，请重试！');
    }
  };

  // 手动刷新错误日志
  const refreshErrorLogs = async (event?: React.MouseEvent) => {
    if (isRefreshing) return;
    
    const button = event?.target as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.textContent = '刷新中...';
    }
    
    try {
      console.log('🔄 手动刷新错误日志...');
      await fetchErrorLogsFromServer();
      alert('错误日志已从Server刷新！');
    } catch (error) {
      console.error('刷新失败:', error);
      alert('刷新失败，请重试！');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = '从Server刷新数据';
      }
    }
  };

  // useServerWatch获取错误数量
  const watch = useServerWatch({
    projectId,
    getFlag: async (pid: string) => {
      try {
        const cnt = await fetchErrorsCount(pid);
        return String(cnt);
      } catch {
        return `err-${Date.now()}`;
      }
    },

    onChange: async()=>{
      try {
        const cnt = await fetchErrorsCount(projectId!);
        setErrorCount(cnt);
      } catch {}
    },
    initialFetch: true,

    // 短探测 + 温和退避
    baseInterval: 2000,          // 基础轮询 2s
    backoffSteps: [5000, 10000], // 无变化时退避到 5s、10s
    maxIdleInterval: 3000,         // 关键：退避上限<=3s（最多3秒就会再探测一次）
  });


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
              <span className="text-gray-900 font-medium">错误日志</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* 页面标题 */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">错误日志</h1>

      {/* Hawk Tracker 错误测试 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Hawk Tracker 错误测试</h2>
        <p className="text-sm text-gray-600 mb-4">
          点击下面的按钮来测试Hawk Tracker的错误捕获功能。这些错误会被ErrorPlugin捕获并上报到Server。
        </p>
        <p className="text-sm text-gray-600 mb-6">
          当前错误数量: <span className="font-medium text-red-600">{errorCount}</span>
        </p>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={() => testError('TypeError')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            测试 TypeError
          </button>
          <button
            onClick={() => testError('ReferenceError')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            测试 ReferenceError
          </button>
          <button
            onClick={() => testError('手动错误')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            测试手动错误
          </button>
          <button
            onClick={() => testError('异步错误')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            测试异步错误
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={refreshErrorLogs}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            从Server刷新数据
          </button>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">测试说明：</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <strong>SDK上报</strong>：点击测试按钮时，SDK真正上报错误到Server</li>
            <li>• <strong>Server数据</strong>：2秒后自动从Server获取真实数据并更新列表</li>
            <li>• <strong>手动刷新</strong>：点击"从Server刷新数据"按钮手动获取最新数据</li>
          </ul>
        </div>
      </div>

      {/* 错误事件列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">错误事件列表</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  序号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  事件ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  事件类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前页面URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {errorLogs.map((log, index) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {log.eventId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {log.eventType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {log.currentPageUrl}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/projects/${projectId}/errors-log/${log.id}`}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {errorLogs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">暂无错误日志</p>
            <p className="text-sm text-gray-400 mt-2">尝试触发一些错误来查看数据</p>
          </div>
        )}
      </div>
    </div>
  );
}

async function fetchErrorsCount(projectId: string): Promise<number> {
  const res = await fetch(`http://localhost:3001/api/stats?projectId=${projectId}`);
  const json = await res.json();
  return json?.data?.errors ?? 0;
}
