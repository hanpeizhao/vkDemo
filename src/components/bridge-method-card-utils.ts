import type { BridgeAvailability, BridgeRisk } from '../data/bridge-methods';

export const formatBridgeMethodDefaultParams = (params: Readonly<Record<string, unknown>>): string => (
  JSON.stringify(params, null, 2)
);

export const formatBridgeMethodResult = (result: Readonly<Record<string, unknown>>): string => {
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return '结果包含无法格式化的数据。';
  }
};

export const getBridgeMethodRiskLabel = (risk: BridgeRisk): string => {
  const labels: Readonly<Record<BridgeRisk, string>> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
  };

  return labels[risk];
};

export const getBridgeMethodAvailabilityHint = (availability: BridgeAvailability): string => {
  const hints: Readonly<Record<BridgeAvailability, string>> = {
    all: '可在当前环境尝试调用',
    'vk-container': '请在 VK Mini App 环境中测试',
    'desktop-web': '仅支持桌面 VK 环境',
    mobile: '仅支持移动端 VK 环境',
  };

  return hints[availability];
};
