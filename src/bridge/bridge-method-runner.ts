export type BridgeParams = Readonly<Record<string, unknown>>;

export type BridgeParamsParseSuccess = Readonly<{
  ok: true;
  params: BridgeParams;
}>;

export type BridgeParamsParseFailure = Readonly<{
  ok: false;
  error: string;
}>;

export type BridgeParamsParseResult = BridgeParamsParseSuccess | BridgeParamsParseFailure;

export type BridgeMethodSend = (
  method: string,
  params: BridgeParams,
) => Promise<unknown> | unknown;

export type BridgeMethodRunStatus = 'success' | 'error' | 'timeout';

export type BridgeMethodRunResult = Readonly<{
  status: BridgeMethodRunStatus;
  durationMs: number;
  result: Readonly<Record<string, unknown>> | null;
  error: string | null;
  errorType: string | null;
}>;

export type RunBridgeMethodOptions = Readonly<{
  method: string;
  params: BridgeParams;
  send: BridgeMethodSend;
  timeoutMs?: number;
}>;

const DEFAULT_TIMEOUT_MS = 10_000;
const MASKED_VALUE = '[已脱敏]';
const sensitiveKeyPattern = /access[\s_-]*token|token|secret|hash|phone|mobile|email|密码|手机号|手机号码|邮箱/iu;

class BridgeTimeoutError extends Error {
  constructor(method: string) {
    super(`调用 ${method} 超时，请检查 VK 环境后重试。`);
    this.name = 'TimeoutError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const getErrorType = (error: unknown): string => {
  if (Array.isArray(error)) {
    return 'array';
  }

  if (error instanceof Error && error.name.length > 0) {
    return error.name;
  }

  return typeof error;
};

const getTimeoutMs = (timeoutMs: number | undefined): number => {
  if (timeoutMs === undefined || !Number.isFinite(timeoutMs)) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.max(0, timeoutMs);
};

const getDurationMs = (startedAt: number): number => Math.max(0, Date.now() - startedAt);

export const parseBridgeParams = (text: string): BridgeParamsParseResult => {
  if (text.trim().length === 0) {
    return { ok: true, params: {} };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: '参数不是合法的 JSON。' };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: '参数格式错误：仅支持 JSON 对象。' };
  }

  return { ok: true, params: parsed };
};

export const sanitizeBridgeValue = (value: unknown): unknown => {
  const seen = new WeakMap<object, unknown>();

  const sanitize = (currentValue: unknown): unknown => {
    if (Array.isArray(currentValue)) {
      const existingValue = seen.get(currentValue);
      if (existingValue !== undefined) {
        return existingValue;
      }

      const sanitizedArray: unknown[] = [];
      seen.set(currentValue, sanitizedArray);

      for (const item of currentValue) {
        sanitizedArray.push(sanitize(item));
      }

      return sanitizedArray;
    }

    if (!isRecord(currentValue)) {
      return currentValue;
    }

    const existingValue = seen.get(currentValue);
    if (existingValue !== undefined) {
      return existingValue;
    }

    const sanitizedObject: Record<string, unknown> = {};
    seen.set(currentValue, sanitizedObject);

    for (const [key, nestedValue] of Object.entries(currentValue)) {
      sanitizedObject[key] = sensitiveKeyPattern.test(key) ? MASKED_VALUE : sanitize(nestedValue);
    }

    return sanitizedObject;
  };

  return sanitize(value);
};

export const runBridgeMethod = async ({
  method,
  params,
  send,
  timeoutMs,
}: RunBridgeMethodOptions): Promise<BridgeMethodRunResult> => {
  const startedAt = Date.now();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const sendPromise = Promise.resolve().then(() => send(method, params));
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => reject(new BridgeTimeoutError(method)), getTimeoutMs(timeoutMs));
  });

  try {
    const response = await Promise.race([sendPromise, timeoutPromise]);

    if (!isRecord(response)) {
      return {
        status: 'error',
        durationMs: getDurationMs(startedAt),
        result: null,
        error: `调用 ${method} 返回了非对象结果。`,
        errorType: getErrorType(response),
      };
    }

    return {
      status: 'success',
      durationMs: getDurationMs(startedAt),
      result: sanitizeBridgeValue(response) as Readonly<Record<string, unknown>>,
      error: null,
      errorType: null,
    };
  } catch (error) {
    if (error instanceof BridgeTimeoutError) {
      return {
        status: 'timeout',
        durationMs: getDurationMs(startedAt),
        result: null,
        error: error.message,
        errorType: error.name,
      };
    }

    return {
      status: 'error',
      durationMs: getDurationMs(startedAt),
      result: null,
      error: `调用 ${method} 失败，请检查 VK 环境或参数。`,
      errorType: getErrorType(error),
    };
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
};
