// 点击事件测试配置
export const clickEventTestConfig = {
  // 基础配置
  basic: {
    dsn: 'https://your-dsn.com',
    appName: 'click-event-test',
    debug: true,
    sampleRate: 1
  },

  // 点击事件配置
  click: {
    enabled: true,
    throttle: 100,
    ignoreSelectors: ['.no-track', '[data-no-track]'],
    capturePosition: true,
    captureElementInfo: true,
    maxElementTextLength: 100,
    customAttributes: ['category', 'action', 'value', 'user-type', 'product-id', 'price']
  },

  // 测试场景配置
  testScenarios: {
    // 基础点击测试
    basicClick: {
      eventId: 'test-button-1',
      title: '测试按钮1',
      category: 'test',
      action: 'click'
    },

    // 忽略元素测试
    ignoredElements: [
      '.no-track',
      '[data-no-track]',
      '.ignore-click'
    ],

    // 嵌套元素测试
    nestedElements: {
      containerId: 'nested-container',
      childSelectors: ['button', 'span', 'div']
    },

    // 动态元素测试
    dynamicElements: {
      template: {
        eventId: 'dynamic-button',
        title: '动态生成的按钮',
        category: 'dynamic',
        action: 'click'
      }
    },

    // 复杂交互测试
    complexInteractions: {
      ecommerce: {
        productCard: {
          eventId: 'product-card',
          category: 'ecommerce',
          action: 'view'
        },
        addToCart: {
          eventId: 'add-to-cart',
          category: 'ecommerce',
          action: 'add'
        },
        buyNow: {
          eventId: 'buy-now',
          category: 'ecommerce',
          action: 'purchase'
        }
      }
    }
  },

  // 验证规则
  validation: {
    // 必须包含的字段
    requiredFields: ['eventId', 'eventType', 'triggerPageUrl', 'triggerTime', 'elementPath', 'x', 'y'],
    
    // 可选字段
    optionalFields: ['title', 'elementId', 'params'],
    
    // 参数验证
    paramValidation: {
      category: ['test', 'ecommerce', 'nested', 'dynamic'],
      action: ['click', 'view', 'add', 'purchase', 'container-click']
    }
  }
};