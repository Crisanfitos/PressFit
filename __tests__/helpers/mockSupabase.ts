/**
 * Shared Supabase mock for unit tests.
 * Provides a chainable mock that mirrors the Supabase PostgREST builder pattern.
 */

export const mockChain: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn((resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve)),
};

export const mockStorageBucket = {
    upload: jest.fn().mockResolvedValue({ error: null }),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://mock.supabase.co/photo.jpg' } }),
    createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://mock.supabase.co/signed.jpg' }, error: null }),
    remove: jest.fn().mockResolvedValue({ error: null }),
};

export const mockSupabase = {
    from: jest.fn().mockReturnValue(mockChain),
    storage: {
        from: jest.fn().mockReturnValue(mockStorageBucket),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

/**
 * Resets all mock functions and re-establishes default return values.
 * Call in beforeEach() of each test suite.
 */
export const resetMocks = () => {
    jest.clearAllMocks();

    // Re-establish chainable returns
    ['select', 'insert', 'update', 'delete', 'upsert',
        'eq', 'neq', 'in', 'is', 'not', 'gte', 'lte', 'lt', 'gt',
        'order', 'limit', 'range'
    ].forEach(key => {
        mockChain[key].mockReturnValue(mockChain);
    });

    // Re-establish terminal returns
    mockChain.single.mockResolvedValue({ data: null, error: null });
    mockChain.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockChain.then.mockImplementation((resolve: any) =>
        Promise.resolve({ data: [], error: null }).then(resolve)
    );

    mockSupabase.from.mockReturnValue(mockChain);
};
