"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { setSelectedFranchise, updateFranchise, mapBackendFranchiseToFrontend } from "@/lib/features/franchise/franchiseSlice";
import {
    getFranchiseById,
    updateFranchiseStatus,
    deleteFranchise,
    FRANCHISE_STATUS,
    type FranchiseDetailData,
    type FranchiseStatus,
} from "@/lib/features/franchise/franchiseApi";
import { FRANCHISE_STRINGS } from "@/lib/constants/franchise";
import {
    ChevronLeft,
    Edit2,
    MapPin,
    Phone,
    Mail,
    Truck,
    TrendingUp,
    Wallet,
    ShieldCheck,
    MoreVertical,
    Ban,
    CheckCircle,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

const STATUS_OPTIONS: { value: FranchiseStatus; label: string }[] = [
    { value: FRANCHISE_STATUS.ACTIVE, label: FRANCHISE_STRINGS.SET_ACTIVE },
    { value: FRANCHISE_STATUS.BLOCKED, label: FRANCHISE_STRINGS.SET_BLOCKED },
    { value: FRANCHISE_STATUS.TEMPORARILY_CLOSED, label: FRANCHISE_STRINGS.SET_TEMPORARILY_CLOSED },
];

export function FranchiseDetails() {
    const router = useRouter();
    const { selectedFranchise } = useAppSelector((state) => state.franchise);
    const dispatch = useAppDispatch();
    const [detail, setDetail] = useState<FranchiseDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [confirmStatusModal, setConfirmStatusModal] = useState<FranchiseStatus | null>(null);
    const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const franchiseId = selectedFranchise?._id ?? null;

    useEffect(() => {
        if (!franchiseId) {
            setDetail(null);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        getFranchiseById(franchiseId)
            .then((data) => {
                if (!cancelled) setDetail(data);
            })
            .catch((err) => {
                if (!cancelled) {
                    const msg =
                        err?.response?.data?.error ||
                        err?.response?.data?.message ||
                        err?.message ||
                        "Failed to load franchise details";
                    setError(msg);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [franchiseId]);

    const handleBack = () => {
        dispatch(setSelectedFranchise(null));
    };

    const fetchDetail = () => {
        if (!franchiseId) return;
        getFranchiseById(franchiseId).then(setDetail).catch(() => {});
    };

    const handleConfirmChangeStatus = async () => {
        if (!franchiseId || !confirmStatusModal) return;
        setActionLoading(true);
        setActionError(null);
        try {
            const res = await updateFranchiseStatus(franchiseId, { status: confirmStatusModal });
            const mapped = mapBackendFranchiseToFrontend(res.data);
            dispatch(updateFranchise(mapped));
            dispatch(setSelectedFranchise(mapped));
            setConfirmStatusModal(null);
            setStatusDropdownOpen(false);
            fetchDetail();
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string }; status?: number } })?.response?.data?.message ||
                (err as Error)?.message ||
                "Failed to update status";
            setActionError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!franchiseId) return;
        setActionLoading(true);
        setActionError(null);
        try {
            await deleteFranchise(franchiseId);
            setConfirmDeleteModal(false);
            dispatch(setSelectedFranchise(null));
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string }; status?: number } })?.response?.data?.message ||
                (err as Error)?.message ||
                "Failed to delete franchise";
            setActionError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const openStatusConfirm = (status: FranchiseStatus) => {
        setConfirmStatusModal(status);
        setStatusDropdownOpen(false);
    };

    if (!selectedFranchise) return null;

    if (loading) {
        return (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-8 py-4 bg-white dark:bg-slate-900/50 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="text-slate-400 hover:text-theme-blue flex items-center gap-1 transition-colors"
                        >
                            <ChevronLeft className="size-5" />
                            <span className="text-sm font-medium">{FRANCHISE_STRINGS.BACK_TO_FRANCHISES}</span>
                        </button>
                    </div>
                </div>
                <div className="p-8 flex items-center justify-center min-h-[400px]">
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading franchise details…</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-8 py-4 bg-white dark:bg-slate-900/50 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="text-slate-400 hover:text-theme-blue flex items-center gap-1 transition-colors"
                        >
                            <ChevronLeft className="size-5" />
                            <span className="text-sm font-medium">{FRANCHISE_STRINGS.BACK_TO_FRANCHISES}</span>
                        </button>
                    </div>
                </div>
                <div className="p-8 flex items-center justify-center min-h-[400px]">
                    <div className="text-red-500 dark:text-red-400 text-sm font-medium">{error}</div>
                </div>
            </div>
        );
    }

    if (!detail) return null;

    const stats = detail.statistics;
    const activeSince = detail.createdAt
        ? new Date(detail.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
        : "";
    const reliability =
        stats.totalTrips > 0
            ? Math.max(0, ((stats.totalTrips - stats.totalComplaints) / stats.totalTrips) * 100).toFixed(1)
            : "100";
    const currencySymbol = FRANCHISE_STRINGS.CURRENCY_SYMBOL;
    const revenueFormatted =
        stats.totalRevenue >= 1_000_000
            ? `${currencySymbol}${(stats.totalRevenue / 1_000_000).toFixed(2)}M`
            : stats.totalRevenue >= 1_000
              ? `${currencySymbol}${(stats.totalRevenue / 1_000).toFixed(2)}K`
              : `${currencySymbol}${stats.totalRevenue}`;
    const managerEmail = detail.staff?.[0]?.email ?? "";
    const onlineDrivers = detail.drivers?.filter((d) => d.status === "ACTIVE" && d.isActive).length ?? 0;

    const franchiseStatus = detail.status ?? (detail.isActive ? FRANCHISE_STATUS.ACTIVE : "INACTIVE");
    const statusDisplayLabel =
        franchiseStatus === FRANCHISE_STATUS.ACTIVE
            ? FRANCHISE_STRINGS.STATUS_ACTIVE
            : franchiseStatus === FRANCHISE_STATUS.BLOCKED
              ? FRANCHISE_STRINGS.STATUS_BLOCKED
              : franchiseStatus === FRANCHISE_STATUS.TEMPORARILY_CLOSED
                ? FRANCHISE_STRINGS.STATUS_TEMPORARILY_CLOSED
                : FRANCHISE_STRINGS.STATUS_INACTIVE;
    const statusBadgeClass =
        franchiseStatus === FRANCHISE_STATUS.ACTIVE
            ? "bg-emerald-500/10 text-emerald-500"
            : franchiseStatus === FRANCHISE_STATUS.BLOCKED
              ? "bg-red-500/10 text-red-500"
              : "bg-amber-500/10 text-amber-500";

    return (
        <div className="flex flex-col gap-8 animate-in slide-in-from-right duration-500">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-8 py-4 bg-white dark:bg-slate-900/50 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="text-slate-400 hover:text-theme-blue flex items-center gap-1 transition-colors"
                    >
                        <ChevronLeft className="size-5" />
                        <span className="text-sm font-medium">{FRANCHISE_STRINGS.BACK_TO_FRANCHISES}</span>
                    </button>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        {FRANCHISE_STRINGS.PAGE_TITLE_DETAIL}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {/* Change status dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setStatusDropdownOpen((o) => !o)}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-700"
                        >
                            {FRANCHISE_STRINGS.CHANGE_STATUS}
                            <MoreVertical className="size-4" />
                        </button>
                        {statusDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    aria-hidden
                                    onClick={() => setStatusDropdownOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
                                    {STATUS_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => openStatusConfirm(opt.value)}
                                            className={cn(
                                                "w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-2 transition-colors",
                                                detail?.status === opt.value
                                                    ? "bg-theme-blue/10 text-theme-blue dark:bg-theme-blue/20"
                                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            {opt.value === FRANCHISE_STATUS.ACTIVE && (
                                                <CheckCircle className="size-4" />
                                            )}
                                            {opt.value === FRANCHISE_STATUS.BLOCKED && <Ban className="size-4" />}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setConfirmDeleteModal(true)}
                        className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                    >
                        <Trash2 className="size-4" />
                        {FRANCHISE_STRINGS.DELETE_FRANCHISE}
                    </button>
                    <button
                        type="button"
                        onClick={() => franchiseId && router.push(`/dashboard/franchises/${franchiseId}/edit`)}
                        className="bg-theme-blue/10 text-theme-blue hover:bg-theme-blue/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                    >
                        <Edit2 className="size-4" />
                        {FRANCHISE_STRINGS.EDIT_FRANCHISE}
                    </button>
                </div>
            </header>

            <div className="p-8 flex flex-col gap-8">
                {/* Top grid: Profile card + Map | Manager card */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col lg:flex-row">
                        <div className="p-8 flex-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="size-16 rounded-xl bg-theme-blue/10 flex items-center justify-center">
                                    <MapPin className="size-10 text-theme-blue" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">{detail.name}</h1>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                                        {FRANCHISE_STRINGS.ACTIVE_SINCE} {activeSince}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {FRANCHISE_STRINGS.LABEL_STATUS}
                                    </span>
                                    <span
                                        className={cn(
                                            "inline-flex w-fit px-2.5 py-0.5 rounded-full text-xs font-bold",
                                            statusBadgeClass
                                        )}
                                    >
                                        {statusDisplayLabel}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {FRANCHISE_STRINGS.ADDRESS}
                                    </span>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {detail.address || "—"}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {FRANCHISE_STRINGS.CONTACT_PHONE}
                                    </span>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {detail.phone || "—"}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {FRANCHISE_STRINGS.EMAIL_ADDRESS}
                                    </span>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {managerEmail || "—"}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {FRANCHISE_STRINGS.OPERATING_HOURS}
                                    </span>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {FRANCHISE_STRINGS.SERVICE_COVERAGE_24_7}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/3 min-h-[250px] bg-slate-100 dark:bg-slate-800/50 relative group flex items-center justify-center">
                            <div className="absolute inset-0 bg-theme-blue/10 group-hover:bg-transparent transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-theme-blue p-2 rounded-full shadow-lg ring-4 ring-theme-blue/20">
                                    <MapPin className="size-6 text-white" />
                                </div>
                            </div>
                            <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase shadow-lg text-slate-700 dark:text-slate-300">
                                {FRANCHISE_STRINGS.INTERACTIVE_MAP}
                            </div>
                        </div>
                    </div>

                    {/* Manager card */}
                    <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                    {FRANCHISE_STRINGS.MANAGER_DETAILS}
                                </h3>
                                <span
                                    className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                        statusBadgeClass
                                    )}
                                >
                                    {statusDisplayLabel}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="size-16 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xl">
                                    {(detail.inchargeName || "M").charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                        {detail.inchargeName || "—"}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {FRANCHISE_STRINGS.FRANCHISE_MANAGER_ROLE}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="size-4 text-slate-400" />
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {detail.phone || "—"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="size-4 text-slate-400" />
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {managerEmail || "—"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className="w-full mt-6 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 py-2.5 rounded-lg text-xs font-bold transition-all text-slate-700 dark:text-slate-300">
                            {FRANCHISE_STRINGS.CONTACT_MANAGER}
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-theme-blue p-8 rounded-xl shadow-lg relative overflow-hidden group">
                        <Truck className="absolute -right-4 -bottom-4 size-24 text-white/10" />
                        <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">
                            {FRANCHISE_STRINGS.TOTAL_TRIPS}
                        </p>
                        <h3 className="text-4xl font-black text-white">{stats.totalTrips.toLocaleString()}</h3>
                        <div className="mt-4 flex items-center gap-2 text-white/80 text-xs font-medium">
                            <TrendingUp className="size-4" />
                            <span>{FRANCHISE_STRINGS.FROM_LAST_MONTH}</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <Wallet className="absolute -right-4 -bottom-4 size-24 text-theme-blue/5" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">
                            {FRANCHISE_STRINGS.TOTAL_REVENUE}
                        </p>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{revenueFormatted}</h3>
                        <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-bold">
                            <span>{FRANCHISE_STRINGS.HIGH_PERFORMING_BRANCH}</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <ShieldCheck className="absolute -right-4 -bottom-4 size-24 text-theme-blue/5" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">
                            {FRANCHISE_STRINGS.RELIABILITY_SCORE}
                        </p>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{reliability}%</h3>
                        <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full transition-all"
                                style={{ width: `${reliability}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Staff & Drivers tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                {FRANCHISE_STRINGS.ADMINISTRATIVE_STAFF}
                            </h3>
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold text-slate-500 uppercase">
                                {stats.totalStaff} {FRANCHISE_STRINGS.MEMBERS}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/30">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {FRANCHISE_STRINGS.TABLE_NAME}
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {FRANCHISE_STRINGS.TABLE_ROLE}
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {FRANCHISE_STRINGS.TABLE_CONTACT}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {detail.staff?.map((member) => (
                                        <tr
                                            key={member.id}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-sm">
                                                        {(member.name || "?").charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {member.name || "—"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                {FRANCHISE_STRINGS.ROLE_STAFF}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-theme-blue">
                                                {member.email || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                            <button className="text-theme-blue text-xs font-bold hover:underline">
                                {FRANCHISE_STRINGS.VIEW_ALL_STAFF}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                {FRANCHISE_STRINGS.ACTIVE_DRIVERS}
                            </h3>
                            <div className="flex gap-2">
                                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                                    {onlineDrivers} {FRANCHISE_STRINGS.ONLINE}
                                </span>
                                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                                    {stats.totalDrivers} {FRANCHISE_STRINGS.TOTAL}
                                </span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/30">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {FRANCHISE_STRINGS.TABLE_DRIVER}
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {FRANCHISE_STRINGS.TABLE_STATUS}
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {FRANCHISE_STRINGS.TABLE_CONTACT}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {detail.drivers?.map((driver) => {
                                        const fullName = [driver.firstName, driver.lastName].filter(Boolean).join(" ") || "—";
                                        const statusLabel =
                                            driver.status === "ACTIVE"
                                                ? FRANCHISE_STRINGS.STATUS_AVAILABLE
                                                : FRANCHISE_STRINGS.STATUS_OFFLINE;
                                        return (
                                            <tr
                                                key={driver.id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-sm">
                                                            {fullName.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            {fullName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                            driver.status === "ACTIVE" && driver.isActive
                                                                ? "bg-emerald-500/10 text-emerald-500"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                                        )}
                                                    >
                                                        {driver.status === "ACTIVE" && driver.isActive && (
                                                            <span className="size-1.5 rounded-full bg-emerald-500" />
                                                        )}
                                                        {statusLabel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-theme-blue">
                                                    {driver.email || driver.phone || "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                            <button className="text-theme-blue text-xs font-bold hover:underline">
                                {FRANCHISE_STRINGS.VIEW_ALL_DRIVERS}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm change status modal */}
            <Modal
                isOpen={confirmStatusModal !== null}
                onClose={() => {
                    if (!actionLoading) setConfirmStatusModal(null);
                }}
                title={FRANCHISE_STRINGS.CHANGE_STATUS}
                description={FRANCHISE_STRINGS.CONFIRM_CHANGE_STATUS}
            >
                <div className="flex flex-col gap-4">
                    {actionError && (
                        <p className="text-sm text-red-500 dark:text-red-400">{actionError}</p>
                    )}
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => setConfirmStatusModal(null)}
                            disabled={actionLoading}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                            {FRANCHISE_STRINGS.BTN_CANCEL}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmChangeStatus}
                            disabled={actionLoading}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-theme-blue text-white hover:bg-theme-blue/90 disabled:opacity-50"
                        >
                            {actionLoading ? FRANCHISE_STRINGS.BTN_UPDATING : FRANCHISE_STRINGS.BTN_CONFIRM}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Confirm delete modal */}
            <Modal
                isOpen={confirmDeleteModal}
                onClose={() => {
                    if (!actionLoading) setConfirmDeleteModal(false);
                }}
                title={FRANCHISE_STRINGS.DELETE_FRANCHISE}
                description={FRANCHISE_STRINGS.CONFIRM_DELETE_FRANCHISE}
            >
                <div className="flex flex-col gap-4">
                    {actionError && (
                        <p className="text-sm text-red-500 dark:text-red-400">{actionError}</p>
                    )}
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => setConfirmDeleteModal(false)}
                            disabled={actionLoading}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                            {FRANCHISE_STRINGS.BTN_CANCEL}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            disabled={actionLoading}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                        >
                            {actionLoading ? FRANCHISE_STRINGS.BTN_DELETING : FRANCHISE_STRINGS.BTN_DELETE}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
