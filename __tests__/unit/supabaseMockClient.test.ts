import { StatefulSupabaseMockClient, createSupabaseMockClient } from '../mocks/supabaseMockClient';

describe('StatefulSupabaseMockClient Harness', () => {
    let client: StatefulSupabaseMockClient;

    beforeEach(() => {
        client = createSupabaseMockClient();
    });

    describe('Network State Toggling (Online / Offline)', () => {
        it('should start in online mode by default', () => {
            expect(client.isNetworkOnline()).toBe(true);
        });

        it('should toggle to offline mode when disconnect() is called', async () => {
            client.disconnect();
            expect(client.isNetworkOnline()).toBe(false);

            const { data, error } = await client.from('ejercicios').select();
            expect(data).toBeNull();
            expect(error).not.toBeNull();
            expect(error?.code).toBe('OFFLINE');
            expect(error?.message).toContain('Network request failed');
        });

        it('should restore network operation when reconnect() is called', async () => {
            client.seedTable('ejercicios', [{ id: 'ex-1', titulo: 'Press de Banca' }]);
            client.disconnect();

            const offlineRes = await client.from('ejercicios').select();
            expect(offlineRes.error?.code).toBe('OFFLINE');

            client.reconnect();
            expect(client.isNetworkOnline()).toBe(true);

            const onlineRes = await client.from('ejercicios').select();
            expect(onlineRes.error).toBeNull();
            expect(onlineRes.data).toHaveLength(1);
            expect(onlineRes.data[0].titulo).toBe('Press de Banca');
        });

        it('should return network error for storage and rpc when offline', async () => {
            client.disconnect();

            const storageRes = await client.storage.from('photos').upload('test.png', {});
            expect(storageRes.error?.code).toBe('OFFLINE');

            const rpcRes = await client.rpc('get_user_stats');
            expect(rpcRes.error?.code).toBe('OFFLINE');

            const authRes = await client.auth.getUser();
            expect(authRes.error?.code).toBe('OFFLINE');
        });
    });

    describe('Stateful In-Memory CRUD Operations', () => {
        it('should insert items into memory table and retrieve with select', async () => {
            const insertRes = await client.from('rutinas').insert({
                id: 'rut-1',
                nombre: 'Rutina Fuerza'
            });

            expect(insertRes.error).toBeNull();
            expect(insertRes.data).toHaveLength(1);
            expect(insertRes.data[0].nombre).toBe('Rutina Fuerza');

            const selectRes = await client.from('rutinas').select();
            expect(selectRes.data).toHaveLength(1);
            expect(selectRes.data[0].id).toBe('rut-1');
        });

        it('should filter items with eq, neq, in and gt', async () => {
            client.seedTable('series', [
                { id: 's1', peso: 50, reps: 10 },
                { id: 's2', peso: 80, reps: 8 },
                { id: 's3', peso: 100, reps: 5 },
            ]);

            const eqRes = await client.from('series').select().eq('peso', 80);
            expect(eqRes.data).toHaveLength(1);
            expect(eqRes.data[0].id).toBe('s2');

            const gtRes = await client.from('series').select().gt('peso', 60);
            expect(gtRes.data).toHaveLength(2);

            const inRes = await client.from('series').select().in('id', ['s1', 's3']);
            expect(inRes.data).toHaveLength(2);
        });

        it('should update matching items in memory', async () => {
            client.seedTable('rutinas_diarias', [
                { id: 'day-1', completada: false, nombre: 'Pierna' }
            ]);

            const updateRes = await client.from('rutinas_diarias')
                .update({ completada: true })
                .eq('id', 'day-1');

            expect(updateRes.error).toBeNull();
            expect(updateRes.data[0].completada).toBe(true);

            const tableData = client.getTableData('rutinas_diarias');
            expect(tableData[0].completada).toBe(true);
            expect(tableData[0].updated_at).toBeDefined();
        });

        it('should upsert items correctly (update existing, insert new)', async () => {
            client.seedTable('notas', [
                { id: 'n1', contenido: 'Nota 1' }
            ]);

            const upsertRes = await client.from('notas').upsert([
                { id: 'n1', contenido: 'Nota 1 Editada' },
                { id: 'n2', contenido: 'Nota 2 Nueva' }
            ], { onConflict: 'id' });

            expect(upsertRes.error).toBeNull();
            expect(upsertRes.data).toHaveLength(2);

            const allData = client.getTableData('notas');
            expect(allData).toHaveLength(2);
            expect(allData.find(x => x.id === 'n1')?.contenido).toBe('Nota 1 Editada');
        });

        it('should delete matching items in memory', async () => {
            client.seedTable('items', [
                { id: 'i1', val: 10 },
                { id: 'i2', val: 20 },
            ]);

            const deleteRes = await client.from('items').delete().eq('id', 'i1');
            expect(deleteRes.error).toBeNull();
            expect(deleteRes.data).toHaveLength(1);

            const remaining = client.getTableData('items');
            expect(remaining).toHaveLength(1);
            expect(remaining[0].id).toBe('i2');
        });

        it('should handle single() and maybeSingle() correctly', async () => {
            client.seedTable('usuarios', [
                { id: 'u1', nombre: 'Carlos' }
            ]);

            const singleRes = await client.from('usuarios').select().eq('id', 'u1').single();
            expect(singleRes.error).toBeNull();
            expect(singleRes.data.nombre).toBe('Carlos');

            const missingSingle = await client.from('usuarios').select().eq('id', 'u999').single();
            expect(missingSingle.error).not.toBeNull();
            expect(missingSingle.error?.code).toBe('PGRST116');

            const maybeSingleMissing = await client.from('usuarios').select().eq('id', 'u999').maybeSingle();
            expect(maybeSingleMissing.error).toBeNull();
            expect(maybeSingleMissing.data).toBeNull();
        });
    });
});
