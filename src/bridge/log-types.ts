export type BridgeLog = {
  id: string;
  capabilityId: string;
  method?: string;
  startedAt: number;
  duration: number;
  status: 'running' | 'success' | 'error' | 'timeout';
  result?: unknown;
  error?: {
    code?: string;
    message: string;
    suggestion: string;
  };
};

export function formatBridgeError(error: unknown) {
  const bridgeError = error as { code?: string; error_data?: string; message?: string } | null;
  const code = bridgeError?.code;
  const message = bridgeError?.error_data || bridgeError?.message || 'VK Bridge 调用失败';
  const suggestion = code === 'WebAppNotAllowed'
    ? '请在 VK 小程序容器中运行此测试。'
    : '请检查运行环境、权限和传入参数。';
  return { code, message, suggestion };
}
