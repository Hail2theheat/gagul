// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// Query keys that should NOT be persisted to storage (volatile/time-sensitive data)
const VOLATILE_QUERY_KEYS = ['groupStatus', 'firesideData'];

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (for persistence)
      retry: 2,
      refetchOnWindowFocus: false, // RN doesn't have window focus in the same way
    },
    mutations: {
      retry: 1,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'STOKIE_QUERY_CACHE',
  throttleTime: 1000,
});

/** Filter function for PersistQueryClientProvider: skip volatile queries */
export function shouldDehydrateQuery(query: any) {
  const key = query.queryKey?.[0];
  if (VOLATILE_QUERY_KEYS.includes(key)) return false;
  // Default: persist successful queries
  return query.state.status === 'success';
}
