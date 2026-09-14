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
    update(id: string, patch: Partial<BridgeLog>) {
      entries = entries.map((entry) => entry.id === id ? { ...entry, ...patch } : entry);
    },
    clear() {
      entries = [];
    },
  };
}
