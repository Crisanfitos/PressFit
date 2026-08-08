/**
 * Stateful Supabase Mock Client for isolated integration testing with dynamic network state toggling.
 * Enables testing of offline/online sync scenarios deterministically.
 */

export interface PostgrestError {
    message: string;
    details?: string;
    hint?: string;
    code: string;
    status?: number;
}

export interface PostgrestResponse<T> {
    data: T | null;
    error: PostgrestError | null;
}

export class StatefulSupabaseMockClient {
    private isOnline = true;
    private tables: Record<string, any[]> = {};

    constructor() {
        this.resetStore();
    }

    /**
     * Alterna el estado de conectividad simulado del cliente Supabase.
     */
    setOnline(status: boolean) {
        this.isOnline = status;
    }

    /**
     * Desconecta simuladamente el cliente Supabase (modo Offline).
     */
    disconnect() {
        this.setOnline(false);
    }

    /**
     * Reconecta simuladamente el cliente Supabase (modo Online).
     */
    reconnect() {
        this.setOnline(true);
    }

    /**
     * Devuelve el estado de red actual del mock.
     */
    isNetworkOnline(): boolean {
        return this.isOnline;
    }

    /**
     * Pobla una tabla en memoria con datos semilla.
     */
    seedTable(tableName: string, data: any[]) {
        this.tables[tableName] = JSON.parse(JSON.stringify(data));
    }

    /**
     * Obtiene una copia profunda de los datos de una tabla en memoria.
     */
    getTableData(tableName: string): any[] {
        return JSON.parse(JSON.stringify(this.tables[tableName] || []));
    }

    /**
     * Reinicia todas las tablas y restaura la red a online.
     */
    resetStore() {
        this.isOnline = true;
        this.tables = {};
    }

    /**
     * Inicia una consulta PostgREST sobre la tabla especificada.
     */
    from(tableName: string) {
        if (!this.tables[tableName]) {
            this.tables[tableName] = [];
        }
        return new StatefulQueryBuilder(this, tableName, this.tables[tableName]);
    }

