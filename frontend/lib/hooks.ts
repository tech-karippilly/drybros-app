import { useDispatch, useSelector, useStore } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch, AppStore } from './store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore: () => AppStore = useStore;

// Export reusable hooks
export { useFiltering } from './hooks/useFiltering';
export { usePagination } from './hooks/usePagination';
export type { FilterConfig, UseFilteringOptions } from './hooks/useFiltering';
export type { UsePaginationOptions, PaginationResult } from './hooks/usePagination';
