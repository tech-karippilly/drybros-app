import {
    Home,
    Store,
    Users,
    Truck,
    BarChart3,
    Map,
    MessageSquare,
    CalendarCheck,
    UserCircle,
    FileText,
    PlusCircle,
    Clock,
    Shield,
    Settings
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface NavItem {
    icon: LucideIcon;
    label: string;
    id: string;
    submenu?: NavItem[];
    external?: boolean; // If true, navigates to external route instead of setting activeTab
    href?: string; // External route path
}

export const ROLE_MENUS: Record<string, NavItem[]> = {
    admin: [
        { icon: Home, label: 'Home', id: 'home' },
        { icon: Store, label: 'Franchises', id: 'franchises' },
        { icon: Users, label: 'Staff', id: 'staff' },
        {
            icon: Truck,
            label: 'Drivers',
            id: 'drivers',
            submenu: [
                { icon: Truck, label: 'Driver List', id: 'drivers' },
                { icon: Settings, label: 'Earnings Configuration', id: 'driver-earnings-config' },
            ],
        },
        { icon: BarChart3, label: 'Reports', id: 'reports' },
        {
            icon: Map,
            label: 'Trip Management',
            id: 'trips',
            submenu: [
                { icon: Map, label: 'Trip', id: 'all-trips' },
                { icon: FileText, label: 'Trip Type', id: 'trip-types' },
                { icon: PlusCircle, label: 'Booking', id: 'trip-booking' },
                { icon: Clock, label: 'Unassigned Trips', id: 'unassigned-trips' },
            ],
        },
        { icon: MessageSquare, label: 'Complaints', id: 'complaints' },
        { icon: CalendarCheck, label: 'Attendance', id: 'attendance' },
        { icon: Shield, label: 'Policies', id: 'policies', external: true, href: '/policies' },
    ],
    staff: [
        { icon: Home, label: 'Home', id: 'home' },
        {
            icon: Truck,
            label: 'Drivers',
            id: 'drivers',
            submenu: [
                { icon: Truck, label: 'Driver List', id: 'drivers' },
                { icon: Settings, label: 'Earnings Configuration', id: 'driver-earnings-config' },
            ],
        },
        { icon: BarChart3, label: 'Reports', id: 'reports' },
        {
            icon: Map,
            label: 'Trip Management',
            id: 'trips',
            submenu: [
                { icon: Map, label: 'Trip', id: 'all-trips' },
                { icon: FileText, label: 'Trip Type', id: 'trip-types' },
                { icon: PlusCircle, label: 'Booking', id: 'trip-booking' },
                { icon: Clock, label: 'Unassigned Trips', id: 'unassigned-trips' },
            ],
        },
        { icon: MessageSquare, label: 'Complaints', id: 'complaints' },
        { icon: CalendarCheck, label: 'Attendance', id: 'attendance' },
        { icon: UserCircle, label: 'Customer', id: 'customer' },
        { icon: Shield, label: 'Policies', id: 'policies', external: true, href: '/policies' },
    ],
    driver: [
        { icon: Home, label: 'Home', id: 'home' },
        { icon: BarChart3, label: 'Reports', id: 'reports' },
        { icon: CalendarCheck, label: 'Attendance', id: 'attendance' },
        { icon: Map, label: 'Trips', id: 'trips' },
        { icon: Shield, label: 'Policies', id: 'policies', external: true, href: '/policies' },
    ]
};
