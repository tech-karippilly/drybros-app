"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { setSelectedFranchise } from "@/lib/features/franchise/franchiseSlice";
import { FRANCHISE_STRINGS } from "@/lib/constants/franchise";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";
import {
    Eye,
    Edit2,
    Plus,
    Filter as FilterIcon,
    ChevronLeft,
    ChevronRight,
    X,
    Search,
    Ban,
    CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Franchise } from "@/lib/types/franchise";

const AVATAR_COLORS = [
    "bg-theme-blue/10 text-theme-blue",
    "bg-orange-500/10 text-orange-500",
    "bg-blue-500/10 text-blue-500",
    "bg-slate-500/10 text-slate-500",
    "bg-purple-500/10 text-purple-500",
] as const;

function getInitials(name: string, fallback = "?"): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
    if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0]?.[0] ?? fallback).toUpperCase();
}

function getAvatarColor(index: number): string {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function FranchiseList() {
    const { list } = useAppSelector((state) => state.franchise);
    const dispatch = useAppDispatch();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
    const [minStaffFilter, setMinStaffFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("all");
    const [codeFilter, setCodeFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const locations = useMemo(() => {
        const locs = Array.from(new Set(list.map((f) => f.location).filter(Boolean)));
        return locs.sort();
    }, [list]);

    const filteredList = useMemo(() => {
        return list.filter((item) => {
            const matchesSearch =
                !searchTerm ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                statusFilter === "all" || item.status === statusFilter;
            const matchesStaff =
                !minStaffFilter || item.staffCount >= parseInt(minStaffFilter, 10);
            const matchesLocation =
                locationFilter === "all" || item.location === locationFilter;
            const matchesCode =
                !codeFilter || item.code.toLowerCase().includes(codeFilter.toLowerCase());
            return matchesSearch && matchesStatus && matchesStaff && matchesLocation && matchesCode;
        });
    }, [list, searchTerm, statusFilter, minStaffFilter, locationFilter, codeFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
    const paginatedList = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredList.slice(start, start + itemsPerPage);
    }, [filteredList, currentPage]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, minStaffFilter, locationFilter, codeFilter]);

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setMinStaffFilter("");
        setLocationFilter("all");
        setCodeFilter("");
    };

    const showingStart = filteredList.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const showingEnd = Math.min(currentPage * itemsPerPage, filteredList.length);
    const showingText = FRANCHISE_STRINGS.SHOWING_X_TO_Y_OF_Z.replace(
        "%s",
        String(showingStart)
    ).replace("%s", String(showingEnd)).replace("%s", String(filteredList.length));

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {FRANCHISE_STRINGS.PAGE_TITLE_OVERVIEW}
                    </h2>
                    <p className="text-slate-500 dark:text-[#92adc9] mt-0.5">
                        {FRANCHISE_STRINGS.PAGE_SUBTITLE_OVERVIEW}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border",
                            showFilters ||
                                statusFilter !== "all" ||
                                minStaffFilter !== "" ||
                                locationFilter !== "all" ||
                                codeFilter !== ""
                                ? "bg-theme-blue/10 border-theme-blue/30 text-theme-blue"
                                : "bg-white dark:bg-[#233648] border-slate-200 dark:border-transparent text-slate-700 dark:text-[#92adc9] hover:bg-slate-50 dark:hover:bg-[#1a2835]"
                        )}
                    >
                        <FilterIcon className="size-5" />
                        {FRANCHISE_STRINGS.FILTERS}
                    </button>
                    <Link
                        href={DASHBOARD_ROUTES.FRANCHISES_ONBOARDING}
                        className="flex items-center gap-2 px-4 py-2 bg-theme-blue text-white rounded-lg text-sm font-semibold transition-transform active:scale-95 shadow-lg shadow-theme-blue/20 hover:bg-theme-blue/90"
                    >
                        <Plus className="size-5" />
                        {FRANCHISE_STRINGS.CREATE_NEW_FRANCHISE}
                    </Link>
                </div>
            </div>

            {/* Filters panel */}
            {showFilters && (
                <div className="flex flex-col gap-4 bg-white dark:bg-[#111a22] p-4 rounded-xl border border-slate-200 dark:border-[#324d67]">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#92adc9] size-4" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={FRANCHISE_STRINGS.SEARCH_PLACEHOLDER}
                                className="w-full h-10 pl-10 pr-4 bg-slate-100 dark:bg-[#233648] border-none rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#92adc9] focus:ring-2 focus:ring-theme-blue/50"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "blocked")}
                                className="h-10 px-3 bg-slate-100 dark:bg-[#233648] border-none rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-theme-blue/50"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="blocked">Blocked</option>
                            </select>
                            <input
                                type="number"
                                value={minStaffFilter}
                                onChange={(e) => setMinStaffFilter(e.target.value)}
                                placeholder="Min staff"
                                className="h-10 w-24 px-3 bg-slate-100 dark:bg-[#233648] border-none rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-theme-blue/50"
                            />
                            <select
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="h-10 px-3 bg-slate-100 dark:bg-[#233648] border-none rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-theme-blue/50"
                            >
                                <option value="all">All Locations</option>
                                {locations.map((loc) => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                            {(searchTerm || statusFilter !== "all" || minStaffFilter || locationFilter !== "all" || codeFilter) && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title={FRANCHISE_STRINGS.RESET_FILTERS}
                                >
                                    <X className="size-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-[#111a22] rounded-xl border border-slate-200 dark:border-[#324d67] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-[#1a2835]">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#92adc9]">
                                    {FRANCHISE_STRINGS.TABLE_FRANCHISE_NAME}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#92adc9]">
                                    {FRANCHISE_STRINGS.TABLE_LOCATION}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#92adc9]">
                                    {FRANCHISE_STRINGS.TABLE_MANAGER}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#92adc9]">
                                    {FRANCHISE_STRINGS.TABLE_DRIVERS}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#92adc9]">
                                    {FRANCHISE_STRINGS.TABLE_MONTHLY_REVENUE}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#92adc9]">
                                    {FRANCHISE_STRINGS.TABLE_STATUS}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#92adc9] text-right">
                                    {FRANCHISE_STRINGS.TABLE_ACTIONS}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#324d67]">
                            {paginatedList.map((franchise, index) => (
                                <FranchiseRow
                                    key={franchise._id}
                                    franchise={franchise}
                                    avatarColor={getAvatarColor(index)}
                                    onView={() => dispatch(setSelectedFranchise(franchise))}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredList.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="size-16 bg-slate-100 dark:bg-[#233648] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="size-8 text-slate-400 dark:text-[#92adc9]" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {FRANCHISE_STRINGS.NO_FRANCHISES_FOUND}
                        </h3>
                        <p className="text-slate-500 dark:text-[#92adc9] mt-1 max-w-sm mx-auto text-sm">
                            {FRANCHISE_STRINGS.NO_FRANCHISES_MATCH}
                        </p>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="mt-6 text-theme-blue font-bold text-sm hover:underline"
                        >
                            {FRANCHISE_STRINGS.RESET_FILTERS}
                        </button>
                    </div>
                )}

                {filteredList.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 dark:bg-[#1a2835] border-t border-slate-200 dark:border-[#324d67] flex items-center justify-between flex-wrap gap-4">
                        <p className="text-xs text-slate-500 dark:text-[#92adc9] font-medium">
                            {showingText}
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-[#324d67] text-slate-500 dark:text-[#92adc9] hover:bg-slate-100 dark:hover:bg-[#233648] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors",
                                        currentPage === page
                                            ? "bg-theme-blue text-white"
                                            : "border border-slate-200 dark:border-[#324d67] text-slate-500 dark:text-[#92adc9] hover:bg-slate-100 dark:hover:bg-[#233648]"
                                    )}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-[#324d67] text-slate-500 dark:text-[#92adc9] hover:bg-slate-100 dark:hover:bg-[#233648] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function FranchiseRow({
    franchise,
    avatarColor,
    onView,
}: {
    franchise: Franchise;
    avatarColor: string;
    onView: () => void;
}) {
    const isActive = franchise.status === "active";
    const initials = getInitials(franchise.name, franchise.code?.slice(0, 2) || "?");

    return (
        <tr
            className={cn(
                "hover:bg-slate-50 dark:hover:bg-[#1a2835]/50 transition-colors group",
                !isActive && "opacity-60"
            )}
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                            avatarColor
                        )}
                    >
                        {initials}
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {franchise.name}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {franchise.location || "—"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-[#92adc9] truncate max-w-[180px]">
                        {franchise.address || "—"}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-[#233648] flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-[#92adc9] shrink-0">
                        {(franchise.inchargeName || "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-900 dark:text-white">
                        {franchise.inchargeName || "—"}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {franchise.driverCount}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {FRANCHISE_STRINGS.REVENUE_NOT_AVAILABLE}
                </span>
            </td>
            <td className="px-6 py-4">
                <span
                    className={cn(
                        "inline-flex px-2 py-1 rounded-full text-[10px] font-bold border",
                        isActive
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20"
                    )}
                >
                    {isActive ? FRANCHISE_STRINGS.STATUS_ACTIVE : FRANCHISE_STRINGS.STATUS_INACTIVE}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onView}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-[#233648] rounded-lg text-slate-500 dark:text-[#92adc9] transition-colors"
                        title={FRANCHISE_STRINGS.VIEW_DETAILS}
                    >
                        <Eye className="size-5" />
                    </button>
                    <button
                        type="button"
                        className="p-2 hover:bg-slate-100 dark:hover:bg-[#233648] rounded-lg text-slate-500 dark:text-[#92adc9] transition-colors"
                        title={FRANCHISE_STRINGS.EDIT}
                    >
                        <Edit2 className="size-5" />
                    </button>
                    {isActive ? (
                        <button
                            type="button"
                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-500 dark:text-[#92adc9] transition-colors"
                            title={FRANCHISE_STRINGS.DEACTIVATE}
                        >
                            <Ban className="size-5" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="p-2 hover:bg-green-500/10 hover:text-green-500 rounded-lg text-slate-500 dark:text-[#92adc9] transition-colors"
                            title={FRANCHISE_STRINGS.ACTIVATE}
                        >
                            <CheckCircle className="size-5" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}
