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
    Shield,
    Settings,
    CalendarOff,
    Star,
    Wallet,
    ClipboardList,
    AlertTriangle
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { DASHBOARD_ROUTES, APP_ROUTES } from './routes';

export interface NavItem {
    icon: LucideIcon;
    label: string;
    id: string;
    href?: string;
    submenu?: NavItem[];
    external?: boolean; // If true, navigates to external route (e.g. /policies)
}

export const ROLE_MENUS: Record<string, NavItem[]> = {
    admin: [
        { icon: Home, label: 'Home', id: 'home', href: DASHBOARD_ROUTES.HOME },
        { icon: Store, label: 'Franchises', id: 'franchises', href: DASHBOARD_ROUTES.FRANCHISES },
        { icon: Users, label: 'Staff', id: 'staff', href: DASHBOARD_ROUTES.STAFF },
        {
            icon: Truck,
            label: 'Drivers',
            id: 'drivers',
            submenu: [
                { icon: Truck, label: 'Driver List', id: 'drivers', href: DASHBOARD_ROUTES.DRIVERS },
                { icon: Settings, label: 'Earnings Configuration', id: 'driver-earnings-config', href: DASHBOARD_ROUTES.DRIVER_EARNINGS_CONFIG },
            ],
        },
        { icon: BarChart3, label: 'Reports', id: 'reports', href: DASHBOARD_ROUTES.REPORTS },
        {
            icon: Map,
            label: 'Trip Management',
            id: 'trips',
            submenu: [
                { icon: Map, label: 'Trip', id: 'all-trips', href: DASHBOARD_ROUTES.TRIPS },
                { icon: FileText, label: 'Trip Type', id: 'trip-types', href: DASHBOARD_ROUTES.TRIP_TYPES },
                { icon: PlusCircle, label: 'Booking', id: 'trip-booking', href: DASHBOARD_ROUTES.BOOKING },
            ],
        },
        {
            icon: AlertTriangle,
            label: 'Complaints & Penalties',
            id: 'complaints-penalties',
            submenu: [
                { icon: MessageSquare, label: 'Complaints', id: 'complaints', href: DASHBOARD_ROUTES.COMPLAINTS },
                { icon: AlertTriangle, label: 'Penalties', id: 'penalties', href: DASHBOARD_ROUTES.PENALTIES },
            ],
        },
        {
            icon: CalendarCheck,
            label: 'Attendance',
            id: 'attendance',
            submenu: [
                { icon: CalendarCheck, label: 'Attendance', id: 'attendance', href: DASHBOARD_ROUTES.ATTENDANCE },
                { icon: CalendarOff, label: 'Leave', id: 'leave', href: DASHBOARD_ROUTES.LEAVE },
                { icon: ClipboardList, label: 'Leave Requests', id: 'leave-requests', href: DASHBOARD_ROUTES.LEAVE_REQUESTS },
            ],
        },
        { icon: Star, label: 'Ratings', id: 'ratings', href: DASHBOARD_ROUTES.RATINGS },
        { icon: Wallet, label: 'Cash Settlement', id: 'cash-settlement', href: DASHBOARD_ROUTES.CASH_SETTLEMENT },
        { icon: Shield, label: 'Policies', id: 'policies', external: true, href: APP_ROUTES.POLICIES },
    ],
    manager: [
        { icon: Home, label: 'Home', id: 'home', href: DASHBOARD_ROUTES.HOME },
        { icon: Users, label: 'Staff', id: 'staff', href: DASHBOARD_ROUTES.STAFF },
        {
            icon: Truck,
            label: 'Drivers',
            id: 'drivers',
            submenu: [
                { icon: Truck, label: 'Driver List', id: 'drivers', href: DASHBOARD_ROUTES.DRIVERS },
                { icon: Settings, label: 'Earnings Configuration', id: 'driver-earnings-config', href: DASHBOARD_ROUTES.DRIVER_EARNINGS_CONFIG },
            ],
        },
        { icon: BarChart3, label: 'Reports', id: 'reports', href: DASHBOARD_ROUTES.REPORTS },
        {
            icon: Map,
            label: 'Trip Management',
            id: 'trips',
            submenu: [
                { icon: Map, label: 'Trip', id: 'all-trips', href: DASHBOARD_ROUTES.TRIPS },
                { icon: FileText, label: 'Trip Type', id: 'trip-types', href: DASHBOARD_ROUTES.TRIP_TYPES },
                { icon: PlusCircle, label: 'Booking', id: 'trip-booking', href: DASHBOARD_ROUTES.BOOKING },
            ],
        },
        {
            icon: AlertTriangle,
            label: 'Complaints & Penalties',
            id: 'complaints-penalties',
            submenu: [
                { icon: MessageSquare, label: 'Complaints', id: 'complaints', href: DASHBOARD_ROUTES.COMPLAINTS },
                { icon: AlertTriangle, label: 'Penalties', id: 'penalties', href: DASHBOARD_ROUTES.PENALTIES },
            ],
        },
        {
            icon: CalendarCheck,
            label: 'Attendance',
            id: 'attendance',
            submenu: [
                { icon: CalendarCheck, label: 'Attendance', id: 'attendance', href: DASHBOARD_ROUTES.ATTENDANCE },
                { icon: CalendarOff, label: 'Leave', id: 'leave', href: DASHBOARD_ROUTES.LEAVE },
                { icon: ClipboardList, label: 'Leave Requests', id: 'leave-requests', href: DASHBOARD_ROUTES.LEAVE_REQUESTS },
            ],
        },
        { icon: Star, label: 'Ratings', id: 'ratings', href: DASHBOARD_ROUTES.RATINGS },
        { icon: UserCircle, label: 'Customer', id: 'customer', href: DASHBOARD_ROUTES.CUSTOMERS },
        { icon: Wallet, label: 'Cash Settlement', id: 'cash-settlement', href: DASHBOARD_ROUTES.CASH_SETTLEMENT },
        { icon: Shield, label: 'Policies', id: 'policies', external: true, href: APP_ROUTES.POLICIES },
    ],
    staff: [
        { icon: Home, label: 'Home', id: 'home', href: DASHBOARD_ROUTES.HOME },
        {
            icon: Truck,
            label: 'Drivers',
            id: 'drivers',
            submenu: [
                { icon: Truck, label: 'Driver List', id: 'drivers', href: DASHBOARD_ROUTES.DRIVERS },
                { icon: Settings, label: 'Earnings Configuration', id: 'driver-earnings-config', href: DASHBOARD_ROUTES.DRIVER_EARNINGS_CONFIG },
            ],
        },
        { icon: BarChart3, label: 'Reports', id: 'reports', href: DASHBOARD_ROUTES.REPORTS },
        {
            icon: Map,
            label: 'Trip Management',
            id: 'trips',
            submenu: [
                { icon: Map, label: 'Trip', id: 'all-trips', href: DASHBOARD_ROUTES.TRIPS },
                { icon: FileText, label: 'Trip Type', id: 'trip-types', href: DASHBOARD_ROUTES.TRIP_TYPES },
                { icon: PlusCircle, label: 'Booking', id: 'trip-booking', href: DASHBOARD_ROUTES.BOOKING },
            ],
        },
        {
            icon: AlertTriangle,
            label: 'Complaints & Penalties',
            id: 'complaints-penalties',
            submenu: [
                { icon: MessageSquare, label: 'Complaints', id: 'complaints', href: DASHBOARD_ROUTES.COMPLAINTS },
                { icon: AlertTriangle, label: 'Penalties', id: 'penalties', href: DASHBOARD_ROUTES.PENALTIES },
            ],
        },
        {
            icon: CalendarCheck,
            label: 'Attendance',
            id: 'attendance',
            submenu: [
                { icon: CalendarCheck, label: 'Attendance', id: 'attendance', href: DASHBOARD_ROUTES.ATTENDANCE },
                { icon: CalendarOff, label: 'Leave', id: 'leave', href: DASHBOARD_ROUTES.LEAVE },
            ],
        },
        { icon: Star, label: 'Ratings', id: 'ratings', href: DASHBOARD_ROUTES.RATINGS },
        { icon: UserCircle, label: 'Customer', id: 'customer', href: DASHBOARD_ROUTES.CUSTOMERS },
        { icon: Wallet, label: 'Cash Settlement', id: 'cash-settlement', href: DASHBOARD_ROUTES.CASH_SETTLEMENT },
        { icon: Shield, label: 'Policies', id: 'policies', external: true, href: APP_ROUTES.POLICIES },
    ],
    driver: [
        { icon: Home, label: 'Home', id: 'home', href: DASHBOARD_ROUTES.HOME },
        { icon: BarChart3, label: 'Reports', id: 'reports', href: DASHBOARD_ROUTES.REPORTS },
        {
            icon: CalendarCheck,
            label: 'Attendance',
            id: 'attendance',
            submenu: [
                { icon: CalendarCheck, label: 'Attendance', id: 'attendance', href: DASHBOARD_ROUTES.ATTENDANCE },
                { icon: CalendarOff, label: 'Apply Leave', id: 'apply-leave', href: DASHBOARD_ROUTES.LEAVE },
            ],
        },
        { icon: Map, label: 'Trips', id: 'trips', href: DASHBOARD_ROUTES.TRIPS },
        { icon: Shield, label: 'Policies', id: 'policies', external: true, href: APP_ROUTES.POLICIES },
    ]
};
