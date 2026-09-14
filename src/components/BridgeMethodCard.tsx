import { useState, type FC } from 'react';
import {
  Box,
  Button,
  Card,
  Caption,
  ContentBadge,
  FormItem,
  Spinner,
  Text,
  Textarea,
  Title,
} from '@vkontakte/vkui';

import {
  type BridgeMethod,
  bridgeMethodCategories,
} from '../data/bridge-methods';
import {
  type BridgeMethodRunResult,
  type BridgeMethodSend,
} from '../bridge/bridge-method-runner';
import type { BridgeMethodSupportStatus } from '../bridge/bridge-method-support';
import {
  getBridgeMethodResultTitle,
  runBridgeMethodCardInteraction,
  type BridgeMethodCardInteractionState,
} from './bridge-method-card-interaction';
import {
  formatBridgeMethodDefaultParams,
  formatBridgeMethodResult,
  getBridgeMethodAvailabilityHint,
  getBridgeMethodRiskLabel,
} from './bridge-method-card-utils';

export type BridgeMethodCardProps = Readonly<{
  method: BridgeMethod;
  send: BridgeMethodSend;
  onLog?: (method: BridgeMethod, result: BridgeMethodRunResult) => void;
  onValidationError?: (method: BridgeMethod, error: string) => void;
  timeoutMs?: number;
  supportStatus?: BridgeMethodSupportStatus;
}>;

const getCategoryTitle = (method: BridgeMethod): string => (
  bridgeMethodCategories.find((category) => category.id === method.categoryId)?.title ?? method.categoryId
);

const getRiskAppearance = (risk: BridgeMethod['risk']): 'accent-green' | 'accent' | 'accent-red' => {
  if (risk === 'low') {
    return 'accent-green';
  }

  if (risk === 'high') {
    return 'accent-red';
  }

  return 'accent';
};

const supportLabels: Record<BridgeMethodSupportStatus, string> = {
  checking: '正在检测支持情况',
  supported: '当前平台支持',
  unsupported: '当前平台不支持',
  unknown: '暂时无法确定',
};

const getSupportAppearance = (status: BridgeMethodSupportStatus): 'accent-green' | 'accent' | 'neutral' => {
  if (status === 'supported') {
    return 'accent-green';
  }

  if (status === 'unsupported') {
    return 'accent';
  }

  return 'neutral';
};

export const BridgeMethodCard: FC<BridgeMethodCardProps> = ({
  method,
  send,
  onLog,
  onValidationError,
  timeoutMs,
  supportStatus = 'unknown',
}) => {
  const [paramsText, setParamsText] = useState(() => formatBridgeMethodDefaultParams(method.defaultParams));
  const [paramsError, setParamsError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<BridgeMethodRunResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStateChange = (nextState: BridgeMethodCardInteractionState): void => {
    setParamsError(nextState.paramsError);
    setRunResult(nextState.runResult);
    setLoading(nextState.loading);
  };

  const handleRun = async (): Promise<void> => {
    await runBridgeMethodCardInteraction({
      method,
      paramsText,
      send,
      timeoutMs,
      onLog,
      onValidationError,
      onStateChange: handleStateChange,
    });
  };

  return (
    <Card className="bridge-method-card" mode="outline">
      <Box padding="m">
        <Box style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ContentBadge mode="secondary" appearance="neutral" size="s">
            {getCategoryTitle(method)}
          </ContentBadge>
          <ContentBadge mode="secondary" appearance={getRiskAppearance(method.risk)} size="s">
            {getBridgeMethodRiskLabel(method.risk)}
          </ContentBadge>
          <ContentBadge mode="secondary" appearance={getSupportAppearance(supportStatus)} size="s">
            {supportLabels[supportStatus]}
          </ContentBadge>
          {method.requiresUserAction && (
            <ContentBadge mode="secondary" appearance="accent" size="s">
              需要用户操作
            </ContentBadge>
          )}
        </Box>

        <Box paddingBlockStart="m">
          <Title level="3">{method.title}</Title>
          <Text>{method.name}</Text>
          <Text>{method.description}</Text>
          <Caption level="1">{getBridgeMethodAvailabilityHint(method.availability)}</Caption>
        </Box>

        <FormItem
          top="JSON 参数"
          bottom={paramsError ?? '调用前将校验 JSON 参数；仅支持 JSON 对象。'}
          status={paramsError ? 'error' : 'default'}
        >
          <Textarea
            value={paramsText}
            rows={6}
            disabled={loading}
            status={paramsError ? 'error' : 'default'}
            onChange={(event) => {
              setParamsText(event.target.value);
              setParamsError(null);
            }}
          />
        </FormItem>

        <Button
          stretched
          size="m"
          disabled={loading}
          loading={loading}
          loadingLabel="正在调用 Bridge 方法"
          onClick={handleRun}
        >
          调用方法
        </Button>

        {loading && (
          <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }} paddingBlockStart="s">
            <Spinner size="s" />
            <Caption level="1">正在调用 {method.name}</Caption>
          </Box>
        )}

        {runResult && (
          <Box className="bridge-method-result" paddingBlockStart="m">
            <Text>
              {getBridgeMethodResultTitle(runResult.status)}：{method.name}（{runResult.durationMs} ms）
            </Text>
            {runResult.status === 'success' && runResult.result ? (
              <pre>{formatBridgeMethodResult(runResult.result)}</pre>
            ) : (
              <>
                <Text>{runResult.error}</Text>
                {runResult.errorType && <Caption level="1">错误类型：{runResult.errorType}</Caption>}
              </>
            )}
          </Box>
        )}
      </Box>
    </Card>
  );
};
