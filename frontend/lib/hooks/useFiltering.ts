import { useMemo, useState, useCallback } from 'react';

export interface FilterConfig<T> {
    [key: string]: (item: T, value: any) => boolean;
}

export interface UseFilteringOptions<T> {
    items: T[];
    filters: Record<string, any>;
    filterConfig: FilterConfig<T>;
}

/**
 * Reusable hook for filtering items based on multiple criteria
 */
export function useFiltering<T>({ items, filters, filterConfig }: UseFilteringOptions<T>) {
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            return Object.entries(filters).every(([key, value]) => {
                // Skip empty filters
                if (value === '' || value === null || value === undefined || value === 'all') {
                    return true;
                }
                
                const filterFn = filterConfig[key];
                if (!filterFn) {
                    return true; // No filter configured for this key
                }
                
                return filterFn(item, value);
            });
        });
    }, [items, filters, filterConfig]);

    return filteredItems;
}
