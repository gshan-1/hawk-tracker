import { useCallback } from 'react';
import { getMonitor, trackError, trackEvent } from '../monitor';

export function useMonitor() {
  const monitor = getMonitor();

  const trackErrorHandler = useCallback((error: Error, extra?: any) => {
    trackError(error, extra);
  }, []);

  const trackEventHandler = useCallback((eventName: string, data: any) => {
    trackEvent(eventName, data);
  }, []);

  const trackPageView = useCallback(
    (pageName: string, extra?: any) => {
      if (monitor) {
        monitor.track('behavior', {
          type: 'pageView',
          pageName,
          url: window.location.href,
          timestamp: Date.now(),
          ...extra,
        });
      }
    },
    [monitor],
  );

  const trackClick = useCallback(
    (element: string, extra?: any) => {
      if (monitor) {
        monitor.track('behavior', {
          type: 'click',
          element,
          url: window.location.href,
          timestamp: Date.now(),
          ...extra,
        });
      }
    },
    [monitor],
  );

  const trackPerformance = useCallback(
    (metrics: any) => {
      if (monitor) {
        monitor.track('performance', {
          ...metrics,
          timestamp: Date.now(),
        });
      }
    },
    [monitor],
  );

  return {
    monitor,
    trackError: trackErrorHandler,
    trackEvent: trackEventHandler,
    trackPageView,
    trackClick,
    trackPerformance,
  };
}
