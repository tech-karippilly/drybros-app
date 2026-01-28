"use client";

import React, { useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createStaffMember, updateStaffMember } from "@/lib/features/staff/staffSlice";
import { useToast } from "@/components/ui/toast";
import { STAFF_STRINGS } from "@/lib/constants/staff";
import {
    X,
    Upload,
    Save,
    User,
    Mail,
    Phone,
    MapPin,
    Building,
    Shield,
    RotateCcw,
    FileText,
    Users,
    AlertCircle,
    ArrowLeft,
    Badge,
    Home,
    CheckSquare,
    Copy,
} from "lucide-react";
import { Staff } from "@/lib/types/staff";
import { generateStaffPassword } from "@/lib/utils/staff-utils";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPES = ["Govt Identity", "Address Proof", "Educational Certificates", "Previous Experience", "Police Verification"] as const;

/** Compliance items for page variant (label, hint, doc key) */
const COMPLIANCE_ITEMS_PAGE = [
    { label: STAFF_STRINGS.GOVT_VERIFICATION, hint: STAFF_STRINGS.GOVT_VERIFICATION_HINT, doc: "Govt Identity" as const },
    { label: STAFF_STRINGS.ADDRESS_PROOF, hint: STAFF_STRINGS.ADDRESS_PROOF_HINT, doc: "Address Proof" as const },
    { label: STAFF_STRINGS.EDUCATION_CERT, hint: STAFF_STRINGS.EDUCATION_CERT_HINT, doc: "Educational Certificates" as const },
] as const;

const INPUT_CLASSES =
    "w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-theme-blue/20 dark:text-white font-medium";
const INPUT_PAGE =
    "rounded-lg border border-slate-200 dark:border-[#324d67] bg-slate-50 dark:bg-[#111a22] p-2.5 text-sm text-slate-900 dark:text-white focus:border-theme-blue focus:ring-1 focus:ring-theme-blue outline-none";

interface CreateStaffFormProps {
    onClose: () => void;
    editingStaff?: Staff | null;
    variant?: "modal" | "page";
}

