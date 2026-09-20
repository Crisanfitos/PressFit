import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseWorkoutTimerReturn {
    timer: number;
    isTimerRunning: boolean;
    startTimer: () => void;
    stopTimer: () => void;
    resetTimer: () => void;
    setTimer: React.Dispatch<React.SetStateAction<number>>;
    setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useWorkoutTimer = (initialSeconds: number = 0): UseWorkoutTimerReturn => {
    const [timer, setTimer] = useState<number>(initialSeconds);
    const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
    const timerInterval = useRef<NodeJS.Timeout | null>(null);

    const startTimer = useCallback(() => {
        setIsTimerRunning(true);
    }, []);

    const stopTimer = useCallback(() => {
        setIsTimerRunning(false);
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
    }, []);

    const resetTimer = useCallback(() => {
        stopTimer();
        setTimer(0);
    }, [stopTimer]);

    useEffect(() => {
        if (isTimerRunning) {
            timerInterval.current = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
                timerInterval.current = null;
            }
        }
        return () => {
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
                timerInterval.current = null;
            }
        };
    }, [isTimerRunning]);

    return {
        timer,
        isTimerRunning,
        startTimer,
        stopTimer,
        resetTimer,
        setTimer,
        setIsTimerRunning,
    };
};
