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

export type CapabilityRunResult<T> =
  | { status: 'success'; value: T }
  | { status: 'error'; error: { code?: string; message: string; suggestion: string } };

export function formatBridgeError(error: unknown) {
  const bridgeError = error as { code?: string; error_data?: string; message?: string } | null;
  const code = bridgeError?.code;
  const message = bridgeError?.error_data || bridgeError?.message || 'VK Bridge 调用失败';
  const suggestion = code === 'WebAppNotAllowed'
    ? '请在 VK 小程序容器中运行此测试。'
    : '请检查运行环境、权限和传入参数。';
  return { code, message, suggestion };
}

export async function runCapability<T>(
  capabilityId: string,
  operation: () => Promise<T>,
  onLog: (entry: BridgeLog) => void,
): Promise<CapabilityRunResult<T>> {
  const id = `${capabilityId}-${Date.now()}`;
  const startedAt = Date.now();
  onLog({ id, capabilityId, startedAt, duration: 0, status: 'running' });

  try {
    const value = await operation();
    onLog({ id, capabilityId, startedAt, duration: Date.now() - startedAt, status: 'success', result: value });
    return { status: 'success', value };
  } catch (error) {
    const normalizedError = formatBridgeError(error);
    onLog({ id, capabilityId, startedAt, duration: Date.now() - startedAt, status: 'error', error: normalizedError });
    return { status: 'error', error: normalizedError };
  }
}
