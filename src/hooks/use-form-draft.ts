'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';

/**
 * Hook that persists form draft data to localStorage.
 * Restores draft synchronously on first render, and saves changes with debouncing.
 * Only activates when `enabled` is true (typically for creation mode, not editing).
 */
export function useFormDraft<T extends FieldValues>(
    form: UseFormReturn<T>,
    storageKey: string,
    enabled: boolean = true
) {
    const hasRestoredRef = useRef(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Restore draft synchronously on first call (not in useEffect, to avoid race conditions)
    if (enabled && !hasRestoredRef.current) {
        hasRestoredRef.current = true;
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                const restored = restoreDates(parsed);
                // Schedule the reset for after the current render via queueMicrotask
                // This ensures it runs before useEffect cleanups but after initial render
                const currentValues = form.getValues();
                const mergedValues = { ...currentValues, ...restored } as T;
                // Use setTimeout(0) to run after React's batch of useEffect calls
                // This ensures our restore runs AFTER any other useEffects that reset the form
                setTimeout(() => {
                    form.reset(mergedValues);
                }, 0);
            }
        } catch (e) {
            console.warn(`[useFormDraft] Failed to restore draft for "${storageKey}":`, e);
            localStorage.removeItem(storageKey);
        }
    }

    // Watch form values and save to localStorage (debounced)
    useEffect(() => {
        if (!enabled) return;

        const subscription = form.watch((values) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = setTimeout(() => {
                try {
                    const serializable = prepareForStorage(values);
                    localStorage.setItem(storageKey, JSON.stringify(serializable));
                } catch (e) {
                    console.warn(`[useFormDraft] Failed to save draft for "${storageKey}":`, e);
                }
            }, 500);
        });

        return () => {
            subscription.unsubscribe();
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [enabled, storageKey, form]);

    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
        } catch (e) {
            // Silently ignore
        }
    }, [storageKey]);

    return { clearDraft };
}

/**
 * Recursively convert Date objects to ISO strings for JSON serialization,
 * and mark them with a special key so we can restore them.
 */
function prepareForStorage(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) {
        return { __type: 'Date', __value: obj.toISOString() };
    }
    if (Array.isArray(obj)) {
        return obj.map(prepareForStorage);
    }
    if (typeof obj === 'object') {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = prepareForStorage(value);
        }
        return result;
    }
    return obj;
}

/**
 * Recursively restore Date objects from their serialized form.
 */
function restoreDates(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'object' && obj.__type === 'Date' && obj.__value) {
        return new Date(obj.__value);
    }
    if (Array.isArray(obj)) {
        return obj.map(restoreDates);
    }
    if (typeof obj === 'object') {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = restoreDates(value);
        }
        return result;
    }
    return obj;
}
