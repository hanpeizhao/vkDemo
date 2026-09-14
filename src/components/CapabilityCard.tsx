import { FC, useState } from 'react';
import { Box, Button, Card, Group, Text } from '@vkontakte/vkui';
import type { Capability } from '../data/capabilities';
import type { CapabilityRunResult } from '../bridge/capability-runner';
import { CapabilityResult } from './CapabilityResult';
import { StatusBadge, CapabilityStatus } from './StatusBadge';

type CapabilityCardProps = {
  capability: Capability;
  onRun: (capability: Capability) => Promise<CapabilityRunResult<unknown>>;
};

export const CapabilityCard: FC<CapabilityCardProps> = ({ capability, onRun }) => {
  const [status, setStatus] = useState<CapabilityStatus>('idle');
  const [result, setResult] = useState<CapabilityRunResult<unknown>>();
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setStatus('running');
    try {
      const nextResult = await onRun(capability);
      setResult(nextResult);
      setStatus(nextResult.status);
    } finally {
      setStatus((current) => current === 'running' ? 'error' : current);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard?.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card mode="shadow">
      <Group>
        <Box padding="m">
          <Text weight="2">{capability.title}</Text>
          <Text>{capability.description}</Text>
          {capability.requiresVk && <Text>需要在 VK 环境中运行</Text>}
          <StatusBadge status={status} />
          <Button stretched loading={status === 'running'} onClick={run}>运行测试</Button>
          {result && <Button mode="secondary" stretched onClick={copyResult}>复制结果</Button>}
          {copied && <Text>结果已复制</Text>}
          <CapabilityResult result={result} />
        </Box>
      </Group>
    </Card>
  );
};
