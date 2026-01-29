"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Users,
    CheckCircle,
    Ticket,
    AlertCircle,
    Map,
    LogOut,
    Radio,
    XCircle,
    Loader2,
} from "lucide-react";
import {
    ManagerDashboardData,
    getManagerDashboardData,
} from "@/lib/features/dashboard/dashboardApi";
import { clockIn, clockOut, getAttendances, type AttendanceResponse } from "@/lib/features/attendance/attendanceApi";
import { MANAGER_DASHBOARD_STRINGS } from "@/lib/constants/dashboardMetrics";
import { useAppSelector } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";
import { useToast } from "@/components/ui/toast";

const PRIMARY = "#137fec";

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: string;
    trendPositive?: boolean;
    icon: React.ReactNode;
    iconColor: string;
    isPending?: boolean;
    subtitle?: string;
    progressPercent?: number;
}

function StatCard({
    label,
    value,
    trend,
    trendPositive = true,
    icon,
    iconColor,
    isPending = false,
    subtitle,
    progressPercent,
}: StatCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border p-6 shadow-sm",
                isPending
                    ? "border-[#137fec]/30 border-dashed bg-white dark:bg-slate-900/50"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50"
            )}
        >
            <div className="mb-4 flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {label}
                </p>
                <div className={iconColor}>{icon}</div>
            </div>
            {progressPercent != null ? (
                <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {value}
                        </p>
                        {subtitle && (
                            <p className="text-xs font-medium text-slate-500">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex items-baseline gap-2">
                    <p
                        className={cn(
                            "text-2xl font-bold",
                            isPending
                                ? "text-orange-400"
                                : "text-slate-900 dark:text-white"
                        )}
                    >
                        {value}
                    </p>
                    {trend && (
                        <p
                            className={cn(
                                "text-xs font-semibold",
                                trendPositive
                                    ? "text-emerald-500"
                                    : "text-orange-500"
                            )}
                        >
                            {trend}
                        </p>
                    )}
                    {isPending && (
                        <p className="text-xs font-medium text-slate-400">
                            {MANAGER_DASHBOARD_STRINGS.ACTION_REQUIRED}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function WeeklyChartSvg() {
    // Simplified chart path matching the design
    const pathData =
        "M0,130 L50,110 L100,120 L150,80 L200,90 L250,50 L300,70 L350,30 L400,40 L450,20 L500,40";
    const fillPath =
        "M0,130 L50,110 L100,120 L150,80 L200,90 L250,50 L300,70 L350,30 L400,40 L450,20 L500,40 L500,150 L0,150 Z";

    return (
        <svg
            className="h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 500 150"
        >
            <defs>
                <linearGradient
                    id="managerChartGradient"
                    x1="0%"
                    x2="0%"
                    y1="0%"
                    y2="100%"
                >
                    <stop
                        offset="0%"
                        style={{ stopColor: PRIMARY, stopOpacity: 0.2 }}
                    />
                    <stop
                        offset="100%"
                        style={{ stopColor: PRIMARY, stopOpacity: 0 }}
                    />
                </linearGradient>
            </defs>
            <path d={fillPath} fill="url(#managerChartGradient)" />
            <path
                d={pathData}
                fill="none"
                stroke={PRIMARY}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
            />
            {[50, 150, 250, 350, 450].map((x, i) => {
                const y = [110, 80, 50, 30, 20][i];
                return (
                    <circle
                        key={x}
                        cx={x}
                        cy={y}
                        fill="white"
                        r="4"
                        stroke={PRIMARY}
                        strokeWidth="2"
                    />
                );
            })}
        </svg>
    );
}

export function ManagerDashboard() {
    const { user, refreshTrigger, selectedFranchise } = useAppSelector(
        (state) => state.auth
    );
    const { toast } = useToast();
    const [data, setData] = useState<ManagerDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState<AttendanceResponse | null>(null);
    const [attendanceLoading, setAttendanceLoading] = useState(true);
    const [clockingOut, setClockingOut] = useState(false);
    const [clockingIn, setClockingIn] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [shiftTime, setShiftTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

    // Normalize API date (ISO or YYYY-MM-DD) to YYYY-MM-DD for comparison
    const attendanceDateStr = (d: string | null | undefined): string =>
        !d ? '' : d.includes('T') ? d.split('T')[0]! : d;

    // Fetch today's attendance
    useEffect(() => {
        let cancelled = false;
        const today = new Date().toISOString().split('T')[0];
        (async () => {
            try {
                setAttendanceLoading(true);
                const attendances = await getAttendances({
                    userId: user?._id ?? undefined,
                    startDate: today,
                    endDate: today,
                });
                
                if (!cancelled) {
                    const list = Array.isArray(attendances) ? attendances : (attendances as any)?.data ?? [];
                    const todayAttendance = list.find((a: AttendanceResponse) => attendanceDateStr(a.date) === today);
                    if (todayAttendance) {
                        setAttendance(todayAttendance);
                    } else {
                        setAttendance(null);
                    }
                }
            } catch (error) {
                console.error('Failed to load attendance:', error);
            } finally {
                if (!cancelled) setAttendanceLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [refreshTrigger, user?._id]);

    // Update shift timer based on clock in time
    useEffect(() => {
        if (!attendance?.clockIn || attendance?.clockOut) {
            setShiftTime({ hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        const updateShiftTime = () => {
            const clockInTime = new Date(attendance.clockIn);
            const now = new Date();
            const diff = Math.floor((now.getTime() - clockInTime.getTime()) / 1000); // seconds
            
            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;
            
            setShiftTime({ hours, minutes, seconds });
        };

        updateShiftTime();
        const timer = setInterval(updateShiftTime, 1000);
        return () => clearInterval(timer);
    }, [attendance]);

    // Update current time
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const dashboardData = await getManagerDashboardData(
                    user?.franchise_id
                );
                if (!cancelled) {
                    setData(dashboardData);
                }
            } catch (error) {
                console.error("Failed to load manager dashboard:", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user?.franchise_id, refreshTrigger]);

    if (loading || !data) {
        return (
            <div className="animate-in fade-in duration-500">
                <div className="mb-8">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        {MANAGER_DASHBOARD_STRINGS.PAGE_TITLE}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        {MANAGER_DASHBOARD_STRINGS.LOADING_MESSAGE}
                    </p>
                </div>
            </div>
        );
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatShiftTime = (t: typeof shiftTime) => {
        return `${String(t.hours).padStart(2, "0")}:${String(t.minutes).padStart(2, "0")}:${String(t.seconds).padStart(2, "0")}`;
    };

    const refreshAttendance = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const attendances = await getAttendances({
                userId: user?._id ?? undefined,
                startDate: today,
                endDate: today,
            });
            const list = Array.isArray(attendances) ? attendances : (attendances as any)?.data ?? [];
            const todayAttendance = list.find((a: AttendanceResponse) => attendanceDateStr(a.date) === today);
            setAttendance(todayAttendance ?? null);
        } catch (error) {
            console.error("Failed to refresh attendance:", error);
        }
    };

    const handleClockIn = async () => {
        if (attendance?.clockIn && !attendance?.clockOut) {
            toast({
                title: "Already Clocked In",
                description: "You are already clocked in for today.",
                variant: "warning",
            });
            return;
        }
        const loggedUserId = user?._id;
        if (!loggedUserId) {
            toast({
                title: "Clock In Failed",
                description: "You must be logged in to clock in.",
                variant: "error",
            });
            return;
        }

        try {
            setClockingIn(true);
            const result = await clockIn({ id: loggedUserId, notes: null });
            setAttendance(result);
            toast({
                title: "Clocked In Successfully",
                description: "Your shift has started.",
                variant: "success",
            });
        } catch (error: any) {
            const msg =
                error?.response?.data?.error ??
                error?.response?.data?.message ??
                error?.message ??
                "Failed to clock in. Please try again.";
            const alreadyClockedIn =
                typeof msg === "string" && msg.toLowerCase().includes("already clocked in");
            if (alreadyClockedIn) {
                await refreshAttendance();
                toast({
                    title: "Already Clocked In",
                    description: "You are already clocked in for today. Your shift is being tracked.",
                    variant: "warning",
                });
            } else {
                toast({
                    title: "Clock In Failed",
                    description: msg,
                    variant: "error",
                });
            }
        } finally {
            setClockingIn(false);
        }
    };

    const handleClockOut = async () => {
        if (!attendance?.clockIn || attendance?.clockOut) {
            toast({
                title: "Cannot Clock Out",
                description: "You must be clocked in to clock out.",
                variant: "warning",
            });
            return;
        }
        const loggedUserId = user?._id;
        if (!loggedUserId) {
            toast({
                title: "Clock Out Failed",
                description: "You must be logged in to clock out.",
                variant: "error",
            });
            return;
        }

        try {
            setClockingOut(true);
            const result = await clockOut({ id: loggedUserId, notes: null });
            setAttendance(result);
            toast({
                title: "Clocked Out Successfully",
                description: "Your shift has been recorded.",
                variant: "success",
            });
        } catch (error: any) {
            console.error("Clock out failed:", error);
            const msg =
                error?.response?.data?.error ??
                error?.response?.data?.message ??
                error?.message ??
                "Failed to clock out. Please try again.";
            toast({
                title: "Clock Out Failed",
                description: msg,
                variant: "error",
            });
        } finally {
            setClockingOut(false);
        }
    };

    const isClockedIn = attendance?.clockIn && !attendance?.clockOut;

    // Calculate attendance stats
    const totalStaff = data.metrics.totalStaff;
    const staffOnLeave = data.metrics.staffOnLeave;
    const staffPresent = totalStaff - staffOnLeave;
    const attendancePercent = totalStaff > 0 ? (staffPresent / totalStaff) * 100 : 0;

    // Mock staff list (in real app, this would come from API)
    const staffList = [
        {
            name: "Mark Stevens",
            status: "present",
            checkIn: "08:30",
            avatar: "",
        },
        {
            name: "Elena Rossi",
            status: "present",
            checkIn: "09:02",
            avatar: "",
        },
        {
            name: "David Cho",
            status: "absent",
            checkIn: null,
            avatar: "",
        },
    ];

    // Mock fleet data (in real app, this would come from API)
    const fleetData = [
        {
            driverName: "Robert Fox",
            vehicle: "Mercedes S-Class (LD72 XYZ)",
            currentTask: "Pickup: Heathrow T5",
            status: "in_trip",
            avatar: "",
        },
        {
            driverName: "Jane Cooper",
            vehicle: "BMW 7 Series (BK23 ABC)",
            currentTask: "Standby: London City",
            status: "on_duty",
            avatar: "",
        },
    ];

    const onDutyCount = fleetData.filter((f) => f.status === "on_duty").length;
    const inTripCount = fleetData.filter((f) => f.status === "in_trip").length;
    const idleCount = fleetData.filter((f) => f.status === "idle").length;

    return (
        <div className="animate-in fade-in duration-500">
            {/* Branch Overview Header */}
            <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {MANAGER_DASHBOARD_STRINGS.BRANCH_OVERVIEW_TITLE}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {MANAGER_DASHBOARD_STRINGS.BRANCH_OVERVIEW_SUBTITLE}
                    </p>
                </div>
                <div className="min-w-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {MANAGER_DASHBOARD_STRINGS.CURRENT_TIME_LABEL}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {formatTime(currentTime)}
                                </span>
                                <span className="text-xs font-medium uppercase text-slate-500">
                                    {formatDate(currentTime)}
                                </span>
                            </div>
                        </div>
                        <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
                        {isClockedIn ? (
                            <>
                                <div className="flex flex-col">
                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                        {MANAGER_DASHBOARD_STRINGS.ON_SHIFT_LABEL}
                                    </span>
                                    <span className="text-2xl font-black text-[#137fec]">
                                        {formatShiftTime(shiftTime)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClockOut}
                                    disabled={clockingOut}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg bg-red-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-600",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    {clockingOut ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Clocking Out...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogOut className="h-5 w-5" />
                                            {MANAGER_DASHBOARD_STRINGS.CLOCK_OUT}
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Not Clocked In
                                    </span>
                                    <span className="text-lg font-bold text-slate-500">
                                        Clock in to start tracking
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClockIn}
                                    disabled={clockingIn}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg bg-[#137fec] px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#137fec]/90",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    {clockingIn ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Clocking In...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-5 w-5" />
                                            <span>Clock In</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label={MANAGER_DASHBOARD_STRINGS.STAT_ACTIVE_STAFF}
                    value={totalStaff}
                    trend="+2%"
                    trendPositive
                    icon={<Users className="h-5 w-5" />}
                    iconColor="text-[#137fec]"
                />
                <StatCard
                    label={MANAGER_DASHBOARD_STRINGS.STAT_TODAYS_ATTENDANCE}
                    value={`${staffPresent}/${totalStaff}`}
                    subtitle={MANAGER_DASHBOARD_STRINGS.STAFF_PRESENT}
                    progressPercent={attendancePercent}
                    icon={<CheckCircle className="h-5 w-5" />}
                    iconColor="text-emerald-500"
                />
                <StatCard
                    label={MANAGER_DASHBOARD_STRINGS.STAT_TODAYS_BOOKINGS}
                    value={data.metrics.tripsToday}
                    trend="-3%"
                    trendPositive={false}
                    icon={<Ticket className="h-5 w-5" />}
                    iconColor="text-[#137fec]"
                />
                <StatCard
                    label={MANAGER_DASHBOARD_STRINGS.STAT_PENDING_APPROVALS}
                    value={data.metrics.pendingTripAssignments}
                    isPending
                    icon={<AlertCircle className="h-5 w-5" />}
                    iconColor="text-orange-400"
                />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Weekly Booking Performance */}
                <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {MANAGER_DASHBOARD_STRINGS.CHART_WEEKLY_TITLE}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {MANAGER_DASHBOARD_STRINGS.CHART_WEEKLY_SUBTITLE}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-2xl font-black text-[#137fec]">
                                    {data.metrics.tripsToday * 8}
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                                    {MANAGER_DASHBOARD_STRINGS.CHART_VS_PREV}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative mt-auto h-64">
                        <WeeklyChartSvg />
                        <div className="mt-4 flex justify-between px-2">
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                                (day) => (
                                    <span
                                        key={day}
                                        className="text-[10px] font-bold uppercase text-slate-400"
                                    >
                                        {day}
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Staff Availability */}
                <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {MANAGER_DASHBOARD_STRINGS.STAFF_AVAILABILITY_TITLE}
                        </h3>
                        <Link
                            href={DASHBOARD_ROUTES.ATTENDANCE}
                            className="text-xs font-bold text-[#137fec] hover:underline"
                        >
                            {MANAGER_DASHBOARD_STRINGS.MANAGE_ROSTERS}
                        </Link>
                    </div>
                    <div className="max-h-80 flex flex-col gap-4 overflow-y-auto">
                        {staffList.map((staff, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex items-center gap-4 rounded-lg border p-3",
                                    staff.status === "present"
                                        ? "border-emerald-500/10 bg-emerald-500/5"
                                        : "border-red-500/10 bg-red-500/5 opacity-70"
                                )}
                            >
                                <div className="size-10 shrink-0 rounded-full bg-slate-300 bg-cover bg-center dark:bg-slate-700" />
                                <div className="min-w-0 flex-1 overflow-hidden">
                                    <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                        {staff.name}
                                    </h4>
                                    <p
                                        className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider",
                                            staff.status === "present"
                                                ? "text-emerald-500"
                                                : "text-red-500"
                                        )}
                                    >
                                        {staff.status === "present"
                                            ? `${MANAGER_DASHBOARD_STRINGS.PRESENT_STATUS} • ${MANAGER_DASHBOARD_STRINGS.IN_AT} ${staff.checkIn}`
                                            : `${MANAGER_DASHBOARD_STRINGS.ABSENT_STATUS} • ${MANAGER_DASHBOARD_STRINGS.NOT_CLOCKED_IN}`}
                                    </p>
                                </div>
                                {staff.status === "present" ? (
                                    <Radio className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto pt-6">
                        <div className="flex gap-3 rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            <div>
                                <p className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                    {MANAGER_DASHBOARD_STRINGS.LATE_ARRIVALS_TITLE}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                    {MANAGER_DASHBOARD_STRINGS.LATE_ARRIVALS_DESC}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Fleet Status */}
            <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {MANAGER_DASHBOARD_STRINGS.FLEET_STATUS_TITLE}
                    </h3>
                    <div className="flex gap-2">
                        <span className="rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                            {onDutyCount} {MANAGER_DASHBOARD_STRINGS.FLEET_ON_DUTY}
                        </span>
                        <span className="rounded bg-[#137fec]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#137fec]">
                            {inTripCount} {MANAGER_DASHBOARD_STRINGS.FLEET_IN_TRIP}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800">
                            {idleCount} {MANAGER_DASHBOARD_STRINGS.FLEET_IDLE}
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                                    {MANAGER_DASHBOARD_STRINGS.TABLE_HEAD_DRIVER}
                                </th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                                    {MANAGER_DASHBOARD_STRINGS.TABLE_HEAD_VEHICLE}
                                </th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                                    {MANAGER_DASHBOARD_STRINGS.TABLE_HEAD_CURRENT_TASK}
                                </th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                                    {MANAGER_DASHBOARD_STRINGS.TABLE_HEAD_STATUS}
                                </th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                                    {MANAGER_DASHBOARD_STRINGS.TABLE_HEAD_ACTION}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {fleetData.map((fleet, idx) => (
                                <tr
                                    key={idx}
                                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-slate-300 bg-cover bg-center dark:bg-slate-700" />
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {fleet.driverName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {fleet.vehicle}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {fleet.currentTask}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                fleet.status === "in_trip"
                                                    ? "bg-[#137fec]/10 text-[#137fec]"
                                                    : "bg-emerald-500/10 text-emerald-500"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "size-1.5 rounded-full",
                                                    fleet.status === "in_trip"
                                                        ? "bg-[#137fec] animate-pulse"
                                                        : "bg-emerald-500"
                                                )}
                                            />
                                            {fleet.status === "in_trip"
                                                ? MANAGER_DASHBOARD_STRINGS.STATUS_IN_TRIP
                                                : MANAGER_DASHBOARD_STRINGS.STATUS_ON_DUTY}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            type="button"
                                            className="text-slate-400 transition-colors hover:text-[#137fec]"
                                        >
                                            <Map className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
