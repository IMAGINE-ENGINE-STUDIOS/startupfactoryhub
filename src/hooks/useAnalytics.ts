import { useAuth } from '@/contexts/AuthContext';

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = async (eventType: string, eventData?: Record<string, any>) => {
    if (!user) return;

    try {
      // Log analytics events for now (can be sent to external service later)
      console.log('[Analytics]', {
        user_id: user.id,
        event_type: eventType,
        event_data: eventData || {},
        timestamp: new Date().toISOString(),
      });
      
      // TODO: Send to analytics service (PostHog, Mixpanel, etc.)
      // await analyticsService.track(eventType, eventData);
    } catch (error) {
      // Silently fail - analytics should never break the app
      console.error('Analytics tracking error:', error);
    }
  };

  const trackPageView = (pageName: string) => {
    trackEvent('page_view', { page: pageName });
  };

  const trackClick = (element: string, context?: Record<string, any>) => {
    trackEvent('click', { element, ...context });
  };

  const trackFeatureUse = (feature: string, metadata?: Record<string, any>) => {
    trackEvent('feature_use', { feature, ...metadata });
  };

  const trackError = (error: string, context?: Record<string, any>) => {
    trackEvent('error', { error, ...context });
  };

  return {
    trackEvent,
    trackPageView,
    trackClick,
    trackFeatureUse,
    trackError,
  };
};
