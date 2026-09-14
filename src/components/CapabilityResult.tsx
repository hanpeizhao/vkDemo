import { FC } from 'react';
import { Box, Text } from '@vkontakte/vkui';
import type { CapabilityRunResult } from '../bridge/capability-runner';

export const CapabilityResult: FC<{ result?: CapabilityRunResult<unknown> }> = ({ result }) => {
  if (!result) return null;

  if (result.status === 'error') {
    return (
      <Box>
        <Text weight="2">失败：{result.error.message}</Text>
        <Text>{result.error.suggestion}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text weight="2">成功</Text>
      <pre>{JSON.stringify(result.value, null, 2)}</pre>
    </Box>
  );
};
