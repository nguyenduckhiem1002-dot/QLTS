import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const DEFAULT_TTL = 30_000;

type CacheEntry = {
  expiresAt: number;
  promise: Promise<unknown>;
};

const cache = new Map<string, CacheEntry>();

export async function getJson<T>(path: string, ttl = DEFAULT_TTL): Promise<T> {
  const key = path;
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.promise as Promise<T>;
  }

  const promise = fetch(`${API_URL}${path}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      return (await response.json()) as T;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });

  cache.set(key, { expiresAt: now + ttl, promise });

  return promise;
}

export function prefetch(path: string) {
  void getJson(path).catch(() => undefined);
}

export function invalidate(path?: string) {
  if (path) {
    cache.delete(path);
    return;
  }

  cache.clear();
}

export function useApi<T>(path: string) {
  const [state, setState] = useState<{
    data?: T;
    error?: Error;
    loading: boolean;
  }>({ loading: true });

  useEffect(() => {
    let active = true;

    setState((current) => ({ ...current, loading: !current.data }));

    getJson<T>(path)
      .then((data) => {
        if (active) setState({ data, loading: false });
      })
      .catch((error: Error) => {
        if (active) setState({ error, loading: false });
      });

    return () => {
      active = false;
    };
  }, [path]);

  return state;
}
