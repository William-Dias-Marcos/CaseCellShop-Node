import { cacheHitsTotal, cacheMissesTotal } from "../metrics/metrics";
import { runWithSpanSync } from "../telemetry/tracing";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL_MS = 60 * 1000; // 60 segundos por padrão

export const getFromCache = <T>(key: string): T | null => {
  return runWithSpanSync(`cache:get:${key}`, () => {
    const entry = cache.get(key);

    if (!entry) {
      cacheMissesTotal.inc();
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      cacheMissesTotal.inc();
      return null;
    }

    cacheHitsTotal.inc();
    return entry.data;
  });
};

export const setInCache = <T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS,
): void => {
  runWithSpanSync(`cache:set:${key}`, () => {
    cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  });
};
