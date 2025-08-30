import React from 'react';
import { getMonitor, addBehavior, trackEvent } from '../../../../../../monitor';

interface BehaviorTestProps {
  testEventCount: number;
  onTestEvent: (eventType: string) => void;
}

export default function BehaviorTest({ testEventCount, onTestEvent }: BehaviorTestProps) {
  // 获取监控实例
  const monitor = getMonitor();

  // 测试真实的点击事件监控
  const testRealClick = () => {
    if (!monitor) {
      alert('监控实例未初始化，请刷新页面重试！');
      return;
    }

    try {
      // 使用真实的 SDK 记录点击事件
      const success = addBehavior('click', {
        element: {
          tagName: 'button',
          className: 'test-button',
          position: { x: 100, y: 100 }
        },
        timestamp: Date.now(),
        pageUrl: window.location.href
      });

      if (success) {
        // 同时触发自定义事件上报
        trackEvent('test_click', {
          buttonType: 'test',
          location: 'BehaviorTest',
          success: true
        });

        onTestEvent('click');
        alert('✅ 点击事件监控成功！事件已通过 SDK 记录到行为栈');
      } else {
        alert('❌ 点击事件记录失败，请检查监控配置');
      }
    } catch (error: any) {
      console.error('点击事件测试失败:', error);
      alert('❌ 点击事件测试失败: ' + error.message);
    }
  };

  // 测试真实的滚动事件监控
  const testRealScroll = () => {
    if (!monitor) {
      alert('监控实例未初始化，请刷新页面重试！');
      return;
    }

    try {
      // 模拟滚动事件
      const scrollEvent = new Event('scroll', { bubbles: true });
      window.dispatchEvent(scrollEvent);

      // 使用真实的 SDK 记录滚动事件
      const success = addBehavior('scroll', {
        scrollTop: window.scrollY,
        scrollLeft: window.scrollX,
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        timestamp: Date.now(),
        pageUrl: window.location.href
      });

      if (success) {
        trackEvent('test_scroll', {
          scrollType: 'manual',
          location: 'BehaviorTest',
          success: true
        });

        onTestEvent('scroll');
        alert('✅ 滚动事件监控成功！事件已通过 SDK 记录到行为栈');
      } else {
        alert('❌ 滚动事件记录失败，请检查监控配置');
      }
    } catch (error: any) {
      console.error('滚动事件测试失败:', error);
      alert('❌ 滚动事件测试失败: ' + error.message);
    }
  };

  // 测试真实的网络请求监控
  const testRealFetch = async () => {
    if (!monitor) {
      alert('监控实例未初始化，请刷新页面重试！');
      return;
    }

    try {
      // 模拟 fetch 请求（不实际发送网络请求）
      const startTime = Date.now();

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 100));
      const duration = Date.now() - startTime;

      // 使用 SDK 记录网络事件
      const success = addBehavior('fetch', {
        url: 'https://api.example.com/test',
        method: 'GET',
        status: 200,
        duration: duration,
        timestamp: Date.now(),
        pageUrl: window.location.href
      });

      if (success) {
        trackEvent('test_fetch', {
          url: 'https://api.example.com/test',
          duration: duration,
          success: true
        });

        onTestEvent('fetch');
        alert(`✅ Fetch 请求监控成功！耗时: ${duration}ms，事件已通过 SDK 记录`);
      } else {
        alert('❌ Fetch 事件记录失败，请检查监控配置');
      }
    } catch (error: any) {
      console.error('Fetch 测试失败:', error);
      alert('❌ Fetch 测试失败: ' + error.message);
    }
  };

  // 测试 XHR 请求监控
  const testRealXHR = () => {
    if (!monitor) {
      alert('监控实例未初始化，请刷新页面重试！');
      return;
    }

    try {
      // 模拟 XHR 请求（不实际发送网络请求）
      const startTime = Date.now();

      // 模拟网络延迟
      setTimeout(() => {
        const duration = Date.now() - startTime;

        // 使用 SDK 记录 XHR 事件
        const success = addBehavior('xhr', {
          url: 'https://api.example.com/test',
          method: 'GET',
          status: 200,
          duration: duration,
          timestamp: Date.now(),
          pageUrl: window.location.href
        });

        if (success) {
          trackEvent('test_xhr', {
            url: 'https://api.example.com/test',
            duration: duration,
            success: true
          });

          onTestEvent('xhr');
          alert(`✅ XHR 请求监控成功！耗时: ${duration}ms，事件已通过 SDK 记录`);
        } else {
          alert('❌ XHR 事件记录失败，请检查监控配置');
        }
      }, 100);
    } catch (error: any) {
      console.error('XHR 测试失败:', error);
      alert('❌ XHR 测试失败: ' + error.message);
    }
  };

  // 测试真实的页面访问监控
  const testRealPV = () => {
    if (!monitor) {
      alert('监控实例未初始化，请刷新页面重试！');
      return;
    }

    try {
      const success = addBehavior('pv', {
        pageUrl: window.location.href,
        pageTitle: document.title,
        referrer: document.referrer,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });

      if (success) {
        trackEvent('test_pv', {
          page: window.location.pathname,
          title: document.title,
          success: true
        });

        onTestEvent('pv');
        alert('✅ 页面访问监控成功！事件已通过 SDK 记录到行为栈');
      } else {
        alert('❌ 页面访问事件记录失败，请检查监控配置');
      }
    } catch (error: any) {
      console.error('页面访问测试失败:', error);
      alert('❌ 页面访问测试失败: ' + error.message);
    }
  };

  // 测试真实的用户标识监控
  const testRealUV = () => {
    if (!monitor) {
      alert('监控实例未初始化，请刷新页面重试！');
      return;
    }

    try {
      const success = addBehavior('uv', {
        userId: 'test-user-' + Date.now(),
        sessionId: 'session-' + Date.now(),
        timestamp: Date.now(),
        pageUrl: window.location.href,
        userInfo: {
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled
        }
      });

      if (success) {
        trackEvent('test_uv', {
          userId: 'test-user-' + Date.now(),
          sessionId: 'session-' + Date.now(),
          success: true
        });

        onTestEvent('uv');
        alert('✅ 用户标识监控成功！事件已通过 SDK 记录到行为栈');
      } else {
        alert('❌ 用户标识事件记录失败，请检查监控配置');
      }
    } catch (error: any) {
      console.error('用户标识测试失败:', error);
      alert('❌ 用户标识测试失败: ' + error.message);
    }
  };

  // 测试真实的曝光事件监控
  const testRealExposure = () => {
    if (!monitor) {
      alert('监控实例未初始化，请刷新页面重试！');
      return;
    }

    try {
      const success = addBehavior('exposure', {
        element: {
          tagName: 'div',
          className: 'exposure-test',
          position: { x: 200, y: 200 }
        },
        timestamp: Date.now(),
        pageUrl: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });

      if (success) {
        trackEvent('test_exposure', {
          elementType: 'div',
          location: 'BehaviorTest',
          success: true
        });

        onTestEvent('exposure');
        alert('✅ 曝光事件监控成功！事件已通过 SDK 记录到行为栈');
      } else {
        alert('❌ 曝光事件记录失败，请检查监控配置');
      }
    } catch (error: any) {
      console.error('曝光事件测试失败:', error);
      alert('❌ 曝光事件测试失败: ' + error.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Hawk Tracker 用户行为监控测试</h2>
      <p className="text-sm text-gray-600 mb-4">
        点击下面的按钮来测试 Hawk Tracker 的用户行为监控功能。这些事件会通过 SDK 被捕获并添加到行为栈。
      </p>

      {!monitor && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ 监控实例未初始化，请确保页面已完全加载并刷新重试
          </p>
        </div>
      )}

      <p className="text-sm text-gray-600 mb-6">
        已触发测试事件次数: <span className="font-medium text-blue-600">{testEventCount}</span>
      </p>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={testRealClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          🖱️ 点击事件监控
        </button>
        <button
          onClick={testRealScroll}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          📜 滚动事件监控
        </button>
        <button
          onClick={testRealExposure}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
        >
          👁️ 曝光事件监控
        </button>
        <button
          onClick={testRealFetch}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
        >
          📡 Fetch 请求监控
        </button>
        <button
          onClick={testRealXHR}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
        >
          🌐 XHR 请求监控
        </button>
        <button
          onClick={testRealPV}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          📊 页面访问监控
        </button>
        <button
          onClick={testRealUV}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
        >
          👤 用户标识监控
        </button>
      </div>
    </div>
  );
}
