"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Shield, Car, RotateCcw, Route, AlertTriangle, Briefcase, Users, Target, Award, Lock, Eye, FileText, Clock, AlertCircle, CreditCard, CheckCircle, Ban, DollarSign, FileWarning, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type PolicySection = 
    | 'about-company'
    | 'customer-privacy'
    | 'customer-driver-policy'
    | 'customer-cancellation'
    | 'driver-trip-rules'
    | 'driver-penalties'
    | 'staff-policies';

interface SubMenuItem {
    id: PolicySection;
    label: string;
    icon: React.ReactNode;
}

interface MenuCategory {
    id: string;
    label: string;
    icon: React.ReactNode;
    items: SubMenuItem[];
}

const menuCategories: MenuCategory[] = [
    {
        id: 'customer',
        label: 'Customer',
        icon: <Users size={18} />,
        items: [
            { id: 'customer-privacy', label: 'Privacy Policy', icon: <Shield size={16} /> },
            { id: 'customer-driver-policy', label: 'Driver Policy', icon: <Car size={16} /> },
            { id: 'customer-cancellation', label: 'Cancellation & Refund', icon: <RotateCcw size={16} /> },
        ]
    },
    {
        id: 'driver',
        label: 'Driver',
        icon: <Car size={18} />,
        items: [
            { id: 'driver-trip-rules', label: 'Trip Rules', icon: <Route size={16} /> },
            { id: 'driver-penalties', label: 'Detection & Penalties', icon: <AlertTriangle size={16} /> },
        ]
    },
    {
        id: 'staff',
        label: 'Staff',
        icon: <Briefcase size={18} />,
        items: [
            { id: 'staff-policies', label: 'Staff Policies', icon: <FileText size={16} /> },
        ]
    },
];

