import type { BridgeLog } from '../bridge/capability-runner';

export function createBridgeLogStore() {
  let entries: BridgeLog[] = [];
  return {
    get entries() {
      return entries;
    },
    add(entry: BridgeLog) {
      entries = [...entries, entry];
    },
    recordMethod(entry: BridgeLog & { method: string; status: BridgeLog['status'] | 'timeout' }) {
      const normalizedError = typeof entry.error === 'string'
        ? { message: entry.error, suggestion: '请检查运行环境、权限和传入参数。' }
        : entry.error;
      entries = [...entries, { ...entry, capabilityId: entry.method, ...(normalizedError ? { error: normalizedError } : {}) } as BridgeLog];
    },
    update(id: string, patch: Partial<BridgeLog>) {
      entries = entries.map((entry) => entry.id === id ? { ...entry, ...patch } : entry);
    },
    clear() {
      entries = [];
    },
  };
}
