import { useMemo, useState, useCallback } from 'react';

export interface UsePaginationOptions<T> {
    items: T[];
    itemsPerPage: number;
    initialPage?: number;
}

export interface PaginationResult<T> {
    paginatedItems: T[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    setItemsPerPage: (itemsPerPage: number) => void;
}

/**
 * Reusable hook for pagination
 */
export function usePagination<T>({
    items,
    itemsPerPage: initialItemsPerPage,
    initialPage = 1,
}: UsePaginationOptions<T>): PaginationResult<T> {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

    const totalPages = useMemo(() => {
        return Math.ceil(items.length / itemsPerPage);
    }, [items.length, itemsPerPage]);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return items.slice(start, end);
    }, [items, currentPage, itemsPerPage]);

    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);

    const nextPage = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    }, [currentPage, totalPages]);

    const prevPage = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    }, [currentPage]);

    const handleSetItemsPerPage = useCallback((newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    }, []);

    return {
        paginatedItems,
        currentPage,
        totalPages,
        totalItems: items.length,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        goToPage,
        nextPage,
        prevPage,
        setItemsPerPage: handleSetItemsPerPage,
    };
}
