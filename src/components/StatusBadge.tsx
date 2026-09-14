import { FC } from 'react';
import { Box, Text } from '@vkontakte/vkui';

export type CapabilityStatus = 'idle' | 'running' | 'success' | 'error';

const labels: Record<CapabilityStatus, string> = {
  idle: '未测试',
  running: '测试中',
  success: '成功',
  error: '失败',
};

export const StatusBadge: FC<{ status: CapabilityStatus }> = ({ status }) => (
  <Box>
    <Text weight="2">{labels[status]}</Text>
  </Box>
);
