import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MockAPI, Project, PerformanceMetric, PerformanceSummary } from '../../../../../api/mockAPI';

export default function PerformancePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'navigation' | 'webvitals' | 'resources' | 'longtasks'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      try {
        const [projectData, metricsData, summaryData] = await Promise.all([
          MockAPI.getProject(projectId),
          MockAPI.getPerformanceMetrics(projectId),
          MockAPI.getPerformanceSummary(projectId)
        ]);

        setProject(projectData);
        setPerformanceMetrics(metricsData);
        setPerformanceSummary(summaryData);
      } catch (error) {
        console.error('获取性能数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // 模拟触发性能测试
  const testPerformance = async (testType: string) => {
    if (!projectId) return;

    try {
      let newMetric: Omit<PerformanceMetric, 'id'>;

      switch (testType) {
        case 'navigation':
          newMetric = {
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            type: 'navigation',
            loadTime: Math.floor(Math.random() * 2000) + 800,
            domContentLoaded: Math.floor(Math.random() * 1000) + 500,
            firstPaint: Math.floor(Math.random() * 500) + 200,
            firstContentfulPaint: Math.floor(Math.random() * 600) + 250,
            timeToFirstByte: Math.floor(Math.random() * 300) + 100,
            firstInputDelay: Math.floor(Math.random() * 150) + 50,
            interactionToNextPaint: Math.floor(Math.random() * 200) + 100,
            totalBlockingTime: Math.floor(Math.random() * 400) + 100,
            cumulativeLayoutShift: Math.random() * 0.3,
            dnsTime: Math.floor(Math.random() * 100) + 50,
            tcpTime: Math.floor(Math.random() * 100) + 40,
            requestTime: Math.floor(Math.random() * 300) + 100,
            domParseTime: Math.floor(Math.random() * 200) + 100,
            domReadyTime: Math.floor(Math.random() * 100) + 50,
            firstScreenTime: Math.floor(Math.random() * 800) + 600,
            whiteScreenTime: Math.floor(Math.random() * 300) + 100,
            resourceLoadTime: Math.floor(Math.random() * 400) + 200,
            longTaskCount: Math.floor(Math.random() * 3) + 1,
            longTaskDuration: Math.floor(Math.random() * 200) + 50,
            redirectTime: Math.floor(Math.random() * 50),
            unloadTime: Math.floor(Math.random() * 20) + 5,
            secureConnectionTime: Math.floor(Math.random() * 80) + 40,
            pageUrl: window.location.href,
            userAgent: navigator.userAgent
          };
          break;
        case 'webvitals':
          const metrics = ['LCP', 'FID', 'CLS', 'INP', 'TBT'] as const;
          const metric = metrics[Math.floor(Math.random() * metrics.length)];
          let value: number;
          
          switch (metric) {
            case 'LCP':
              value = Math.floor(Math.random() * 3000) + 1000;
              break;
            case 'FID':
              value = Math.floor(Math.random() * 200) + 50;
              break;
            case 'CLS':
              value = Math.random() * 0.3;
              break;
            case 'INP':
              value = Math.floor(Math.random() * 400) + 100;
              break;
            case 'TBT':
              value = Math.floor(Math.random() * 500) + 100;
              break;
            default:
              value = 0; // 添加默认分支
              break;
          }
          
          newMetric = {
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            type: 'web_vitals',
            metric,
            value,
            element: metric === 'LCP' ? 'IMG' : metric === 'FID' ? 'BUTTON' : undefined,
            pageUrl: window.location.href,
            userAgent: navigator.userAgent
          };
          break;
        case 'resource':
          newMetric = {
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            type: 'resource',
            name: `https://example.com/static/${testType}-${Date.now()}.js`,
            duration: Math.floor(Math.random() * 200) + 50,
            transferSize: Math.floor(Math.random() * 500000) + 100000,
            initiatorType: 'script',
            startTime: Math.floor(Math.random() * 1000),
            responseEnd: Math.floor(Math.random() * 1200) + 1000,
            pageUrl: window.location.href,
            userAgent: navigator.userAgent
          };
          break;
        case 'longtask':
          newMetric = {
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            type: 'long_task',
            longTaskCount: Math.floor(Math.random() * 5) + 1,
            longTaskDuration: Math.floor(Math.random() * 300) + 50,
            pageUrl: window.location.href,
            userAgent: navigator.userAgent
          };
          break;
        default:
          return;
      }

      const addedMetric = await MockAPI.addPerformanceMetric(projectId, newMetric);
      setPerformanceMetrics(prev => [addedMetric, ...prev]);

      // 重新获取摘要数据
      const updatedSummary = await MockAPI.getPerformanceSummary(projectId);
      setPerformanceSummary(updatedSummary);

      alert(`${testType}性能测试数据添加成功！`);
    } catch (error) {
      console.error('添加性能测试数据失败:', error);
      alert('添加测试数据失败，请重试！');
    }
  };

  // 格式化时间
  const formatTime = (ms: number | undefined): string => {
    if (ms === undefined) return 'N/A';
    return `${ms}ms`;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number | undefined): string => {
    if (bytes === undefined) return 'N/A';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

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
              <span className="text-gray-900 font-medium">性能监控</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* 页面标题 */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">性能监控</h1>

      {/* 性能测试按钮 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">性能监控测试</h2>
        <p className="text-sm text-gray-600 mb-4">
          点击下面的按钮来模拟性能数据收集。这些数据会被PerformancePlugin捕获并上报。
        </p>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => testPerformance('navigation')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            测试页面导航性能
          </button>
          <button
            onClick={() => testPerformance('webvitals')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            测试Web Vitals
          </button>
          <button
            onClick={() => testPerformance('resource')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            测试资源加载性能
          </button>
          <button
            onClick={() => testPerformance('longtask')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            测试长任务性能
          </button>
        </div>
      </div>

      {/* 性能摘要 */}
      {performanceSummary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">性能摘要</h2>
          
          {/* 核心性能指标 - 移除了角标 */}
          <div className="mb-8">
            <h3 className="text-md font-medium text-gray-900 mb-4">核心性能指标 </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700">FP (首次绘制)</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatTime(performanceSummary.coreMetrics?.fp?.value || performanceSummary.averageFirstPaint)}</p>
                <p className="text-xs text-gray-600 mt-1">良好: ≤1000ms</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700">FCP (首次内容绘制)</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatTime(performanceSummary.coreMetrics?.fcp?.value || performanceSummary.averageFirstContentfulPaint)}</p>
                <p className="text-xs text-gray-600 mt-1">良好: ≤1.8s</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700">LCP (最大内容绘制)</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatTime(performanceSummary.coreMetrics?.lcp?.value || performanceSummary.webVitals.lcp.value)}</p>
                <p className="text-xs text-gray-600 mt-1">良好: ≤2.5s</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700">TTFB (首字节时间)</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatTime(performanceSummary.coreMetrics?.ttfb?.value || performanceSummary.averageTimeToFirstByte || 0)}</p>
                <p className="text-xs text-gray-600 mt-1">良好: ≤800ms</p>
              </div>
            </div>
          </div>

          {/* 交互性能指标 - 移除了角标 */}
          <div className="mb-8">
            <h3 className="text-md font-medium text-gray-900 mb-4">交互性能指标</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700">INP (交互到下次绘制)</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatTime(performanceSummary.interactionMetrics?.inp?.value || 0)}</p>
                <p className="text-xs text-gray-600 mt-1">良好: ≤200ms</p>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700">TBT (总阻塞时间)</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatTime(performanceSummary.interactionMetrics?.tbt?.value || 0)}</p>
                <p className="text-xs text-gray-600 mt-1">良好: ≤200ms</p>
              </div>
              
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700">CLS (累积布局偏移)</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900">{performanceSummary.interactionMetrics?.cls?.value || performanceSummary.webVitals.cls.value}</p>
                <p className="text-xs text-gray-600 mt-1">良好: ≤0.1</p>
              </div>
            </div>
          </div>

          {/* 补充性能指标 - 移除了角标 */}
          <div className="mb-8">
            <h3 className="text-md font-medium text-gray-900 mb-4">补充性能指标</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-500">DNS解析时间</h4>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatTime(performanceSummary.supplementaryMetrics?.dns?.value || 0)}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-500">TCP连接时间</h4>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatTime(performanceSummary.supplementaryMetrics?.tcp?.value || 0)}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-500">DOM解析时间</h4>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatTime(performanceSummary.supplementaryMetrics?.dom?.value || 0)}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-500">首屏加载时间</h4>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatTime(performanceSummary.supplementaryMetrics?.firstScreen?.value || 0)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-500">白屏时间</h4>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatTime(performanceSummary.supplementaryMetrics?.whiteScreen?.value || 0)}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-500">资源加载时间</h4>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatTime(performanceSummary.supplementaryMetrics?.resourceLoad?.value || 0)}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-500">长任务</h4>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  <span className="text-xl">{performanceSummary.supplementaryMetrics?.longTask?.count || 0}</span>
                  <span className="text-sm ml-1">个任务</span>
                </div>
                <p className="text-sm text-gray-600">{formatTime(performanceSummary.supplementaryMetrics?.longTask?.duration || 0)} 总时长</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">平均加载时间</h3>
              <p className="text-2xl font-bold text-gray-900">{formatTime(performanceSummary.averageLoadTime)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">DOM内容加载</h3>
              <p className="text-2xl font-bold text-gray-900">{formatTime(performanceSummary.averageDomContentLoaded)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">首次绘制</h3>
              <p className="text-2xl font-bold text-gray-900">{formatTime(performanceSummary.averageFirstPaint)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">首次内容绘制</h3>
              <p className="text-2xl font-bold text-gray-900">{formatTime(performanceSummary.averageFirstContentfulPaint)}</p>
            </div>
          </div>

          {/* Web Vitals - 移除了角标 */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Web Vitals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-500">LCP (最大内容绘制)</h4>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatTime(performanceSummary.webVitals.lcp.value)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-500">FID (首次输入延迟)</h4>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatTime(performanceSummary.webVitals.fid.value)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-500">CLS (累积布局偏移)</h4>
                </div>
                <p className="text-xl font-bold text-gray-900">{performanceSummary.webVitals.cls.value}</p>
              </div>
            </div>
          </div>

          {/* 资源统计 */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">资源统计</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">总资源数</h4>
                <p className="text-xl font-bold text-gray-900">{performanceSummary.resourceStats.totalResources}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">总传输大小</h4>
                <p className="text-xl font-bold text-gray-900">{formatFileSize(performanceSummary.resourceStats.totalBytes)}</p>
              </div>
            </div>
            
            {Object.keys(performanceSummary.resourceStats.byType).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">按类型分组</h4>
                <div className="space-y-2">
                  {Object.entries(performanceSummary.resourceStats.byType).map(([type, stats]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 capitalize">{type}</span>
                      <div className="flex space-x-4 text-sm text-gray-600">
                        <span>{stats.count} 个</span>
                        <span>{formatFileSize(stats.bytes)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 标签页导航 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'overview', label: '概览', count: performanceMetrics.length },
              { key: 'navigation', label: '页面导航', count: performanceMetrics.filter(m => m.type === 'navigation').length },
              { key: 'webvitals', label: 'Web Vitals', count: performanceMetrics.filter(m => m.type === 'web_vitals').length },
              { key: 'resources', label: '资源加载', count: performanceMetrics.filter(m => m.type === 'resource').length },
              { key: 'longtasks', label: '长任务', count: performanceMetrics.filter(m => m.type === 'long_task').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* 标签页内容 */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">详情</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">页面URL</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceMetrics.map((metric) => (
                    <tr key={metric.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.timestamp}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          metric.type === 'navigation' ? 'bg-blue-100 text-blue-800' :
                          metric.type === 'web_vitals' ? 'bg-green-100 text-green-800' :
                          metric.type === 'resource' ? 'bg-purple-100 text-purple-800' :
                          metric.type === 'long_task' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {metric.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {metric.type === 'navigation' && `加载时间: ${formatTime(metric.loadTime)}`}
                        {metric.type === 'web_vitals' && `${metric.metric}: ${metric.metric === 'CLS' ? metric.value : formatTime(metric.value)}`}
                        {metric.type === 'resource' && `${metric.name?.split('/').pop()} (${formatFileSize(metric.transferSize)})`}
                        {metric.type === 'long_task' && `${metric.longTaskCount}个长任务, 总时长: ${formatTime(metric.longTaskDuration)}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{metric.pageUrl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'navigation' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">加载时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOM加载</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FCP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TTFB</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">首屏时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">白屏时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">长任务</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">页面URL</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceMetrics.filter(m => m.type === 'navigation').map((metric) => (
                    <tr key={metric.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.timestamp}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(metric.loadTime)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(metric.domContentLoaded)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(metric.firstPaint)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(metric.firstContentfulPaint)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(metric.timeToFirstByte)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(metric.firstScreenTime)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(metric.whiteScreenTime)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.longTaskCount ? `${metric.longTaskCount}个 (${formatTime(metric.longTaskDuration)})` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{metric.pageUrl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'webvitals' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">指标</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">值</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">元素</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">页面URL</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceMetrics.filter(m => m.type === 'web_vitals').map((metric) => (
                    <tr key={metric.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.timestamp}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {metric.metric}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.metric === 'CLS' ? metric.value : formatTime(metric.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{metric.element || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{metric.pageUrl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">资源名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">加载时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">传输大小</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">页面URL</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceMetrics.filter(m => m.type === 'resource').map((metric) => (
                    <tr key={metric.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.timestamp}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {metric.name?.split('/').pop()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {metric.initiatorType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(metric.duration)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatFileSize(metric.transferSize)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{metric.pageUrl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'longtasks' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">任务数量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总持续时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平均持续时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">页面URL</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceMetrics.filter(m => m.type === 'long_task').map((metric) => (
                    <tr key={metric.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.timestamp}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{metric.longTaskCount || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(metric.longTaskDuration)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.longTaskCount ? formatTime(Math.round((metric.longTaskDuration || 0) / metric.longTaskCount)) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{metric.pageUrl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {performanceMetrics.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无性能监控数据</p>
              <p className="text-sm text-gray-400 mt-2">点击上方的测试按钮来生成一些模拟数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