export function CreateStaffForm({ onClose, editingStaff, variant = "modal" }: CreateStaffFormProps) {
    const dispatch = useAppDispatch();
    const { list: franchises } = useAppSelector((state) => state.franchise);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getInitialFormData = useCallback((): Partial<Staff> => {
        if (editingStaff) {
            return {
                ...editingStaff,
                name: editingStaff.name || "",
                email: editingStaff.email || "",
                phone: editingStaff.phone || "",
                password: editingStaff.password || generateStaffPassword(),
                franchiseId: editingStaff.franchiseId || "",
                salary: editingStaff.monthlySalary ?? editingStaff.salary ?? 0,
                monthlySalary: editingStaff.monthlySalary ?? editingStaff.salary ?? 0,
                address: editingStaff.address || "",
                emergencyContact: editingStaff.emergencyContact || "",
                relationship: editingStaff.emergencyContactRelation || editingStaff.relationship || "",
                emergencyContactRelation: editingStaff.emergencyContactRelation || editingStaff.relationship || "",
                documentsCollected: [
                    editingStaff.govtId ? "Govt Identity" : "",
                    editingStaff.addressProof ? "Address Proof" : "",
                    editingStaff.certificates ? "Educational Certificates" : "",
                    editingStaff.previousExperienceCert ? "Previous Experience" : "",
                ].filter(Boolean),
                status: editingStaff.status || "active",
            };
        }
        return {
            name: "",
            email: "",
            phone: "",
            password: generateStaffPassword(),
            franchiseId: "",
            salary: 0,
            monthlySalary: 0,
            address: "",
            emergencyContact: "",
            relationship: "",
            emergencyContactRelation: "",
            documentsCollected: [],
            status: "active",
        };
    }, [editingStaff]);

    const [formData, setFormData] = useState<Partial<Staff>>(getInitialFormData);

    const handleGeneratePassword = useCallback(() => {
        setFormData((prev) => ({ ...prev, password: generateStaffPassword() }));
    }, []);

    const handleCopyPassword = useCallback(() => {
        const p = formData.password || "";
        if (!p) return;
        navigator.clipboard.writeText(p).then(
            () => toast({ title: "Copied", description: "Password copied to clipboard", variant: "success" }),
            () => toast({ title: "Error", description: "Could not copy", variant: "error" })
        );
    }, [formData.password, toast]);

    const getErrorMessage = useCallback((error: unknown, defaultMessage: string): string => {
        const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
        return err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? defaultMessage;
    }, []);

    const buildDocumentFlags = useCallback((documentsCollected: string[] = []) => {
        return {
            govtId: documentsCollected.includes("Govt Identity"),
            addressProof: documentsCollected.includes("Address Proof"),
            certificates: documentsCollected.includes("Educational Certificates"),
            previousExperienceCert: documentsCollected.includes("Previous Experience"),
        };
    }, []);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
                const docFlags = buildDocumentFlags(formData.documentsCollected);
                const staffId = editingStaff?.id || editingStaff?._id || "";

                if (editingStaff) {
                    await dispatch(
                        updateStaffMember({
                            id: staffId,
                            data: {
                                name: formData.name || "",
                                email: formData.email || "",
                                phone: formData.phone || "",
                                franchiseId: formData.franchiseId || "",
                                monthlySalary: Number(formData.salary) || formData.monthlySalary || 0,
                                address: formData.address || "",
                                emergencyContact: formData.emergencyContact || "",
                                emergencyContactRelation: formData.relationship || formData.emergencyContactRelation || "",
                                ...docFlags,
                                profilePic: formData.profilePic || null,
                            },
                        })
                    ).unwrap();
                    toast({ title: "Success", description: "Staff member updated successfully", variant: "success" });
                } else {
                    if (!formData.password) {
                        toast({ title: "Error", description: "Password is required", variant: "error" });
                        setIsSubmitting(false);
                        return;
                    }
                    await dispatch(
                        createStaffMember({
                            name: formData.name || "",
                            email: formData.email || "",
                            phone: formData.phone || "",
                            password: formData.password || "",
                            franchiseId: formData.franchiseId || "",
                            monthlySalary: Number(formData.salary) || 0,
                            address: formData.address || "",
                            emergencyContact: formData.emergencyContact || "",
                            emergencyContactRelation: formData.relationship || "",
                            ...docFlags,
                            profilePic: formData.profilePic || null,
                        })
                    ).unwrap();
                    toast({ title: "Success", description: "Staff member created successfully", variant: "success" });
                }
                onClose();
            } catch (error) {
                toast({
                    title: "Error",
                    description: getErrorMessage(
                        error,
                        editingStaff ? "Failed to update staff member" : "Failed to create staff member"
                    ),
                    variant: "error",
                });
            } finally {
                setIsSubmitting(false);
            }
        },
        [formData, editingStaff, dispatch, toast, onClose, buildDocumentFlags, getErrorMessage]
    );

    const handleDocToggle = useCallback((doc: string) => {
        setFormData((prev) => {
            const docs = prev.documentsCollected || [];
            if (docs.includes(doc)) return { ...prev, documentsCollected: docs.filter((d) => d !== doc) };
            return { ...prev, documentsCollected: [...docs, doc] };
        });
    }, []);

    const handleFieldChange = useCallback((field: keyof Staff) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = field === "salary" ? Number((e.target as HTMLInputElement).value) : e.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const inputClasses = variant === "page" ? INPUT_PAGE : INPUT_CLASSES;

    const formContent = (
        <form onSubmit={handleSubmit} className={variant === "page" ? "space-y-8 pb-20" : ""}>
            {variant === "page" ? (
                <>
                    {/* Section 1: Profile & Password */}
                    <div className="bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <div className="bg-slate-100 dark:bg-[#233648] aspect-square rounded-full size-32 border-4 border-slate-200 dark:border-[#324d67] flex items-center justify-center overflow-hidden">
                                            <User className="size-12 text-slate-400 dark:text-[#92adc9]" />
                                        </div>
                                        <label className="absolute bottom-1 right-1 bg-theme-blue text-white p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                                            <Upload className="size-5" />
                                            <input type="file" className="hidden" accept="image/*" />
                                        </label>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-900 dark:text-white text-sm font-bold">{STAFF_STRINGS.PROFILE_PHOTO}</p>
                                        <p className="text-slate-500 dark:text-[#92adc9] text-xs max-w-[150px]">{STAFF_STRINGS.PROFILE_PHOTO_HINT}</p>
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="p-5 rounded-lg border border-theme-blue/30 bg-theme-blue/5 dark:bg-theme-blue/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-slate-900 dark:text-white text-sm font-bold leading-tight">{STAFF_STRINGS.AUTO_PASSWORD}</p>
                                            <p className="text-theme-blue text-xl font-mono font-bold tracking-widest">{formData.password || "—"}</p>
                                            <p className="text-slate-500 dark:text-[#92adc9] text-xs">{STAFF_STRINGS.TEMP_PASSWORD_HINT}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={handleGeneratePassword} className="flex items-center justify-center rounded-lg h-9 px-4 bg-theme-blue text-white text-xs font-bold hover:bg-theme-blue/90 transition-colors">
                                                <RotateCcw className="size-4 mr-2" />
                                                {STAFF_STRINGS.REGENERATE}
                                            </button>
                                            <button type="button" onClick={handleCopyPassword} className="flex items-center justify-center rounded-lg h-9 px-3 bg-slate-200 dark:bg-[#233648] text-slate-700 dark:text-white text-xs font-bold hover:bg-slate-300 dark:hover:bg-[#324d67] transition-colors">
                                                <Copy className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Personal Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge className="size-5 text-theme-blue" />
                            <h3 className="text-slate-900 dark:text-white text-lg font-bold">{STAFF_STRINGS.PERSONAL_DETAILS}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-6 bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-xl">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-[#92adc9]">{STAFF_STRINGS.FULL_NAME}</label>
                                <input required value={formData.name || ""} onChange={handleFieldChange("name")} placeholder="John Doe" type="text" className={inputClasses} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-[#92adc9]">{STAFF_STRINGS.PHONE_NUMBER}</label>
                                <input required value={formData.phone || ""} onChange={handleFieldChange("phone")} placeholder="+91 00000 00000" type="tel" className={inputClasses} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-[#92adc9]">{STAFF_STRINGS.EMAIL_ADDRESS}</label>
                                <input required type="email" value={formData.email || ""} onChange={handleFieldChange("email")} placeholder="john@dybros.com" className={inputClasses} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-[#92adc9]">{STAFF_STRINGS.MONTHLY_SALARY_INR}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                    <input required type="number" value={formData.salary || ""} onChange={handleFieldChange("salary")} placeholder="25,000" className={cn(inputClasses, "pl-8")} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-[#92adc9]">{STAFF_STRINGS.FRANCHISE_SELECTION}</label>
                                <select required value={formData.franchiseId || ""} onChange={handleFieldChange("franchiseId")} className={inputClasses}>
                                    <option value="">{STAFF_STRINGS.SELECT_FRANCHISE}</option>
                                    {franchises.map((f) => (
                                        <option key={f._id} value={f._id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Address & Emergency Contact */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Home className="size-5 text-theme-blue" />
                            <h3 className="text-slate-900 dark:text-white text-lg font-bold">{STAFF_STRINGS.ADDRESS_EMERGENCY}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-xl">
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-[#92adc9]">{STAFF_STRINGS.FULL_ADDRESS}</label>
                                <textarea required value={formData.address || ""} onChange={handleFieldChange("address")} placeholder={STAFF_STRINGS.FULL_ADDRESS_PLACEHOLDER} rows={2} className={inputClasses} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-[#92adc9]">{STAFF_STRINGS.EMERGENCY_CONTACT_NAME}</label>
                                <input value={formData.emergencyContact || ""} onChange={handleFieldChange("emergencyContact")} placeholder={STAFF_STRINGS.EMERGENCY_CONTACT_PLACEHOLDER} type="text" className={inputClasses} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-[#92adc9]">{STAFF_STRINGS.RELATIONSHIP}</label>
                                <input value={formData.relationship || ""} onChange={handleFieldChange("relationship")} placeholder={STAFF_STRINGS.RELATIONSHIP_PLACEHOLDER} type="text" className={inputClasses} />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Compliance Checklist */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="size-5 text-theme-blue" />
                            <h3 className="text-slate-900 dark:text-white text-lg font-bold">{STAFF_STRINGS.COMPLIANCE_CHECKLIST}</h3>
                        </div>
                        <div className="bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-[#233648]">
                            {COMPLIANCE_ITEMS_PAGE.map(({ label, hint, doc }) => (
                                <div key={doc} className="flex flex-wrap items-center justify-between p-4 gap-4">
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={formData.documentsCollected?.includes(doc)}
                                            onChange={() => handleDocToggle(doc)}
                                            className="size-5 rounded border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#111a22] text-theme-blue focus:ring-theme-blue"
                                        />
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
                                            <p className="text-xs text-slate-500 dark:text-[#92adc9]">{hint}</p>
                                        </div>
                                    </div>
                                    <button type="button" className="flex items-center gap-2 text-theme-blue hover:text-theme-blue/80 transition-colors text-xs font-bold bg-theme-blue/5 dark:bg-theme-blue/10 px-3 py-1.5 rounded-lg border border-theme-blue/20">
                                        <Upload className="size-4" />
                                        {STAFF_STRINGS.UPLOAD_DOCUMENT}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-slate-200 dark:border-[#233648]">
                        <button type="button" onClick={onClose} className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            {STAFF_STRINGS.DISCARD_CHANGES}
                        </button>
                        <button type="submit" disabled={isSubmitting} className="w-full sm:w-80 px-8 py-3 bg-theme-blue text-white text-sm font-bold rounded-lg shadow-xl shadow-theme-blue/30 hover:bg-theme-blue/90 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? "Saving..." : STAFF_STRINGS.REGISTER_STAFF_MEMBER}
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 flex items-center gap-6">
                            <div className="size-24 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center text-[#49659c] hover:border-theme-blue/40 hover:bg-theme-blue/5 transition-all cursor-pointer group">
                                <Upload size={24} className="group-hover:text-theme-blue transition-colors" />
                            </div>
                            <div>
                                <h4 className="font-bold dark:text-white">Profile Picture</h4>
                                <p className="text-sm text-[#49659c]">PNG, JPG up to 5MB.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2"><User size={14} /> Full Name</label>
                            <input required value={formData.name || ""} onChange={handleFieldChange("name")} placeholder="e.g. Rahul Sharma" className={inputClasses} />
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2"><Mail size={14} /> Email</label>
                            <input required type="email" value={formData.email || ""} onChange={handleFieldChange("email")} placeholder="rahul@example.com" className={inputClasses} />
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2"><Phone size={14} /> Phone</label>
                            <input required value={formData.phone || ""} onChange={handleFieldChange("phone")} placeholder="+91 00000 00000" className={inputClasses} />
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2"><Shield size={14} /> Password</label>
                            <div className="relative">
                                <input required readOnly={!!editingStaff} value={formData.password || ""} onChange={handleFieldChange("password")} className={cn("w-full pl-4 pr-12 py-3", inputClasses)} />
                                <button type="button" onClick={handleGeneratePassword} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-theme-blue hover:bg-theme-blue/10 rounded-lg"> <RotateCcw size={18} /> </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2"><Building size={14} /> Franchise</label>
                            <select required value={formData.franchiseId || ""} onChange={handleFieldChange("franchiseId")} className={inputClasses}>
                                <option value="">Select Franchise</option>
                                {franchises.map((f) => (
                                    <option key={f._id} value={f._id}>{f.name} ({f.code})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">Monthly Salary (INR)</label>
                            <input required type="number" value={formData.salary || 0} onChange={handleFieldChange("salary")} placeholder="25000" className={inputClasses} />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2"><MapPin size={14} /> Address</label>
                            <input required value={formData.address || ""} onChange={handleFieldChange("address")} placeholder="House no, Street, City, State" className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2"><AlertCircle size={14} /> Emergency Contact</label>
                            <input value={formData.emergencyContact || ""} onChange={handleFieldChange("emergencyContact")} placeholder="+91 00000 00000" className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2"><Users size={14} /> Relationship</label>
                            <input value={formData.relationship || ""} onChange={handleFieldChange("relationship")} placeholder="e.g. Father, Spouse" className={inputClasses} />
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2"><FileText size={14} /> Documents</label>
                            <div className="flex flex-wrap gap-3">
                                {DOCUMENT_TYPES.map((doc) => (
                                    <label key={doc} className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer hover:border-theme-blue/40">
                                        <input type="checkbox" checked={formData.documentsCollected?.includes(doc)} onChange={() => handleDocToggle(doc)} className="size-4 rounded border-gray-300 text-theme-blue focus:ring-theme-blue" />
                                        <span className="text-sm font-bold text-[#49659c] dark:text-white">{doc}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 flex gap-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold text-[#49659c] hover:bg-gray-50 dark:hover:bg-gray-700">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="flex-[2] bg-theme-blue text-white py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-theme-blue/90 shadow-xl shadow-theme-blue/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Save size={20} />
                            <span>{isSubmitting ? "Saving..." : editingStaff ? "Update Profile" : "Confirm Enrollment"}</span>
                        </button>
                    </div>
                </>
            )}
        </form>
    );

    if (variant === "page") {
        return (
            <div className="flex-1 max-w-4xl px-4 md:px-0">
                <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">{STAFF_STRINGS.ONBOARDING_TITLE}</h1>
                        <p className="text-slate-500 dark:text-[#92adc9] text-base font-normal">{STAFF_STRINGS.ONBOARDING_SUBTITLE}</p>
                    </div>
                    <button type="button" onClick={onClose} className="flex items-center justify-center rounded-lg h-10 px-4 bg-slate-200 dark:bg-[#233648] text-slate-700 dark:text-white text-sm font-bold hover:bg-slate-300 dark:hover:bg-[#324d67] transition-all">
                        <ArrowLeft className="size-5 mr-2" />
                        {STAFF_STRINGS.BACK_TO_LIST}
                    </button>
                </div>
                {formContent}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#0d121c]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#101622] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 z-10 px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">{editingStaff ? "Update Staff Member" : "New Staff Enrollment"}</h3>
                        <p className="text-xs text-[#49659c] font-medium uppercase tracking-wider mt-1">Personnel management & operational setup</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-[#49659c]">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-8">{formContent}</div>
            </div>
        </div>
    );
}
