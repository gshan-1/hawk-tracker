import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MockAPI, Project } from '../../../../../api/mockAPI';
import { BehaviorData, BehaviorStats } from './types';
import { getMonitor, getBehaviors, clearBehaviors } from '../../../../../monitor';
import BehaviorTest from './components/BehaviorTest';
import EventList from './components/EventList';
import UserSessionAnalysis from './components/UserSessionAnalysis';

export default function UsersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [behaviorData, setBehaviorData] = useState<BehaviorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testEventCount, setTestEventCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // 确保组件只在客户端渲染
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setIsClient(true);
      }
    } catch (error) {
      console.error('客户端检测失败:', error);
      // 即使失败也要设置为客户端，避免无限加载
      setIsClient(true);
    }
  }, []);

  // 从真实 SDK 获取行为数据
  const fetchBehaviorDataFromSDK = async (): Promise<BehaviorData> => {
    try {
      const monitor = getMonitor();
      if (!monitor) {
        console.warn('监控实例未初始化，使用空数据');
        return {
          events: [],
          stats: {
            totalEvents: 0,
            pv: 0,
            uv: 0,
            clickEvents: 0,
            scrollEvents: 0,
            exposureEvents: 0,
            networkEvents: 0,
            typeDistribution: {},
            timeDistribution: {}
          }
        };
      }

      // 从 SDK 获取行为数据
      const behaviors = getBehaviors({
        maxCount: 200, // 获取最近200条记录
        includeTypes: ['click', 'scroll', 'fetch', 'xhr', 'pv', 'uv', 'exposure']
      });

      console.log('从 SDK 获取到的行为数据:', behaviors);

      // 转换为页面需要的格式
      const events = behaviors.map((behavior: any, index: number) => ({
        id: behavior.id || `behavior-${index}`,
        type: behavior.type || 'click',
        timestamp: behavior.timestamp || Date.now(),
        pageUrl: behavior.pageUrl || window.location.href,
        userId: behavior.userId || 'unknown',
        sessionId: behavior.sessionId || 'unknown',
        context: behavior.context || {}
      }));

      // 计算统计信息
      const stats: BehaviorStats = {
        totalEvents: events.length,
        pv: events.filter((e: any) => e.type === 'pv').length,
        uv: events.filter((e: any) => e.type === 'uv').length,
        clickEvents: events.filter((e: any) => e.type === 'click').length,
        scrollEvents: events.filter((e: any) => e.type === 'scroll').length,
        exposureEvents: events.filter((e: any) => e.type === 'exposure').length,
        networkEvents: events.filter((e: any) => e.type === 'fetch' || e.type === 'xhr').length,
        typeDistribution: events.reduce((acc: Record<string, number>, event: any) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        }, {}),
        timeDistribution: events.reduce((acc: Record<string, number>, event: any) => {
          const hour = new Date(event.timestamp).getHours();
          acc[hour.toString()] = (acc[hour.toString()] || 0) + 1;
          return acc;
        }, {})
      };

      return { events, stats };
    } catch (error) {
      console.error('从 SDK 获取行为数据失败:', error);
      // 返回空数据
      return {
        events: [],
        stats: {
          totalEvents: 0,
          pv: 0,
          uv: 0,
          clickEvents: 0,
          scrollEvents: 0,
          exposureEvents: 0,
          networkEvents: 0,
          typeDistribution: {},
          timeDistribution: {}
        }
      };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      try {
        const [projectData] = await Promise.all([
          MockAPI.getProject(projectId)
        ]);

        setProject(projectData);

        // 从真实 SDK 获取行为数据
        setIsLoading(true);

        try {
          if (typeof window !== 'undefined') {
            const sdkData = await fetchBehaviorDataFromSDK();
            setBehaviorData(sdkData);
            console.log('成功从 SDK 获取行为数据:', sdkData);
          }
        } catch (error) {
          console.error('获取 SDK 行为数据失败:', error);
          // 即使失败也要设置空数据
          setBehaviorData({
            events: [],
            stats: {
              totalEvents: 0,
              pv: 0,
              uv: 0,
              clickEvents: 0,
              scrollEvents: 0,
              exposureEvents: 0,
              networkEvents: 0,
              typeDistribution: {},
              timeDistribution: {}
            }
          });
        }
      } catch (error) {
        console.error('获取项目信息失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // 测试用户行为监控功能
  const testBehaviorEvent = async (eventType: string) => {
    if (!projectId) return;

    try {
      // 确保只在客户端环境中处理
      try {
        if (typeof window !== 'undefined') {
          // 事件已经通过 BehaviorTest 组件中的真实 SDK 方法记录
          // 这里只需要刷新数据
          await refreshBehaviorData();
          setTestEventCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('处理测试事件失败:', error);
        alert('测试事件处理失败，请重试！');
      }
    } catch (error) {
      console.error('测试事件失败:', error);
      alert('测试事件失败，请重试！');
    }
  };

  // 刷新行为数据
  const refreshBehaviorData = async () => {
    try {
      setIsLoading(true);
      const sdkData = await fetchBehaviorDataFromSDK();
      setBehaviorData(sdkData);
      console.log('行为数据已刷新:', sdkData);
    } catch (error) {
      console.error('刷新行为数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空行为数据
  const handleClearData = async () => {
    try {
      const monitor = getMonitor();
      if (monitor) {
        clearBehaviors();
        console.log('行为数据已清空');

        // 刷新显示
        await refreshBehaviorData();
        setTestEventCount(0);
        alert('✅ 行为数据已清空');
      } else {
        alert('❌ 监控实例未初始化，无法清空数据');
      }
    } catch (error: any) {
      console.error('清空行为数据失败:', error);
      alert('❌ 清空数据失败: ' + error.message);
    }
  };

  // 加载状态
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">
            {!isClient ? '正在初始化客户端...' : '正在加载用户行为数据...'}
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-4">项目信息加载失败</div>
          <Link
            to="/projects"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            返回项目列表
          </Link>
        </div>
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
              <span className="text-gray-900 font-medium">用户日志</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* 页面标题 */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">用户日志</h1>

      {/* 页面内容 */}
      <div className="max-w-7xl mx-auto">
        {/* 行为测试组件 */}
        <BehaviorTest
          testEventCount={testEventCount}
          onTestEvent={testBehaviorEvent}
        />

        {/* 用户会话分析组件 */}
        {behaviorData && (
          <UserSessionAnalysis events={behaviorData.events} />
        )}

        {/* 事件列表组件 */}
        {behaviorData && (
          <EventList
            events={behaviorData.events}
            onRefresh={refreshBehaviorData}
          />
        )}
      </div>
    </div>
  );
}
