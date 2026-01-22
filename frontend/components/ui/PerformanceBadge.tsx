"use client";

import React from "react";
import { DriverPerformanceCategory, PERFORMANCE_CATEGORY_CONFIG } from "@/lib/types/driver";

interface PerformanceBadgeProps {
  category: DriverPerformanceCategory;
  score?: number;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PerformanceBadge({
  category,
  score,
  showScore = false,
  size = "md",
}: PerformanceBadgeProps) {
  const config = PERFORMANCE_CATEGORY_CONFIG[category];
  
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses[size]}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
    >
      <span
        className="w-2 h-2 rounded-full mr-1.5"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
      {showScore && score !== undefined && (
        <span className="ml-1.5 opacity-75">({score})</span>
      )}
    </span>
  );
}
