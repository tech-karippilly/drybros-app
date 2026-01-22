import {
    Home,
    Store,
    Users,
    Truck,
    BarChart3,
    ShieldAlert,
    Map,
    MessageSquare,
    CalendarCheck,
    UserCircle,
    FileText,
    PlusCircle,
    Clock,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface NavItem {
    icon: LucideIcon;
    label: string;
    id: string;
    submenu?: NavItem[];
}

export const ROLE_MENUS: Record<string, NavItem[]> = {
    admin: [
        { icon: Home, label: 'Home', id: 'home' },
        { icon: Store, label: 'Franchises', id: 'franchises' },
        { icon: Users, label: 'Staff', id: 'staff' },
        { icon: Truck, label: 'Drivers', id: 'drivers' },
        { icon: BarChart3, label: 'Reports', id: 'reports' },
        { icon: ShieldAlert, label: 'Penalties', id: 'payroll' },
        {
            icon: Map,
            label: 'Trip Management',
            id: 'trips',
            submenu: [
                { icon: FileText, label: 'Trip Type', id: 'trip-types' },
                { icon: PlusCircle, label: 'Booking', id: 'trip-booking' },
                { icon: Clock, label: 'Unassigned Trips', id: 'unassigned-trips' },
            ],
        },
        { icon: MessageSquare, label: 'Complaints', id: 'complaints' },
        { icon: CalendarCheck, label: 'Attendance', id: 'attendance' },
    ],
    staff: [
        { icon: Home, label: 'Home', id: 'home' },
        { icon: Truck, label: 'Drivers', id: 'drivers' },
        { icon: BarChart3, label: 'Reports', id: 'reports' },
        { icon: ShieldAlert, label: 'Penalties', id: 'payroll' },
        {
            icon: Map,
            label: 'Trip Management',
            id: 'trips',
            submenu: [
                { icon: FileText, label: 'Trip Type', id: 'trip-types' },
                { icon: PlusCircle, label: 'Booking', id: 'trip-booking' },
                { icon: Clock, label: 'Unassigned Trips', id: 'unassigned-trips' },
            ],
        },
        { icon: MessageSquare, label: 'Complaints', id: 'complaints' },
        { icon: CalendarCheck, label: 'Attendance', id: 'attendance' },
        { icon: UserCircle, label: 'Customer', id: 'customer' },
    ],
    driver: [
        { icon: Home, label: 'Home', id: 'home' },
        { icon: BarChart3, label: 'Reports', id: 'reports' },
        { icon: ShieldAlert, label: 'Penalties', id: 'payroll' },
        { icon: CalendarCheck, label: 'Attendance', id: 'attendance' },
        { icon: Map, label: 'Trips', id: 'trips' },
    ]
};
