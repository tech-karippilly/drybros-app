"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Staff } from "@/lib/types/staff";
import { STAFF_STRINGS } from "@/lib/constants/staff";

interface StatusBadgeProps {
    status: Staff["status"];
    duration?: string;
    /** When true, shows dot + label style (Active / On Break / Inactive) */
    variant?: "badge" | "dot";
    className?: string;
}

function normalizeStatus(s: Staff["status"]): "active" | "onBreak" | "inactive" {
    const lower = String(s).toLowerCase();
    if (lower === "active" || lower === "act") return "active";
    if (lower === "suspended" || lower === "suspend") return "onBreak";
    return "inactive"; // fired, block, blocked, etc.
}

export function StatusBadge({ status, duration, variant = "badge", className }: StatusBadgeProps) {
    const kind = normalizeStatus(status);

    const dotStyles = {
        active: "text-emerald-600 dark:text-emerald-400",
        onBreak: "text-amber-600 dark:text-amber-400",
        inactive: "text-slate-400 dark:text-slate-500",
    };

    const labelMap = {
        active: STAFF_STRINGS.STATUS_ACTIVE_LABEL,
        onBreak: STAFF_STRINGS.STATUS_ON_BREAK,
        inactive: STAFF_STRINGS.STATUS_INACTIVE,
    };

    const badgeStyles = {
        active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-500",
        onBreak: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500",
        inactive: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    };

    if (variant === "dot") {
        return (
            <div className={cn("flex items-center gap-1.5", dotStyles[kind], className)}>
                <span className="size-2 rounded-full bg-current shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wide">{labelMap[kind]}</span>
            </div>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap",
                badgeStyles[kind],
                className
            )}
        >
            <span className="size-1.5 rounded-full bg-current" />
            {labelMap[kind]}
            {duration && ` (${duration})`}
        </span>
    );
}
