"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/hooks";
import { fetchFranchises } from "@/lib/features/franchise/franchiseSlice";
import { setFranchiseList, setSelectedFranchise } from "@/lib/features/auth/authSlice";
import { getFranchiseById, updateFranchise } from "@/lib/features/franchise/franchiseApi";
import type { FranchiseDetailData } from "@/lib/features/franchise/franchiseApi";
import { useToast } from "@/components/ui/toast";
import { FRANCHISE_STRINGS } from "@/lib/constants/franchise";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";
import { X, Upload, Save, MapPin, Info, User, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

const STORE_IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg";
const STORE_IMAGE_MAX_MB = 5;
const STORE_IMAGE_MAX_BYTES = STORE_IMAGE_MAX_MB * 1024 * 1024;

interface EditFranchiseFormProps {
    franchiseId: string;
    onClose: () => void;
}

export function EditFranchiseForm({ franchiseId, onClose }: EditFranchiseFormProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        region: "",
        address: "",
        phone: "",
        managerName: "",
        franchiseEmail: "",
        storeImage: null as string | null,
        legalDocumentsCollected: false,
    });

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        getFranchiseById(franchiseId)
            .then((data: FranchiseDetailData) => {
                if (cancelled) return;
                setFormData({
                    name: data.name ?? "",
                    region: data.region ?? data.city ?? "",
                    address: data.address ?? "",
                    phone: data.phone ?? "",
                    managerName: data.inchargeName ?? "",
                    franchiseEmail: data.staff?.[0]?.email ?? "",
                    storeImage: data.storeImage ?? null,
                    legalDocumentsCollected: data.legalDocumentsCollected ?? false,
                });
            })
            .catch((err) => {
                if (!cancelled) {
                    const msg =
                        err?.response?.data?.error ||
                        err?.response?.data?.message ||
                        err?.message ||
                        "Failed to load franchise";
                    setLoadError(msg);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [franchiseId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateFranchise(franchiseId, {
                name: formData.name,
                region: formData.region,
                address: formData.address,
                phone: formData.phone,
                managerName: formData.managerName,
                franchiseEmail: formData.franchiseEmail || undefined,
                storeImage:
                    formData.storeImage?.startsWith("http")
                        ? formData.storeImage
                        : formData.storeImage === null
                          ? null
                          : undefined,
                legalDocumentsCollected: formData.legalDocumentsCollected,
            });
            const franchises = await dispatch(fetchFranchises()).unwrap();
            if (franchises.length > 0) {
                dispatch(setFranchiseList(franchises));
                const updated = franchises.find((f) => f._id === franchiseId);
                if (updated) dispatch(setSelectedFranchise(updated));
            }
            toast({ title: "Success", description: "Franchise updated successfully.", variant: "success" });
            onClose();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
            const msg =
                err?.response?.data?.error ??
                err?.response?.data?.message ??
                err?.message ??
                "Failed to update franchise";
            toast({ title: "Error", description: msg, variant: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleStoreImageChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
                toast({ title: "Invalid format", description: "Use PNG or JPG only.", variant: "error" });
                return;
            }
            if (file.size > STORE_IMAGE_MAX_BYTES) {
                toast({ title: "File too large", description: `Max ${STORE_IMAGE_MAX_MB}MB.`, variant: "error" });
                return;
            }
            const reader = new FileReader();
            reader.onload = () => setFormData((prev) => ({ ...prev, storeImage: reader.result as string }));
            reader.readAsDataURL(file);
            e.target.value = "";
        },
        [toast]
    );

    const removeStoreImage = useCallback(() => {
        setFormData((prev) => ({ ...prev, storeImage: null }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-6 md:p-8">
                <div className="flex items-center justify-center min-h-[300px] text-slate-500 dark:text-slate-400 text-sm">
                    Loading franchise…
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="max-w-5xl mx-auto p-6 md:p-8">
                <div className="flex flex-col gap-4">
                    <p className="text-red-500 dark:text-red-400 text-sm">{loadError}</p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        {FRANCHISE_STRINGS.BTN_CANCEL}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-4" aria-label="Breadcrumb">
                <button
                    type="button"
                    onClick={() => router.push(DASHBOARD_ROUTES.HOME)}
                    className="text-theme-blue hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit"
                >
                    {FRANCHISE_STRINGS.BREADCRUMB_DASHBOARD}
                </button>
                <span className="text-slate-400" aria-hidden="true">/</span>
                <button
                    type="button"
                    onClick={() => router.push(DASHBOARD_ROUTES.FRANCHISES)}
                    className="text-theme-blue hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit"
                >
                    {FRANCHISE_STRINGS.BREADCRUMB_FRANCHISES}
                </button>
                <span className="text-slate-400" aria-hidden="true">/</span>
                <span className="text-slate-900 dark:text-white">{FRANCHISE_STRINGS.BREADCRUMB_EDIT}</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {FRANCHISE_STRINGS.EDIT_PAGE_TITLE}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{FRANCHISE_STRINGS.EDIT_PAGE_SUBTITLE}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        {FRANCHISE_STRINGS.BTN_CANCEL}
                    </button>
                    <button
                        type="submit"
                        form="franchise-edit-form"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-lg bg-theme-blue text-white text-sm font-bold hover:bg-theme-blue/90 shadow-lg shadow-theme-blue/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="size-5" />
                                <span>{FRANCHISE_STRINGS.BTN_SAVE_CHANGES}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <form id="franchise-edit-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Info className="size-5 text-theme-blue" />
                            {FRANCHISE_STRINGS.SECTION_BASICS}
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex flex-col items-center gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={STORE_IMAGE_ACCEPT}
                                    onChange={handleStoreImageChange}
                                    className="hidden"
                                    id="franchise-logo-edit"
                                />
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => fileInputRef.current?.click()}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            fileInputRef.current?.click();
                                        }
                                    }}
                                    className={cn(
                                        "size-32 rounded-xl border-2 border-dashed bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden relative group transition-colors",
                                        "border-slate-300 dark:border-slate-700 hover:border-theme-blue"
                                    )}
                                >
                                    {formData.storeImage ? (
                                        <>
                                            <img src={formData.storeImage} alt="Logo" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeStoreImage();
                                                }}
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                aria-label="Remove logo"
                                            >
                                                <X className="size-8 text-white" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="size-8 text-slate-400 group-hover:text-theme-blue transition-colors" />
                                            <p className="text-[10px] font-bold text-slate-400 text-center px-2">
                                                {FRANCHISE_STRINGS.LOGO_UPLOAD_HINT}
                                            </p>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 font-medium">{FRANCHISE_STRINGS.LOGO_RECOMMENDED}</p>
                            </div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {FRANCHISE_STRINGS.LABEL_FRANCHISE_NAME}
                                    </label>
                                    <input
                                        required
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder={FRANCHISE_STRINGS.PLACEHOLDER_FRANCHISE_NAME}
                                        type="text"
                                        className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-theme-blue text-sm p-3 text-slate-900 dark:text-white placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {FRANCHISE_STRINGS.LABEL_LOCATION_CODE}
                                    </label>
                                    <input
                                        required
                                        name="region"
                                        value={formData.region}
                                        onChange={handleChange}
                                        placeholder={FRANCHISE_STRINGS.PLACEHOLDER_LOCATION_CODE}
                                        type="text"
                                        className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-theme-blue text-sm p-3 text-slate-900 dark:text-white placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {FRANCHISE_STRINGS.LABEL_PHYSICAL_ADDRESS}
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                                        <input
                                            required
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder={FRANCHISE_STRINGS.PLACEHOLDER_PHYSICAL_ADDRESS}
                                            type="text"
                                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-theme-blue text-sm p-3 pl-10 text-slate-900 dark:text-white placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {FRANCHISE_STRINGS.LABEL_BUSINESS_EMAIL}
                                    </label>
                                    <input
                                        type="email"
                                        name="franchiseEmail"
                                        value={formData.franchiseEmail}
                                        onChange={handleChange}
                                        placeholder={FRANCHISE_STRINGS.PLACEHOLDER_BUSINESS_EMAIL}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-theme-blue text-sm p-3 text-slate-900 dark:text-white placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {FRANCHISE_STRINGS.LABEL_SUPPORT_PHONE}
                                    </label>
                                    <input
                                        required
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder={FRANCHISE_STRINGS.PLACEHOLDER_SUPPORT_PHONE}
                                        type="tel"
                                        className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-theme-blue text-sm p-3 text-slate-900 dark:text-white placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <User className="size-5 text-theme-blue" />
                            {FRANCHISE_STRINGS.SECTION_MANAGER}
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2 md:col-span-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {FRANCHISE_STRINGS.LABEL_FULL_NAME}
                                </label>
                                <input
                                    required
                                    name="managerName"
                                    value={formData.managerName}
                                    onChange={handleChange}
                                    placeholder={FRANCHISE_STRINGS.PLACEHOLDER_MANAGER_NAME}
                                    type="text"
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-theme-blue text-sm p-3 text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-4">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Scale className="size-5 text-theme-blue" />
                            {FRANCHISE_STRINGS.SECTION_COMPLIANCE}
                        </h2>
                        <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase px-2 py-1 rounded tracking-widest">
                            {FRANCHISE_STRINGS.COMPLIANCE_PENDING}
                        </span>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-3 p-4 bg-theme-blue/5 rounded-lg border border-theme-blue/10">
                            <input
                                type="checkbox"
                                id="docs-master-edit"
                                name="legalDocumentsCollected"
                                checked={formData.legalDocumentsCollected}
                                onChange={handleChange}
                                className="size-5 rounded border-slate-300 dark:border-slate-700 text-theme-blue focus:ring-theme-blue"
                            />
                            <label htmlFor="docs-master-edit" className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer">
                                {FRANCHISE_STRINGS.LABEL_ALL_DOCS_COLLECTED}
                            </label>
                            <p className="text-xs text-slate-500 ml-auto hidden md:block">
                                {FRANCHISE_STRINGS.LABEL_DOCS_COLLECTED_HINT}
                            </p>
                        </div>
                    </div>
                </section>
            </form>
        </div>
    );
}