    /**
     * Mock de Supabase Storage.
     */
    storage = {
        from: (bucketName: string) => ({
            upload: async (path: string, _file: any) => {
                if (!this.isOnline) {
                    return { data: null, error: { message: 'FetchError: Network request failed', code: 'OFFLINE', status: 0 } };
                }
                return { data: { path: `${bucketName}/${path}` }, error: null };
            },
            getPublicUrl: (path: string) => ({
                data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/${bucketName}/${path}` }
            }),
            remove: async (_paths: string[]) => {
                if (!this.isOnline) {
                    return { data: null, error: { message: 'FetchError: Network request failed', code: 'OFFLINE', status: 0 } };
                }
                return { data: [], error: null };
            }
        })
    };

    /**
     * Mock de RPC.
     */
    async rpc(functionName: string, _args?: any) {
        if (!this.isOnline) {
            return { data: null, error: { message: 'FetchError: Network request failed', code: 'OFFLINE', status: 0 } };
        }
        return { data: { message: `RPC ${functionName} executed` }, error: null };
    }

    /**
     * Mock de Auth.
     */
    auth = {
        getUser: async () => {
            if (!this.isOnline) {
                return { data: { user: null }, error: { message: 'FetchError: Network request failed', code: 'OFFLINE', status: 0 } };
            }
            return { data: { user: { id: 'mock-user-001', email: 'test@pressfit.com' } }, error: null };
        },
        getSession: async () => {
            if (!this.isOnline) {
                return { data: { session: null }, error: { message: 'FetchError: Network request failed', code: 'OFFLINE', status: 0 } };
            }
            return { data: { session: { access_token: 'mock-token', user: { id: 'mock-user-001' } } }, error: null };
        },
        startAutoRefresh: () => {},
        stopAutoRefresh: () => {}
    };
}

class StatefulQueryBuilder {
    private client: StatefulSupabaseMockClient;
    private tableName: string;
    private tableRef: any[];
    private operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'UPSERT' | 'DELETE' = 'SELECT';
    private payload: any = null;
    private upsertOptions: any = null;
    private filters: Array<(item: any) => boolean> = [];
    private sortFn: ((a: any, b: any) => number) | null = null;
    private limitValue: number | null = null;
    private singleMode: 'SINGLE' | 'MAYBE_SINGLE' | 'LIST' = 'LIST';

    constructor(client: StatefulSupabaseMockClient, tableName: string, tableRef: any[]) {
        this.client = client;
        this.tableName = tableName;
        this.tableRef = tableRef;
    }

    select(_fields = '*') {
        if (this.operation !== 'INSERT' && this.operation !== 'UPDATE' && this.operation !== 'UPSERT' && this.operation !== 'DELETE') {
            this.operation = 'SELECT';
        }
        return this;
    }

    insert(values: any | any[]) {
        this.operation = 'INSERT';
        this.payload = Array.isArray(values) ? values : [values];
        return this;
    }

    update(values: any) {
        this.operation = 'UPDATE';
        this.payload = values;
        return this;
    }

    upsert(values: any | any[], options?: any) {
        this.operation = 'UPSERT';
        this.payload = Array.isArray(values) ? values : [values];
        this.upsertOptions = options;
        return this;
    }

    delete() {
        this.operation = 'DELETE';
        return this;
    }

    eq(column: string, value: any) {
        this.filters.push(item => item && item[column] === value);
        return this;
    }

    neq(column: string, value: any) {
        this.filters.push(item => item && item[column] !== value);
        return this;
    }

    in(column: string, values: any[]) {
        const valSet = new Set(values);
        this.filters.push(item => item && valSet.has(item[column]));
        return this;
    }

    is(column: string, value: any) {
        this.filters.push(item => item && item[column] === value);
        return this;
    }

    not(column: string, operator: string, value: any) {
        if (operator === 'is') {
            this.filters.push(item => item && item[column] !== value);
        } else if (operator === 'in') {
            const valSet = new Set(Array.isArray(value) ? value : [value]);
            this.filters.push(item => item && !valSet.has(item[column]));
        }
        return this;
    }

    gt(column: string, value: any) {
        this.filters.push(item => item && item[column] > value);
        return this;
    }

    gte(column: string, value: any) {
        this.filters.push(item => item && item[column] >= value);
        return this;
    }

    lt(column: string, value: any) {
        this.filters.push(item => item && item[column] < value);
        return this;
    }

    lte(column: string, value: any) {
        this.filters.push(item => item && item[column] <= value);
        return this;
    }

    order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
        this.sortFn = (a, b) => {
            if (a[column] < b[column]) return ascending ? -1 : 1;
            if (a[column] > b[column]) return ascending ? 1 : -1;
            return 0;
        };
        return this;
    }

    limit(count: number) {
        this.limitValue = count;
        return this;
    }

    single() {
        this.singleMode = 'SINGLE';
        return this;
    }

    maybeSingle() {
        this.singleMode = 'MAYBE_SINGLE';
        return this;
    }

    private executeQuery(): PostgrestResponse<any> {
        if (!this.client.isNetworkOnline()) {
            return {
                data: null,
                error: {
                    message: 'FetchError: Network request failed',
                    code: 'OFFLINE',
                    status: 0,
                }
            };
        }

        let workingSet = [...this.tableRef];

        // Apply filters
        if (this.filters.length > 0) {
            workingSet = workingSet.filter(item => this.filters.every(fn => fn(item)));
        }

        let resultData: any = null;

        switch (this.operation) {
            case 'SELECT': {
                if (this.sortFn) {
                    workingSet.sort(this.sortFn);
                }
                if (this.limitValue !== null) {
                    workingSet = workingSet.slice(0, this.limitValue);
                }
                resultData = workingSet;
                break;
            }

            case 'INSERT': {
                const newItems = this.payload.map((item: any) => ({
                    id: item.id || `id-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    created_at: item.created_at || new Date().toISOString(),
                    ...item
                }));
                this.tableRef.push(...newItems);
                resultData = newItems;
                break;
            }

            case 'UPDATE': {
                const updatedItems: any[] = [];
                this.tableRef.forEach((item, index) => {
                    const matches = this.filters.length === 0 || this.filters.every(fn => fn(item));
                    if (matches) {
                        const updated = { ...item, ...this.payload, updated_at: new Date().toISOString() };
                        this.tableRef[index] = updated;
                        updatedItems.push(updated);
                    }
                });
                resultData = updatedItems;
                break;
            }

            case 'UPSERT': {
                const upserted: any[] = [];
                const conflictCol = this.upsertOptions?.onConflict || 'id';

                for (const item of this.payload) {
                    const existingIdx = this.tableRef.findIndex(e => e[conflictCol] === item[conflictCol]);
                    if (existingIdx >= 0) {
                        const updated = { ...this.tableRef[existingIdx], ...item, updated_at: new Date().toISOString() };
                        this.tableRef[existingIdx] = updated;
                        upserted.push(updated);
                    } else {
                        const newItem = {
                            id: item.id || `id-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            created_at: new Date().toISOString(),
                            ...item
                        };
                        this.tableRef.push(newItem);
                        upserted.push(newItem);
                    }
                }
                resultData = upserted;
                break;
            }

            case 'DELETE': {
                const deleted: any[] = [];
                for (let i = this.tableRef.length - 1; i >= 0; i--) {
                    const item = this.tableRef[i];
                    if (this.filters.length === 0 || this.filters.every(fn => fn(item))) {
                        deleted.push(item);
                        this.tableRef.splice(i, 1);
                    }
                }
                resultData = deleted;
                break;
            }
        }

        if (this.singleMode === 'SINGLE') {
            if (!Array.isArray(resultData) || resultData.length === 0) {
                return {
                    data: null,
                    error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116', status: 406 }
                };
            }
            return { data: resultData[0], error: null };
        }

        if (this.singleMode === 'MAYBE_SINGLE') {
            if (!Array.isArray(resultData) || resultData.length === 0) {
                return { data: null, error: null };
            }
            return { data: resultData[0], error: null };
        }

        return { data: resultData, error: null };
    }

    // Promise interface to allow async/await
    then(onfulfilled?: (value: PostgrestResponse<any>) => any, onrejected?: (reason: any) => any): Promise<any> {
        const result = this.executeQuery();
        return Promise.resolve(result).then(onfulfilled, onrejected);
    }
}

export const createSupabaseMockClient = (): StatefulSupabaseMockClient => {
    return new StatefulSupabaseMockClient();
};