export default function PoliciesPage() {
    const [activeSection, setActiveSection] = useState<PolicySection>('about-company');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['customer']));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link 
                            href="/" 
                            className="flex items-center gap-2 text-[#0d59f2] hover:text-[#0d59f2]/80 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-semibold">Back to Home</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 bg-[#0d59f2] rounded-xl flex items-center justify-center">
                                <span className="text-white text-xl font-bold italic">D</span>
                            </div>
                            <span className="text-xl font-bold text-[#0d121c] dark:text-white">DRybros</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Menu */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 sticky top-24">
                            <h2 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">Policies</h2>
                            
                            {/* About Company - Top Level */}
                            <div className="mb-4">
                                <button
                                    onClick={() => setActiveSection('about-company')}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                        activeSection === 'about-company'
                                            ? "bg-[#0d59f2] text-white"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <Building2 size={18} />
                                    <span>About Company</span>
                                </button>
                            </div>

                            {/* Privacy & Policies Section */}
                            <div className="mb-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#49659c] mb-2 px-2">Privacy & Policies</h3>
                                
                                {menuCategories.map((category) => {
                                    const isExpanded = expandedCategories.has(category.id);
                                    const hasActiveItem = category.items.some(item => item.id === activeSection);
                                    
                                    return (
                                        <div key={category.id} className="mb-2">
                                            <button
                                                onClick={() => {
                                                    const newExpanded = new Set(expandedCategories);
                                                    if (isExpanded) {
                                                        newExpanded.delete(category.id);
                                                    } else {
                                                        newExpanded.add(category.id);
                                                    }
                                                    setExpandedCategories(newExpanded);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                                    hasActiveItem
                                                        ? "bg-[#0d59f2]/10 text-[#0d59f2]"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {category.icon}
                                                    <span>{category.label}</span>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronDown size={16} />
                                                ) : (
                                                    <ChevronRight size={16} />
                                                )}
                                            </button>
                                            
                                            {isExpanded && (
                                                <nav className="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                                                    {category.items.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => setActiveSection(item.id)}
                                                            className={cn(
                                                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                                                                activeSection === item.id
                                                                    ? "bg-[#0d59f2] text-white"
                                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                                                            )}
                                                        >
                                                            {item.icon}
                                                            <span>{item.label}</span>
                                                        </button>
                                                    ))}
                                                </nav>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 md:p-12">
                            {activeSection === 'about-company' && <AboutCompanyContent />}
                            {activeSection === 'customer-privacy' && <PrivacyPolicyContent />}
                            {activeSection === 'customer-driver-policy' && <DriverPolicyContent />}
                            {activeSection === 'customer-cancellation' && <CancellationRefundContent />}
                            {activeSection === 'driver-trip-rules' && <TripRulesContent />}
                            {activeSection === 'driver-penalties' && <DetectionPenaltiesContent />}
                            {activeSection === 'staff-policies' && <StaffPoliciesContent />}
                        </div>
                    </main>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>&copy; {new Date().getFullYear()} DRybros Inc. All rights reserved.</p>
                        <p className="mt-2">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Content Components
function AboutCompanyContent() {
    return (
        <>
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#0d121c] dark:text-white mb-4">About DRybros</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">Your trusted partner in premium transportation services</p>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none">
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Building2 className="text-[#0d59f2]" size={28} />
                        Our Company
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        DRybros is a leading transportation service provider committed to delivering exceptional travel experiences. 
                        Founded with a vision to revolutionize the way people travel, we have grown into a trusted name in the 
                        transportation industry.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        Our mission is to provide safe, reliable, and comfortable transportation services while maintaining the 
                        highest standards of customer satisfaction. We operate with integrity, transparency, and a customer-first 
                        approach in everything we do.
                    </p>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Users className="text-[#0d59f2]" size={28} />
                        Our Values
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-2 text-[#0d121c] dark:text-white">Safety First</h3>
                            <p className="text-gray-600 dark:text-gray-400">We prioritize the safety of our customers and drivers above all else.</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-2 text-[#0d121c] dark:text-white">Customer Excellence</h3>
                            <p className="text-gray-600 dark:text-gray-400">We are committed to providing exceptional service and ensuring every customer has a positive experience.</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-2 text-[#0d121c] dark:text-white">Reliability</h3>
                            <p className="text-gray-600 dark:text-gray-400">You can count on us to be there when you need us. We maintain strict schedules and punctuality standards.</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-2 text-[#0d121c] dark:text-white">Innovation</h3>
                            <p className="text-gray-600 dark:text-gray-400">We continuously improve our services through technology and innovation to better serve our customers.</p>
                        </div>
                    </div>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Target className="text-[#0d59f2]" size={28} />
                        Our Services
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Premium car rental services</li>
                        <li>Airport transfers</li>
                        <li>Corporate transportation</li>
                        <li>Event transportation</li>
                        <li>Long-distance travel</li>
                        <li>24/7 customer support</li>
                    </ul>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Award className="text-[#0d59f2]" size={28} />
                        Why Choose Us
                    </h2>
                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p><strong className="text-[#0d121c] dark:text-white">Experienced Team:</strong> Our drivers are highly trained professionals with years of experience.</p>
                        <p><strong className="text-[#0d121c] dark:text-white">Fleet Quality:</strong> We maintain a modern fleet of well-maintained vehicles.</p>
                        <p><strong className="text-[#0d121c] dark:text-white">Transparent Pricing:</strong> No hidden fees or surprises. We provide clear, upfront pricing.</p>
                        <p><strong className="text-[#0d121c] dark:text-white">Customer Support:</strong> Our dedicated support team is available 24/7.</p>
                    </div>
                </section>
            </div>
        </>
    );
}

function PrivacyPolicyContent() {
    return (
        <>
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#0d121c] dark:text-white mb-4">Privacy Policy</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none">
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Shield className="text-[#0d59f2]" size={28} />
                        Introduction
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        At DRybros, we are committed to protecting your privacy and ensuring the security of your personal information. 
                        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
                    </p>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <FileText className="text-[#0d59f2]" size={28} />
                        Information We Collect
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-bold text-lg mb-2 text-[#0d121c] dark:text-white">Personal Information</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                                <li>Name and contact information (phone number, email address)</li>
                                <li>Payment information (processed securely through third-party providers)</li>
                                <li>Location data for trip coordination</li>
                                <li>Identification documents when required by law</li>
                            </ul>
                        </div>
                    </div>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Eye className="text-[#0d59f2]" size={28} />
                        How We Use Your Information
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        <li>To provide and improve our transportation services</li>
                        <li>To process bookings and payments</li>
                        <li>To communicate with you about your trips and services</li>
                        <li>To send important updates and notifications</li>
                        <li>To ensure safety and security of our services</li>
                        <li>To comply with legal obligations</li>
                    </ul>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Lock className="text-[#0d59f2]" size={28} />
                        Data Security
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        We implement industry-standard security measures to protect your personal information:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Encryption of sensitive data in transit and at rest</li>
                        <li>Secure payment processing through certified providers</li>
                        <li>Regular security audits and updates</li>
                        <li>Limited access to personal information on a need-to-know basis</li>
                    </ul>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4">Contact Us</h2>
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                        <p className="text-gray-700 dark:text-gray-300">
                            <strong>Email:</strong> privacy@drybros.com<br />
                            <strong>Phone:</strong> +91-XXXX-XXXXXX
                        </p>
                    </div>
                </section>
            </div>
        </>
    );
}

function DriverPolicyContent() {
    return (
        <>
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#0d121c] dark:text-white mb-4">Driver Policy</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">Standards and expectations for our professional drivers</p>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none">
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Shield className="text-[#0d59f2]" size={28} />
                        Driver Qualifications
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        All DRybros drivers undergo a rigorous screening process to ensure your safety and comfort:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Valid commercial driving license with clean record</li>
                        <li>Background verification and criminal record check</li>
                        <li>Comprehensive training program completion</li>
                        <li>Medical fitness certification</li>
                        <li>Minimum years of professional driving experience</li>
                        <li>Excellent communication skills and customer service orientation</li>
                    </ul>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Car className="text-[#0d59f2]" size={28} />
                        Vehicle Standards
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-bold text-lg mb-2 text-[#0d121c] dark:text-white">Regular Maintenance</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                                <li>Monthly safety inspections</li>
                                <li>Regular servicing and oil changes</li>
                                <li>Brake and tire condition checks</li>
                                <li>Cleanliness and hygiene standards</li>
                            </ul>
                        </div>
                    </div>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Award className="text-[#0d59f2]" size={28} />
                        Driver Conduct Standards
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-2 text-[#0d121c] dark:text-white">Professional Behavior</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li>Punctual arrival at pickup locations</li>
                                <li>Professional appearance and attire</li>
                                <li>Courteous and respectful communication</li>
                                <li>Adherence to traffic rules and regulations</li>
                            </ul>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-2 text-[#0d121c] dark:text-white">Prohibited Activities</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li>Use of mobile phones while driving</li>
                                <li>Smoking or consumption of alcohol during service</li>
                                <li>Discriminatory behavior of any kind</li>
                                <li>Sharing customer information with third parties</li>
                            </ul>
                        </div>
                    </div>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <AlertCircle className="text-[#0d59f2]" size={28} />
                        Reporting Issues
                    </h2>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl">
                        <p className="text-gray-700 dark:text-gray-300">
                            <strong className="text-red-600 dark:text-red-400">Emergency Hotline:</strong> +91-XXXX-XXXXXX<br />
                            <strong className="text-red-600 dark:text-red-400">Support Email:</strong> support@drybros.com
                        </p>
                    </div>
                </section>
            </div>
        </>
    );
}

function CancellationRefundContent() {
    return (
        <>
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#0d121c] dark:text-white mb-4">Cancellation & Refund Policy</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">Clear guidelines for trip cancellations and refunds</p>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none">
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <RotateCcw className="text-[#0d59f2]" size={28} />
                        Cancellation Policy
                    </h2>
                    <div className="space-y-6">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-2 text-green-700 dark:text-green-300">Free Cancellation</h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">You can cancel free of charge if:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                                <li>Cancellation is made at least 2 hours before scheduled pickup</li>
                                <li>Driver has not yet started the trip</li>
                            </ul>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-2 text-yellow-700 dark:text-yellow-300">Partial Cancellation Fee</h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">A 20% cancellation fee applies if cancelled less than 2 hours before pickup.</p>
                        </div>
                    </div>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <CreditCard className="text-[#0d59f2]" size={28} />
                        Refund Process
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Refunds are processed within 5-7 business days</li>
                        <li>Refund amount will be credited to the original payment method</li>
                        <li>You will receive an email confirmation once refund is processed</li>
                    </ul>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="text-[#0d59f2]" size={28} />
                        How to Cancel
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Via App/Website: Go to "My Trips" section, select the trip, and click "Cancel Trip"<br />
                        Via Customer Support: Call +91-XXXX-XXXXXX or email support@drybros.com
                    </p>
                </section>
            </div>
        </>
    );
}

function TripRulesContent() {
    return (
        <>
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#0d121c] dark:text-white mb-4">Trip Rules & Guidelines</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">Essential rules and guidelines for DRybros drivers</p>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none">
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Route className="text-[#0d59f2]" size={28} />
                        Pre-Trip Requirements
                    </h2>
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>Verify customer identity and booking details</li>
                            <li>Confirm pickup and drop locations</li>
                            <li>Check vehicle condition (fuel, cleanliness, safety)</li>
                            <li>Ensure GPS and navigation systems are working</li>
                            <li>Review route and estimated travel time</li>
                        </ul>
                    </div>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="text-[#0d59f2]" size={28} />
                        Punctuality Standards
                    </h2>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-xl">
                        <h3 className="font-bold text-lg mb-2 text-green-700 dark:text-green-300">On-Time Arrival</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>Arrive at pickup location 5 minutes before scheduled time</li>
                            <li>Wait for customer for up to 10 minutes after scheduled time</li>
                            <li>Contact customer if running late (more than 5 minutes delay)</li>
                        </ul>
                    </div>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="text-[#0d59f2]" size={28} />
                        During Trip Rules
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-[#0d121c] dark:text-white">Required Actions</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li>Follow the most efficient route</li>
                                <li>Maintain safe driving speed</li>
                                <li>Keep vehicle clean and comfortable</li>
                                <li>Assist with luggage loading/unloading</li>
                            </ul>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-red-700 dark:text-red-300">Prohibited Actions</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li>No use of mobile phone while driving</li>
                                <li>No smoking or consumption of alcohol</li>
                                <li>No deviation from route without consent</li>
                                <li>No inappropriate behavior</li>
                            </ul>
                        </div>
                    </div>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-[#0d59f2]" size={28} />
                        Safety & Emergency Protocols
                    </h2>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-xl">
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                            <strong>24/7 Support:</strong> +91-XXXX-XXXXXX<br />
                            <strong>Emergency Services:</strong> 100 (Police), 102 (Ambulance)
                        </p>
                    </div>
                </section>
            </div>
        </>
    );
}

function DetectionPenaltiesContent() {
    return (
        <>
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#0d121c] dark:text-white mb-4">Detection & Penalties Policy</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">Guidelines for violation detection and penalty system</p>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none">
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-[#0d59f2]" size={28} />
                        Violation Detection System
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-[#0d121c] dark:text-white">Automated Monitoring</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li>GPS tracking for route compliance</li>
                                <li>Speed monitoring and traffic rule compliance</li>
                                <li>Trip completion verification</li>
                                <li>Customer rating and feedback analysis</li>
                            </ul>
                        </div>
                    </div>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <FileWarning className="text-[#0d59f2]" size={28} />
                        Types of Violations
                    </h2>
                    <div className="space-y-6">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-yellow-700 dark:text-yellow-300">Minor Violations</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li>Late arrival (5-15 minutes)</li>
                                <li>Minor route deviation</li>
                                <li>Unprofessional communication</li>
                            </ul>
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400"><strong>Penalty:</strong> Warning and rating impact</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-orange-700 dark:text-orange-300">Moderate Violations</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li>Repeated late arrivals</li>
                                <li>Use of mobile phone while driving</li>
                                <li>Customer complaints about service quality</li>
                            </ul>
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400"><strong>Penalty:</strong> ₹500-₹2000 and temporary suspension</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-red-700 dark:text-red-300">Major Violations</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li>Traffic rule violations</li>
                                <li>Driving under influence</li>
                                <li>Harassment or inappropriate conduct</li>
                                <li>Accident due to negligence</li>
                            </ul>
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400"><strong>Penalty:</strong> ₹2000-₹10000, suspension, or termination</p>
                        </div>
                    </div>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Ban className="text-[#0d59f2]" size={28} />
                        Suspension & Termination
                    </h2>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-xl">
                        <h3 className="font-bold text-lg mb-2 text-yellow-700 dark:text-yellow-300">Temporary Suspension</h3>
                        <p className="text-gray-700 dark:text-gray-300">3+ moderate violations within 30 days or 1 major violation</p>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400"><strong>Suspension Period:</strong> 7-30 days</p>
                    </div>
                </section>
            </div>
        </>
    );
}

function StaffPoliciesContent() {
    return (
        <>
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#0d121c] dark:text-white mb-4">Staff Policies</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">Guidelines and policies for DRybros staff members</p>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none">
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Briefcase className="text-[#0d59f2]" size={28} />
                        Code of Conduct
                    </h2>
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                        <h3 className="font-bold text-lg mb-3 text-[#0d121c] dark:text-white">Professional Standards</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>Maintain professional demeanor at all times</li>
                            <li>Respect colleagues, customers, and drivers</li>
                            <li>Uphold company values and mission</li>
                            <li>Maintain confidentiality of sensitive information</li>
                            <li>Follow all company policies and procedures</li>
                        </ul>
                    </div>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Users className="text-[#0d59f2]" size={28} />
                        Responsibilities
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">Customer Service</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li>Respond to customer inquiries promptly</li>
                                <li>Resolve customer issues effectively</li>
                                <li>Maintain customer satisfaction standards</li>
                            </ul>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-green-700 dark:text-green-300">Operations Management</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li>Monitor trip assignments and status</li>
                                <li>Coordinate with drivers and customers</li>
                                <li>Handle booking modifications</li>
                            </ul>
                        </div>
                    </div>
                </section>
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <Shield className="text-[#0d59f2]" size={28} />
                        Data Security & Privacy
                    </h2>
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                        <h3 className="font-bold text-lg mb-3 text-[#0d121c] dark:text-white">Confidentiality Requirements</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>Protect customer and driver personal information</li>
                            <li>Do not share sensitive data with unauthorized parties</li>
                            <li>Use secure systems and follow password policies</li>
                            <li>Report any data breaches immediately</li>
                        </ul>
                    </div>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-4">Performance Standards</h2>
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                        <h3 className="font-bold text-lg mb-3 text-[#0d121c] dark:text-white">Key Performance Indicators</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>Customer satisfaction ratings</li>
                            <li>Response time to customer inquiries</li>
                            <li>Issue resolution rate</li>
                            <li>Attendance and punctuality</li>
                        </ul>
                    </div>
                </section>
            </div>
        </>
    );
}
