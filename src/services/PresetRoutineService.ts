import rawPresets from '../assets/data/presetRoutines.json';
import {
    PresetRoutine,
    PresetFilterOptions,
    ServiceResponse,
} from '../types/models';

/**
 * Service for accessing pre-defined seed workout routines.
 * Operating on bundled local JSON assets ensures 100% offline access,
 * zero latency, and seamless backward compatibility.
 */

const presetRoutines: PresetRoutine[] = rawPresets as PresetRoutine[];

export const PresetRoutineService = {
    /**
     * Retrieves all available preset routines.
     */
    getAllPresets(): ServiceResponse<PresetRoutine[]> {
        try {
            return {
                data: presetRoutines,
                error: null,
            };
        } catch (error) {
            return {
                data: null,
                error,
            };
        }
    },

    /**
     * Retrieves a single preset routine by its unique ID.
     * @param id Unique identifier of the preset routine (e.g., 'preset-ppl-6d')
     */
    getPresetById(id: string): ServiceResponse<PresetRoutine | null> {
        try {
            const found = presetRoutines.find((preset) => preset.id === id) || null;
            return {
                data: found,
                error: null,
            };
        } catch (error) {
            return {
                data: null,
                error,
            };
        }
    },

    /**
     * Filters preset routines based on criteria such as category, days per week, or level.
     * @param options Object containing filtering criteria
     */
    filterPresets(options: PresetFilterOptions): ServiceResponse<PresetRoutine[]> {
        try {
            let filtered = [...presetRoutines];

            if (options.categoria) {
                filtered = filtered.filter(
                    (routine) =>
                        routine.categoria.toLowerCase() === options.categoria?.toLowerCase()
                );
            }

            if (options.dias_por_semana) {
                filtered = filtered.filter(
                    (routine) => routine.dias_por_semana === options.dias_por_semana
                );
            }

            if (options.nivel) {
                filtered = filtered.filter(
                    (routine) =>
                        routine.nivel.toLowerCase() === options.nivel?.toLowerCase()
                );
            }

            return {
                data: filtered,
                error: null,
            };
        } catch (error) {
            return {
                data: null,
                error,
            };
        }
    },
};
