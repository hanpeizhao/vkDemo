export type BridgeMethodSupportStatus = 'checking' | 'supported' | 'unsupported' | 'unknown';

export type BridgeMethodSupportChecker = (method: string) => Promise<boolean>;

export const getBridgeMethodSupportStatuses = async (
  methods: readonly string[],
  supportsAsync: BridgeMethodSupportChecker,
): Promise<Record<string, BridgeMethodSupportStatus>> => {
  const results = await Promise.all(methods.map(async (method) => {
    try {
      return [method, (await supportsAsync(method)) ? 'supported' : 'unsupported'] as const;
    } catch {
      return [method, 'unknown'] as const;
    }
  }));

  return Object.fromEntries(results);
};
