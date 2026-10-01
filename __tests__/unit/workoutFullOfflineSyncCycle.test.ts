import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutService } from '../../src/services/WorkoutService';
import { WorkoutOfflineService } from '../../src/services/WorkoutOfflineService';
import { OfflineStorageService } from '../../src/services/OfflineStorageService';
import { SyncService, PendingSyncOperation } from '../../src/services/SyncService';
import { NetworkService } from '../../src/services/NetworkService';
import { StatefulSupabaseMockClient, createSupabaseMockClient } from '../mocks/supabaseMockClient';
import { supabase } from '../../src/lib/supabase';
import { RoutineDay, Serie } from '../../src/types/models';

jest.mock('../../src/services/NetworkService', () => ({
    NetworkService: {
        isOffline: jest.fn(),
        getNetworkState: jest.fn(),
        addNetworkListener: jest.fn(),
    },
}));

describe('Workout Full Offline & Sync Cycle Integration (PF-431)', () => {
    let mockSupabase: StatefulSupabaseMockClient;

    const initialWorkout: RoutineDay = {
        id: 'workout-full-cycle-1',
        rutina_semanal_id: 'routine-weekly-1',
        nombre_dia: 'Pecho y Tríceps',
        fecha_dia: '2026-10-01',
        hora_inicio: '2026-10-01T10:00:00.000Z',
        hora_fin: undefined,
        completada: false,
        ejercicios_programados: [
            {
                id: 'ep-1',
                rutina_diaria_id: 'workout-full-cycle-1',
                ejercicio_id: 'ex-press-banca',
                orden_ejecucion: 1,
                tipo_peso: 'total',
                series: [
                    {
                        id: 'set-1',
                        ejercicio_programado_id: 'ep-1',
                        numero_serie: 1,
                        peso_utilizado: 80,
                        repeticiones: 10,
                        is_completed: false,
                        completada: false,
                        tipo_serie: 'normal',
                    },
                    {
                        id: 'set-2',
                        ejercicio_programado_id: 'ep-1',
                        numero_serie: 2,
                        peso_utilizado: 80,
                        repeticiones: 8,
                        is_completed: false,
                        completada: false,
                        tipo_serie: 'normal',
                    },
                ],
            },
        ],
    };

    const initialSeries = [
        {
            id: 'set-1',
            ejercicio_programado_id: 'ep-1',
            numero_serie: 1,
            peso_utilizado: 80,
            repeticiones: 10,
            is_completed: false,
            completada: false,
            tipo_serie: 'normal',
            updated_at: '2026-10-01T10:00:00.000Z',
        },
        {
            id: 'set-2',
            ejercicio_programado_id: 'ep-1',
            numero_serie: 2,
            peso_utilizado: 80,
            repeticiones: 8,
            is_completed: false,
            completada: false,
            tipo_serie: 'normal',
            updated_at: '2026-10-01T10:00:00.000Z',
        },
    ];

    const initialWorkoutsTable = [
        {
            ...initialWorkout,
            hora_fin: null,
            completada: false,
        },
    ];

    beforeEach(async () => {
        jest.clearAllMocks();
        await OfflineStorageService.clearAllCache();
        await SyncService.clearQueue();
        await SyncService.clearDeadLetterQueue();

        mockSupabase = createSupabaseMockClient();
        mockSupabase.seedTable('rutinas_diarias', initialWorkoutsTable);
        mockSupabase.seedTable('series', initialSeries);

        // Spy on supabase.from to forward queries to our stateful mock client
        jest.spyOn(supabase, 'from').mockImplementation((table: string) => {
            return mockSupabase.from(table) as any;
        });

        // Default: Network online
        (NetworkService.isOffline as jest.Mock).mockResolvedValue(false);
        (NetworkService.getNetworkState as jest.Mock).mockResolvedValue({
            isConnected: true,
            isInternetReachable: true,
            isOffline: false,
            type: 'WIFI',
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Ciclo Completo: Online ➔ Offline ➔ Mutaciones ➔ Reconexión ➔ Sync', () => {
        it('debe ejecutar el ciclo íntegro guardando en caché y vaciando la cola de sincronización tras recuperar conexión', async () => {
            // 1. Paso 1: Iniciar y cachear el entrenamiento estando online
            await OfflineStorageService.saveWorkouts([initialWorkout]);
            const initialDetails = await WorkoutService.getWorkoutDetails('workout-full-cycle-1');
            expect(initialDetails.data).toBeDefined();
            expect(initialDetails.data?.completada).toBe(false);

            // 2. Paso 2: El usuario entra al gimnasio y PIERDE la conexión
            mockSupabase.disconnect();
            (NetworkService.isOffline as jest.Mock).mockResolvedValue(true);
            (NetworkService.getNetworkState as jest.Mock).mockResolvedValue({
                isConnected: false,
                isInternetReachable: false,
                isOffline: true,
                type: 'NONE',
            });

            // 3. Paso 3: El usuario entrena sin conexión, actualiza series y marca completada
            const update1 = await WorkoutService.updateSet('set-1', {
                weight: 90,
                reps: 10,
                is_completed: true,
            });
            expect(update1.error).toBeNull();
            expect(update1.data).toBeDefined();

            const update2 = await WorkoutService.updateSet('set-2', {
                weight: 95,
                reps: 8,
                is_completed: true,
            });
            expect(update2.error).toBeNull();
            expect(update2.data).toBeDefined();

            // 4. Paso 4: Finaliza el entrenamiento sin conexión
            const completeRes = await WorkoutService.completeWorkout('workout-full-cycle-1', 45, '2026-10-01T10:45:00.000Z');
            expect(completeRes.error).toBeNull();
            expect(completeRes.data?.completada).toBe(true);

            // 5. Verificar estado Offline en disco
            // A. Caché local en AsyncStorage actualizada inmediatamente
            const cachedRes = await OfflineStorageService.getCachedWorkouts();
            const cachedWorkout = cachedRes.data?.find((w) => w.id === 'workout-full-cycle-1');
            expect(cachedWorkout?.completada).toBe(true);
            const cachedSeries = cachedWorkout?.ejercicios_programados?.[0]?.series;
            expect(cachedSeries?.[0]?.peso_utilizado).toBe(90);
            expect(cachedSeries?.[0]?.is_completed).toBe(true);
            expect(cachedSeries?.[1]?.peso_utilizado).toBe(95);
            expect(cachedSeries?.[1]?.is_completed).toBe(true);

            // B. Cola de operaciones de sincronización pendiente
            const queueRes = await SyncService.getQueue();
            const pendingQueue = queueRes.data || [];
            expect(pendingQueue).toHaveLength(3);
            expect(pendingQueue[0].type).toBe('SET_UPSERT');
            expect((pendingQueue[0].payload as any).setId).toBe('set-1');
            expect((pendingQueue[0].payload as any).dbUpdates.peso_utilizado).toBe(90);

            expect(pendingQueue[1].type).toBe('SET_UPSERT');
            expect((pendingQueue[1].payload as any).setId).toBe('set-2');
            expect((pendingQueue[1].payload as any).dbUpdates.peso_utilizado).toBe(95);

            expect(pendingQueue[2].type).toBe('WORKOUT_COMPLETE');
            expect((pendingQueue[2].payload as any).workoutId).toBe('workout-full-cycle-1');

            // C. La base de datos remota NO ha sido modificada todavía (estaba desconectada)
            const remoteSeriesBefore = mockSupabase.getTableData('series');
            expect(remoteSeriesBefore.find((s) => s.id === 'set-1')?.peso_utilizado).toBe(80);

            // 6. Paso 5: SE RECUPERA LA CONEXIÓN
            mockSupabase.reconnect();
            (NetworkService.isOffline as jest.Mock).mockResolvedValue(false);
            (NetworkService.getNetworkState as jest.Mock).mockResolvedValue({
                isConnected: true,
                isInternetReachable: true,
                isOffline: false,
                type: 'WIFI',
            });

            // 7. Paso 6: Ejecutar proceso de sincronización diferida (FIFO)
            const syncExecutor = async (op: PendingSyncOperation): Promise<boolean> => {
                if (op.type === 'SET_UPSERT') {
                    const payload = op.payload as { setId: string; dbUpdates: any };
                    const { error } = await supabase
                        .from('series')
                        .update(payload.dbUpdates)
                        .eq('id', payload.setId);
                    return !error;
                }
                if (op.type === 'WORKOUT_COMPLETE') {
                    const payload = op.payload as { workoutId: string; customEndTime?: string };
                    const { error } = await supabase
                        .from('rutinas_diarias')
                        .update({ completada: true, hora_fin: payload.customEndTime })
                        .eq('id', payload.workoutId);
                    return !error;
                }
                return true;
            };

            const processResult = await SyncService.processQueue(syncExecutor);
            expect(processResult.error).toBeNull();
            expect(processResult.data?.processed).toBe(3);
            expect(processResult.data?.failed).toBe(0);

            // 8. Paso 7: Verificaciones finales tras la sincronización
            // A. Cola de sincronización completamente vaciada
            const queueAfterSync = await SyncService.getQueue();
            expect(queueAfterSync.data).toHaveLength(0);

            // B. Datos remotos en Supabase actualizados correctamente con los valores offline
            const remoteSeriesAfter = mockSupabase.getTableData('series');
            const set1Remote = remoteSeriesAfter.find((s) => s.id === 'set-1');
            expect(set1Remote?.peso_utilizado).toBe(90);
            expect(set1Remote?.repeticiones).toBe(10);
            expect(set1Remote?.is_completed).toBe(true);

            const set2Remote = remoteSeriesAfter.find((s) => s.id === 'set-2');
            expect(set2Remote?.peso_utilizado).toBe(95);
            expect(set2Remote?.repeticiones).toBe(8);
            expect(set2Remote?.is_completed).toBe(true);

            const remoteWorkoutsAfter = mockSupabase.getTableData('rutinas_diarias');
            const workoutRemote = remoteWorkoutsAfter.find((w) => w.id === 'workout-full-cycle-1');
            expect(workoutRemote?.completada).toBe(true);
            expect(workoutRemote?.hora_fin).toBe('2026-10-01T10:45:00.000Z');
        });
    });

    describe('Resolución de Conflictos (LWW) y Reconciliación de Caché', () => {
        it('debe dar prioridad a la escritura local más reciente cuando localTime > remoteTime', () => {
            const localSet = {
                id: 'set-conflict-1',
                peso_utilizado: 100,
                updated_at: '2026-10-01T12:00:00.000Z',
            };
            const remoteSet = {
                id: 'set-conflict-1',
                peso_utilizado: 90,
                updated_at: '2026-10-01T11:00:00.000Z',
            };

            const conflictResult = SyncService.resolveConflict(localSet, remoteSet, 'LAST_WRITE_WINS');
            expect(conflictResult.isConflict).toBe(true);
            expect(conflictResult.winner).toBe('LOCAL');
            expect(conflictResult.resolved.peso_utilizado).toBe(100);
        });

        it('debe dar prioridad al servidor si remoteTime > localTime', () => {
            const localSet = {
                id: 'set-conflict-1',
                peso_utilizado: 80,
                updated_at: '2026-10-01T10:00:00.000Z',
            };
            const remoteSet = {
                id: 'set-conflict-1',
                peso_utilizado: 85,
                updated_at: '2026-10-01T10:30:00.000Z',
            };

            const conflictResult = SyncService.resolveConflict(localSet, remoteSet, 'LAST_WRITE_WINS');
            expect(conflictResult.winner).toBe('REMOTE');
            expect(conflictResult.resolved.peso_utilizado).toBe(85);
        });

        it('deduplicateEntities debe conservar la entidad con timestamp más reciente', () => {
            const entries = [
                { id: 'set-1', peso_utilizado: 80, updated_at: '2026-10-01T09:00:00.000Z' },
                { id: 'set-1', peso_utilizado: 85, updated_at: '2026-10-01T09:30:00.000Z' },
                { id: 'set-2', peso_utilizado: 60, updated_at: '2026-10-01T09:00:00.000Z' },
            ];

            const deduped = SyncService.deduplicateEntities(entries);
            expect(deduped).toHaveLength(2);
            const set1 = deduped.find((s) => s.id === 'set-1');
            expect(set1?.peso_utilizado).toBe(85);
        });

        it('reconcileCachedSeries debe preservar las series completadas localmente si la consulta remota es obsoleta', () => {
            const currentCached: RoutineDay[] = [
                {
                    id: 'workout-reconcile-1',
                    ejercicios_programados: [
                        {
                            id: 'ep-1',
                            series: [
                                {
                                    id: 'set-r1',
                                    is_completed: true,
                                    completada: true,
                                    peso_utilizado: 90,
                                    repeticiones: 10,
                                } as Serie,
                            ],
                        } as any,
                    ],
                } as RoutineDay,
            ];

            const remoteOutdatedData: RoutineDay = {
                id: 'workout-reconcile-1',
                ejercicios_programados: [
                    {
                        id: 'ep-1',
                        series: [
                            {
                                id: 'set-r1',
                                is_completed: false,
                                completada: false,
                                peso_utilizado: 80,
                                repeticiones: 8,
                            } as Serie,
                        ],
                    } as any,
                ],
            } as RoutineDay;

            WorkoutOfflineService.reconcileCachedSeries(remoteOutdatedData, currentCached, 'workout-reconcile-1');

            const reconciledSet = remoteOutdatedData.ejercicios_programados?.[0]?.series?.[0];
            expect(reconciledSet?.is_completed).toBe(true);
            expect(reconciledSet?.peso_utilizado).toBe(80);
        });
    });

    describe('Retroceso Exponencial y Dead Letter Queue (DLQ)', () => {
        it('debe calcular retroceso exponencial de 2s a 32s y limitar a 60s', () => {
            expect(SyncService.calculateBackoff(0)).toBe(2000);   // 2s
            expect(SyncService.calculateBackoff(1)).toBe(4000);   // 4s
            expect(SyncService.calculateBackoff(2)).toBe(8000);   // 8s
            expect(SyncService.calculateBackoff(3)).toBe(16000);  // 16s
            expect(SyncService.calculateBackoff(4)).toBe(32000);  // 32s
            expect(SyncService.calculateBackoff(5)).toBe(60000);  // 60s cap
            expect(SyncService.calculateBackoff(10)).toBe(60000); // 60s cap
        });

        it('debe mantener la operación en cola con backoff si el ejecutor falla transitoriamente', async () => {
            await SyncService.enqueueOperation('SET_UPSERT', { setId: 's-fail-1', dbUpdates: { peso_utilizado: 100 } });

            const failingExecutor = jest.fn().mockResolvedValue(false);
            const result = await SyncService.processQueue(failingExecutor);

            expect(result.data?.failed).toBe(1);
            expect(result.data?.processed).toBe(0);

            const queue = (await SyncService.getQueue()).data || [];
            expect(queue).toHaveLength(1);
            expect(queue[0].attempts).toBe(1);
            expect(queue[0].nextRetryTimestamp).toBeGreaterThan(Date.now());
        });

        it('debe mover la operación a Dead Letter Queue tras 5 intentos fallidos consecutivos', async () => {
            // Se inserta una operación con 4 intentos ya fallidos
            const pendingOp: PendingSyncOperation = {
                id: 'op-dlq-test-1',
                type: 'SET_UPSERT',
                payload: { setId: 's-dlq-1', dbUpdates: { peso_utilizado: 100 } },
                timestamp: Date.now(),
                attempts: 4,
            };

            await AsyncStorage.setItem(
                SyncService.SYNC_QUEUE_STORAGE_KEY,
                JSON.stringify([pendingOp])
            );

            // Al fallar el intento 5 (>= MAX_SYNC_RETRIES), debe moverse inmediatamente a DLQ
            const failingExecutor = jest.fn().mockResolvedValue(false);
            const res = await SyncService.processQueue(failingExecutor);

            expect(res.data?.failed).toBe(1);

            // La cola principal ya no debe tener la operación
            const remainingQueue = (await SyncService.getQueue()).data || [];
            expect(remainingQueue).toHaveLength(0);

            // Debe estar en Dead Letter Queue
            const dlq = (await SyncService.getDeadLetterQueue()).data || [];
            expect(dlq).toHaveLength(1);
            expect(dlq[0].id).toBe('op-dlq-test-1');
            expect(dlq[0].attempts).toBe(5);
        });
    });
});
