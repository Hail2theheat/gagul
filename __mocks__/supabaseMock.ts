/**
 * Mock Supabase client for testing
 */

// Chainable query builder mock
function createQueryBuilder() {
  const builder: any = {
    _filters: [] as any[],
    _result: { data: null, error: null, count: null },

    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn((resolve) => resolve({ data: [], error: null })),
  };

  // Make builder thenable (for await)
  const promise = Promise.resolve({ data: [], error: null });
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);

  return builder;
}

export const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' }, access_token: 'mock-token' } },
      error: null,
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' }, session: { access_token: 'mock-token' } },
      error: null,
    }),
    signUp: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' }, session: { access_token: 'mock-token' } },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
    refreshSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null,
    }),
  },
  from: jest.fn(() => createQueryBuilder()),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/mock.jpg' } }),
      download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
    })),
  },
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  })),
};

// Mock the supabase module
jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

export default mockSupabase;
