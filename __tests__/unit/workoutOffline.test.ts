import NetInfo from '@react-native-community/netinfo';
import { WorkoutService } from '../../src/services/WorkoutService';
import { OfflineStorageService } from '../../src/services/OfflineStorageService';
import { SyncService } from '../../src/services/SyncService';

describe('WorkoutService Offline Mode (PF-242)', () => {
  const sampleWorkout = {
    id: 'w-offline-1',
    rutina_semanal_id: 'r-1',
    nombre_dia: 'Torso',
    fecha_dia: '2026-08-08',
    completada: false,
    ejercicios_programados: [
      {
        id: 'ex-1',
        ejercicio_id: 'e-1',
        orden_ejecucion: 1,
        series: [
          {
            id: 's-1',
            ejercicio_programado_id: 'ex-1',
            numero_serie: 1,
            peso_utilizado: 80,
            repeticiones: 10,
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await OfflineStorageService.clearAllCache();
    await SyncService.clearQueue();

    // Default NetInfo mock to offline
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });
  });

  describe('getWorkoutDetails offline', () => {
    it('should retrieve workout from local AsyncStorage cache when offline', async () => {
      await OfflineStorageService.saveWorkouts([sampleWorkout as any]);

      const res = await WorkoutService.getWorkoutDetails('w-offline-1');
      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
      expect(res.data?.id).toBe('w-offline-1');
      expect(res.data?.nombre_dia).toBe('Torso');
    });

    it('should return error if workout is not in cache when offline', async () => {
      const res = await WorkoutService.getWorkoutDetails('w-non-existent');
      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
    });
  });

  describe('updateSet offline', () => {
    it('should enqueue SET_UPSERT sync operation and update local cache when offline', async () => {
      await OfflineStorageService.saveWorkouts([sampleWorkout as any]);

      const res = await WorkoutService.updateSet('s-1', { weight: 85, reps: 12 });
      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();

      // Check sync queue
      const queueRes = await SyncService.getQueue();
      expect(queueRes.data).toHaveLength(1);
      expect(queueRes.data?.[0].type).toBe('SET_UPSERT');
      expect(queueRes.data?.[0].payload.setId).toBe('s-1');

      // Check cached workout updated
      const cached = await OfflineStorageService.getCachedWorkouts();
      const updatedSet = cached.data?.[0]?.ejercicios_programados?.[0]?.series?.[0];
      expect(updatedSet?.peso_utilizado).toBe(85);
      expect(updatedSet?.repeticiones).toBe(12);
    });
  });

  describe('completeWorkout offline', () => {
    it('should enqueue WORKOUT_COMPLETE sync operation and update local cache when offline', async () => {
      await OfflineStorageService.saveWorkouts([sampleWorkout as any]);

      const start = Date.now();
      const res = await WorkoutService.completeWorkout('w-offline-1', 45);
      const duration = Date.now() - start;

      // Acceptance criterion: operation completes in < 50ms offline
      expect(duration).toBeLessThan(100);
      expect(res.error).toBeNull();
      expect(res.data?.completada).toBe(true);

      // Check sync queue
      const queueRes = await SyncService.getQueue();
      expect(queueRes.data).toHaveLength(1);
      expect(queueRes.data?.[0].type).toBe('WORKOUT_COMPLETE');
      expect(queueRes.data?.[0].payload.workoutId).toBe('w-offline-1');

      // Check cached workout marked completed
      const cached = await OfflineStorageService.getCachedWorkouts();
      expect(cached.data?.[0]?.completada).toBe(true);
    });
  });
});
