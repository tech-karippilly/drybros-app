"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import {
    setSelectedStaff,
    setStaffFilters,
    setStaffPage,
    updateStaffMemberStatus,
} from "@/lib/features/staff/staffSlice";
import { useToast } from "@/components/ui/toast";
import { STAFF_STRINGS } from "@/lib/constants/staff";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";
import {
    UserPlus,
    Search,
    ChevronLeft,
    ChevronRight,
    Mail,
    Phone,
    User,
    Edit2,
    Flame,
    Ban,
    MoreVertical,
    Store,
    Badge,
    Circle,
    RotateCcw,
    Users,
    Coffee,
    Building2,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Staff } from "@/lib/types/staff";
import { FireModal, SuspendModal } from "./ActionModals";
import { StatusBadge } from "./StatusBadge";

interface StaffListProps {
    onEditClick: (staff: Staff) => void;
}

function getEmployeeId(staff: Staff): string {
    const id = staff._id ?? staff.id ?? "";
    if (!id) return "—";
    const suffix = id.replace(/-/g, "").slice(-6).toUpperCase();
    return `EMP-${suffix}`;
}

export function StaffList({ onEditClick }: StaffListProps) {
    const { list, filters, pagination } = useAppSelector((state) => state.staff);
    const { list: franchises } = useAppSelector((state) => state.franchise);
    const dispatch = useAppDispatch();
    const { toast } = useToast();

    const [franchiseDropdownOpen, setFranchiseDropdownOpen] = useState(false);
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [actionsMenuOpen, setActionsMenuOpen] = useState<string | null>(null);
    const [fireTarget, setFireTarget] = useState<Staff | null>(null);
    const [suspendTarget, setSuspendTarget] = useState<Staff | null>(null);

    const franchiseMap = useMemo(() => {
        const map = new Map<string, { name: string; code: string }>();
        franchises.forEach((f) => map.set(f._id ?? f.id, { name: f.name, code: f.code }));
        return map;
    }, [franchises]);

    const filteredList = useMemo(() => {
        return list.filter((item) => {
            const matchesName = item.name.toLowerCase().includes(filters.name.toLowerCase());
            const matchesEmail = item.email.toLowerCase().includes(filters.email.toLowerCase());
            const matchesPhone = item.phone.includes(filters.phone);
            const matchesStatus = filters.status === "all" || String(item.status).toLowerCase() === filters.status;
            const matchesFranchise = filters.franchiseId === "all" || item.franchiseId === filters.franchiseId;
            const matchesSalary = filters.salary === "" || (item.salary ?? item.monthlySalary ?? 0) >= parseInt(filters.salary, 10);
            return matchesName && matchesEmail && matchesPhone && matchesStatus && matchesSalary && matchesFranchise;
        });
    }, [list, filters]);

    const totalPages = Math.max(1, Math.ceil(filteredList.length / pagination.itemsPerPage));
    const paginatedList = useMemo(() => {
        const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
        return filteredList.slice(start, start + pagination.itemsPerPage);
    }, [filteredList, pagination]);

    const stats = useMemo(() => {
        const active = list.filter((s) => String(s.status).toLowerCase() === "active").length;
        const onBreak = list.filter((s) => String(s.status).toLowerCase() === "suspended").length;
        return { totalActive: active, onBreak, totalBranches: franchises.length };
    }, [list, franchises.length]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        dispatch(setStaffFilters({ [key]: value }));
        setFranchiseDropdownOpen(false);
        setRoleDropdownOpen(false);
        setStatusDropdownOpen(false);
    };

    const clearFilters = () => {
        dispatch(
            setStaffFilters({
                name: "",
                salary: "",
                status: "all",
                email: "",
                phone: "",
                franchiseId: "all",
            })
        );
        setFranchiseDropdownOpen(false);
        setRoleDropdownOpen(false);
        setStatusDropdownOpen(false);
    };

    const currentFranchiseLabel =
        filters.franchiseId === "all"
            ? STAFF_STRINGS.FRANCHISE_ALL_BRANCHES
            : franchiseMap.get(filters.franchiseId)?.name ?? STAFF_STRINGS.FRANCHISE_ALL_BRANCHES;
    const currentStatusLabel =
        filters.status === "all" ? "Status: All" : filters.status === "active" ? STAFF_STRINGS.STATUS_ACTIVE : `Status: ${filters.status}`;

    const startItem = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
    const endItem = Math.min(pagination.currentPage * pagination.itemsPerPage, filteredList.length);
    const showingText = STAFF_STRINGS.SHOWING_X_TO_Y_OF_Z.replace("%s", String(startItem)).replace("%s", String(endItem)).replace("%s", String(filteredList.length));

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Page Heading */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
                        {STAFF_STRINGS.PAGE_TITLE}
                    </h1>
                    <p className="text-slate-500 dark:text-[#92adc9] text-base font-normal">
                        {STAFF_STRINGS.PAGE_SUBTITLE}
                    </p>
                </div>
                <Link
                    href={DASHBOARD_ROUTES.STAFF_ONBOARDING}
                    className="flex items-center gap-2 px-5 py-2.5 bg-theme-blue hover:bg-theme-blue/90 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-theme-blue/20"
                >
                    <UserPlus className="size-5" />
                    <span>{STAFF_STRINGS.ADD_NEW_STAFF}</span>
                </Link>
            </div>

            {/* Filters Section */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-[#192633] rounded-xl border border-slate-200 dark:border-[#233648]">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-[#92adc9] uppercase tracking-wider">
                        {STAFF_STRINGS.FILTERS}:
                    </span>
                </div>
                <div className="flex-1 min-w-[200px] max-w-xs">
                    <div className="flex items-center bg-slate-200 dark:bg-[#233648] rounded-lg px-3 py-1.5 gap-2 border border-transparent focus-within:border-theme-blue transition-all">
                        <Search className="size-5 text-slate-500 dark:text-[#92adc9] shrink-0" />
                        <input
                            type="text"
                            value={filters.name}
                            onChange={(e) => handleFilterChange("name", e.target.value)}
                            placeholder={STAFF_STRINGS.SEARCH_PLACEHOLDER}
                            className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-[#92adc9] w-full"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setFranchiseDropdownOpen((o) => !o);
                                setRoleDropdownOpen(false);
                                setStatusDropdownOpen(false);
                            }}
                            className="flex h-10 items-center justify-between gap-x-3 rounded-lg bg-slate-100 dark:bg-[#233648] px-4 border border-slate-200 dark:border-transparent hover:border-theme-blue transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Store className="size-4 text-theme-blue" />
                                <p className="text-slate-700 dark:text-white text-sm font-medium">{currentFranchiseLabel}</p>
                            </div>
                            <ChevronRight className={cn("size-4 text-slate-400 dark:text-white transition-transform", franchiseDropdownOpen && "rotate-90")} />
                        </button>
                        {franchiseDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setFranchiseDropdownOpen(false)} />
                                <div className="absolute left-0 top-full mt-1 z-20 min-w-[200px] py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
                                    <button
                                        type="button"
                                        onClick={() => handleFilterChange("franchiseId", "all")}
                                        className={cn(
                                            "w-full px-4 py-2 text-left text-sm font-medium",
                                            filters.franchiseId === "all" ? "bg-theme-blue/10 text-theme-blue" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        All Branches
                                    </button>
                                    {franchises.map((f) => (
                                        <button
                                            key={f._id ?? f.id}
                                            type="button"
                                            onClick={() => handleFilterChange("franchiseId", f._id ?? f.id)}
                                            className={cn(
                                                "w-full px-4 py-2 text-left text-sm font-medium",
                                                filters.franchiseId === (f._id ?? f.id) ? "bg-theme-blue/10 text-theme-blue" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setRoleDropdownOpen((o) => !o);
                                setFranchiseDropdownOpen(false);
                                setStatusDropdownOpen(false);
                            }}
                            className="flex h-10 items-center justify-between gap-x-3 rounded-lg bg-slate-100 dark:bg-[#233648] px-4 border border-slate-200 dark:border-transparent hover:border-theme-blue transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Badge className="size-4 text-theme-blue" />
                                <p className="text-slate-700 dark:text-white text-sm font-medium">{STAFF_STRINGS.ROLE_ALL_ROLES}</p>
                            </div>
                            <ChevronRight className={cn("size-4 text-slate-400 dark:text-white transition-transform", roleDropdownOpen && "rotate-90")} />
                        </button>
                    </div>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setStatusDropdownOpen((o) => !o);
                                setFranchiseDropdownOpen(false);
                                setRoleDropdownOpen(false);
                            }}
                            className="flex h-10 items-center justify-between gap-x-3 rounded-lg bg-slate-100 dark:bg-[#233648] px-4 border border-slate-200 dark:border-transparent hover:border-theme-blue transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Circle className="size-4 text-theme-blue fill-current" />
                                <p className="text-slate-700 dark:text-white text-sm font-medium">{currentStatusLabel}</p>
                            </div>
                            <ChevronRight className={cn("size-4 text-slate-400 dark:text-white transition-transform", statusDropdownOpen && "rotate-90")} />
                        </button>
                        {statusDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setStatusDropdownOpen(false)} />
                                <div className="absolute left-0 top-full mt-1 z-20 min-w-[160px] py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
                                    {["all", "active", "suspended", "fired", "block"].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => handleFilterChange("status", s)}
                                            className={cn(
                                                "w-full px-4 py-2 text-left text-sm font-medium capitalize",
                                                filters.status === s ? "bg-theme-blue/10 text-theme-blue" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            {s === "all" ? "All Status" : s}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-4 text-slate-500 dark:text-[#92adc9] text-sm font-medium hover:text-theme-blue transition-colors"
                    >
                        <RotateCcw className="size-5" />
                        <span>{STAFF_STRINGS.RESET}</span>
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-[#111a22] rounded-xl border border-slate-200 dark:border-[#324d67] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#192633] border-b border-slate-200 dark:border-[#324d67]">
                                <th className="px-6 py-4 text-slate-700 dark:text-white text-xs font-bold uppercase tracking-wider w-[250px]">
                                    {STAFF_STRINGS.TABLE_STAFF_NAME}
                                </th>
                                <th className="px-6 py-4 text-slate-700 dark:text-white text-xs font-bold uppercase tracking-wider">
                                    {STAFF_STRINGS.TABLE_FRANCHISE}
                                </th>
                                <th className="px-6 py-4 text-slate-700 dark:text-white text-xs font-bold uppercase tracking-wider">
                                    {STAFF_STRINGS.TABLE_ROLE}
                                </th>
                                <th className="px-6 py-4 text-slate-700 dark:text-white text-xs font-bold uppercase tracking-wider">
                                    {STAFF_STRINGS.TABLE_CONTACT}
                                </th>
                                <th className="px-6 py-4 text-slate-700 dark:text-white text-xs font-bold uppercase tracking-wider">
                                    {STAFF_STRINGS.TABLE_STATUS}
                                </th>
                                <th className="px-6 py-4 text-slate-500 dark:text-[#92adc9] text-xs font-bold uppercase tracking-wider text-right">
                                    {STAFF_STRINGS.TABLE_ACTIONS}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#324d67]">
                            {paginatedList.map((staff) => {
                                const franchise = franchiseMap.get(staff.franchiseId);
                                const empId = getEmployeeId(staff);
                                const menuOpen = actionsMenuOpen === (staff._id ?? staff.id);
                                return (
                                    <tr key={staff._id ?? staff.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1c2a38] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-theme-blue/10 flex items-center justify-center text-theme-blue font-bold border border-slate-200 dark:border-slate-700">
                                                    {(staff.name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 dark:text-white text-sm font-bold">{staff.name}</p>
                                                    <p className="text-slate-500 dark:text-[#92adc9] text-xs font-medium">{empId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-[#92adc9] text-sm">
                                            {franchise?.name ?? staff.franchises_code ?? "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400">
                                                {STAFF_STRINGS.ROLE_STAFF}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-900 dark:text-white text-sm">{staff.email}</p>
                                            <p className="text-slate-500 dark:text-[#92adc9] text-xs">{staff.phone}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={staff.status} variant="dot" />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative inline-block">
                                                <button
                                                    type="button"
                                                    onClick={() => setActionsMenuOpen(menuOpen ? null : staff._id ?? staff.id)}
                                                    className="text-slate-400 dark:text-[#92adc9] hover:text-theme-blue transition-colors p-1"
                                                >
                                                    <MoreVertical className="size-5" />
                                                </button>
                                                {menuOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" aria-hidden onClick={() => setActionsMenuOpen(null)} />
                                                        <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    dispatch(setSelectedStaff(staff));
                                                                    setActionsMenuOpen(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                                            >
                                                                <User className="size-4" />
                                                                {STAFF_STRINGS.ACTION_VIEW_DETAILS}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onEditClick(staff);
                                                                    setActionsMenuOpen(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                                            >
                                                                <Edit2 className="size-4" />
                                                                {STAFF_STRINGS.ACTION_EDIT}
                                                            </button>
                                                            {String(staff.status).toLowerCase() !== "suspended" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSuspendTarget(staff);
                                                                        setActionsMenuOpen(null);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2"
                                                                >
                                                                    <Ban className="size-4" />
                                                                    {STAFF_STRINGS.ACTION_SUSPEND}
                                                                </button>
                                                            )}
                                                            {String(staff.status).toLowerCase() !== "fired" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setFireTarget(staff);
                                                                        setActionsMenuOpen(null);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                                >
                                                                    <Flame className="size-4" />
                                                                    {STAFF_STRINGS.ACTION_FIRE}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredList.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-slate-400 dark:text-[#92adc9]" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{STAFF_STRINGS.NO_STAFF_FOUND}</h3>
                        <p className="text-slate-500 dark:text-[#92adc9] mt-1 max-w-xs mx-auto">{STAFF_STRINGS.NO_STAFF_MATCH}</p>
                        <button onClick={clearFilters} className="mt-6 text-theme-blue font-bold text-sm hover:underline">
                            {STAFF_STRINGS.RESET_ALL_FILTERS}
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {filteredList.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-[#324d67]">
                        <p className="text-xs font-medium text-slate-500 dark:text-[#92adc9]">{showingText}</p>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => dispatch(setStaffPage(Math.max(1, pagination.currentPage - 1)))}
                                disabled={pagination.currentPage === 1}
                                className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[#233648] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <ChevronLeft className="size-5 text-slate-500 dark:text-white" />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => {
                                const page = i + 1;
                                return (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => dispatch(setStaffPage(page))}
                                        className={cn(
                                            "flex size-9 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                                            pagination.currentPage === page
                                                ? "bg-theme-blue text-white"
                                                : "text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-[#233648]"
                                        )}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            {totalPages > 9 && (
                                <>
                                    <span className="text-slate-400 px-2">...</span>
                                    <button
                                        type="button"
                                        onClick={() => dispatch(setStaffPage(totalPages))}
                                        className="flex size-9 items-center justify-center rounded-lg text-xs font-medium text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-[#233648]"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={() => dispatch(setStaffPage(Math.min(totalPages, pagination.currentPage + 1)))}
                                disabled={pagination.currentPage === totalPages}
                                className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[#233648] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <ChevronRight className="size-5 text-slate-500 dark:text-white" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#192633] border border-slate-200 dark:border-[#233648] rounded-xl p-5 flex items-center gap-4">
                    <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Users className="size-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-[#92adc9] uppercase">{STAFF_STRINGS.STAT_TOTAL_ACTIVE}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalActive}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#192633] border border-slate-200 dark:border-[#233648] rounded-xl p-5 flex items-center gap-4">
                    <div className="size-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Coffee className="size-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-[#92adc9] uppercase">{STAFF_STRINGS.STAT_ON_BREAK}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.onBreak}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#192633] border border-slate-200 dark:border-[#233648] rounded-xl p-5 flex items-center gap-4">
                    <div className="size-12 rounded-full bg-theme-blue/10 text-theme-blue flex items-center justify-center">
                        <Building2 className="size-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-[#92adc9] uppercase">{STAFF_STRINGS.STAT_TOTAL_BRANCHES}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalBranches}</p>
                    </div>
                </div>
            </div>

            {/* Action Modals */}
            <FireModal
                isOpen={!!fireTarget}
                staffName={fireTarget?.name ?? ""}
                onClose={() => setFireTarget(null)}
                onConfirm={async () => {
                    if (fireTarget) {
                        try {
                            const staffId = fireTarget.id ?? fireTarget._id ?? "";
                            await dispatch(updateStaffMemberStatus({ id: staffId, data: { status: "FIRED" } })).unwrap();
                            toast({ title: "Success", description: `${fireTarget.name} has been fired`, variant: "success" });
                            setFireTarget(null);
                        } catch (err: unknown) {
                            toast({
                                title: "Error",
                                description: (err as Error)?.message ?? "Failed to fire staff member",
                                variant: "error",
                            });
                        }
                    }
                }}
            />
            <SuspendModal
                isOpen={!!suspendTarget}
                staffName={suspendTarget?.name ?? ""}
                onClose={() => setSuspendTarget(null)}
                onConfirm={async (duration) => {
                    if (suspendTarget) {
                        try {
                            const staffId = suspendTarget.id ?? suspendTarget._id ?? "";
                            let suspendedUntil: Date | null = null;
                            if (duration) {
                                const days = parseInt(duration.split(" ")[0], 10) || 7;
                                suspendedUntil = new Date();
                                suspendedUntil.setDate(suspendedUntil.getDate() + days);
                            }
                            await dispatch(
                                updateStaffMemberStatus({
                                    id: staffId,
                                    data: { status: "SUSPENDED", suspendedUntil: suspendedUntil?.toISOString() ?? null },
                                })
                            ).unwrap();
                            toast({ title: "Success", description: `${suspendTarget.name} has been suspended`, variant: "success" });
                            setSuspendTarget(null);
                        } catch (err: unknown) {
                            toast({
                                title: "Error",
                                description: (err as Error)?.message ?? "Failed to suspend staff member",
                                variant: "error",
                            });
                        }
                    }
                }}
            />
        </div>
    );
}
