import {
  parseBridgeParams,
  runBridgeMethod,
  type BridgeMethodRunResult,
  type BridgeMethodSend,
} from '../bridge/bridge-method-runner.ts';
import type { BridgeMethod } from '../data/bridge-methods.ts';

export type BridgeMethodCardInteractionState = Readonly<{
  paramsError: string | null;
  runResult: BridgeMethodRunResult | null;
  loading: boolean;
}>;

export type BridgeMethodCardInteractionOutcome =
  | Readonly<{ kind: 'validation-error' }>
  | Readonly<{ kind: 'completed'; result: BridgeMethodRunResult }>;

export type RunBridgeMethodCardInteractionOptions = Readonly<{
  method: BridgeMethod;
  paramsText: string;
  send: BridgeMethodSend;
  timeoutMs?: number;
  onLog?: (method: BridgeMethod, result: BridgeMethodRunResult) => void;
  onStateChange: (state: BridgeMethodCardInteractionState) => void;
}>;

export const getBridgeMethodResultTitle = (status: BridgeMethodRunResult['status']): string => {
  if (status === 'success') {
    return '调用成功';
  }

  if (status === 'timeout') {
    return '调用超时';
  }

  return '调用失败';
};

export const runBridgeMethodCardInteraction = async ({
  method,
  paramsText,
  send,
  timeoutMs,
  onLog,
  onStateChange,
}: RunBridgeMethodCardInteractionOptions): Promise<BridgeMethodCardInteractionOutcome> => {
  const parsedParams = parseBridgeParams(paramsText);

  if (!parsedParams.ok) {
    onStateChange({
      paramsError: parsedParams.error,
      runResult: null,
      loading: false,
    });
    return { kind: 'validation-error' };
  }

  onStateChange({
    paramsError: null,
    runResult: null,
    loading: true,
  });

  let runResult: BridgeMethodRunResult | null = null;

  try {
    runResult = await runBridgeMethod({
      method: method.name,
      params: parsedParams.params,
      send,
      timeoutMs,
    });
    onLog?.(method, runResult);
    return { kind: 'completed', result: runResult };
  } finally {
    onStateChange({
      paramsError: null,
      runResult,
      loading: false,
    });
  }
};
