/**
 * Franchise module – UI strings, labels, and messages.
 * Used by FranchiseList, FranchiseDetails, CreateFranchiseForm, etc.
 */

export const FRANCHISE_STRINGS = {
    /** Page titles */
    PAGE_TITLE_DETAIL: 'Franchise Detailed Profile',
    PAGE_TITLE_MANAGEMENT: 'Franchise Management',
    PAGE_TITLE_OVERVIEW: 'Franchise Management Overview',
    PAGE_SUBTITLE_OVERVIEW: 'Manage all active and inactive branch licenses globally.',
    BACK_TO_FRANCHISES: 'Back to Franchises',
    EDIT_FRANCHISE: 'Edit Franchise',
    EDIT_PAGE_TITLE: 'Edit Franchise',
    EDIT_PAGE_SUBTITLE: 'Update franchise details and compliance.',
    BREADCRUMB_EDIT: 'Edit',
    BTN_SAVE_CHANGES: 'Save Changes',
    CONTACT_MANAGER: 'Contact Manager',

    /** Section labels */
    LABEL_STATUS: 'Status',
    ADDRESS: 'Address',
    CONTACT_PHONE: 'Contact Phone',
    EMAIL_ADDRESS: 'Email Address',
    OPERATING_HOURS: 'Operating Hours',
    MANAGER_DETAILS: 'Manager Details',
    ADMINISTRATIVE_STAFF: 'Administrative Staff',
    ACTIVE_DRIVERS: 'Active Drivers',
    INTERACTIVE_MAP: 'Interactive Map',

    /** Stats */
    TOTAL_TRIPS: 'Total Trips',
    TOTAL_REVENUE: 'Total Revenue',
    RELIABILITY_SCORE: 'Reliability Score',
    FROM_LAST_MONTH: 'from last month',
    HIGH_PERFORMING_BRANCH: 'High Performing Branch',

    /** Table headers (list) */
    TABLE_FRANCHISE_NAME: 'Franchise Name',
    TABLE_LOCATION: 'Location',
    TABLE_MANAGER: 'Manager',
    TABLE_DRIVERS: 'Drivers',
    TABLE_MONTHLY_REVENUE: 'Monthly Revenue',
    TABLE_ACTIONS: 'Actions',

    /** Table headers (detail) */
    TABLE_NAME: 'Name',
    TABLE_ROLE: 'Role',
    TABLE_CONTACT: 'Contact',
    TABLE_DRIVER: 'Driver',
    TABLE_STATUS: 'Status',
    TABLE_VEHICLE: 'Vehicle',

    /** List actions */
    FILTERS: 'Filters',
    CREATE_NEW_FRANCHISE: 'Create New Franchise',
    VIEW_DETAILS: 'View Details',
    EDIT: 'Edit',
    DEACTIVATE: 'Deactivate',
    ACTIVATE: 'Activate',
    SHOWING_X_TO_Y_OF_Z: 'Showing %s to %s of %s franchises',

    /** Status & badges */
    STATUS_ACTIVE: 'ACTIVE',
    STATUS_INACTIVE: 'INACTIVE',
    STATUS_BLOCKED: 'BLOCKED',
    STATUS_TEMPORARILY_CLOSED: 'TEMPORARILY_CLOSED',

    /** Change status actions (detail screen) */
    CHANGE_STATUS: 'Change status',
    SET_ACTIVE: 'Set Active',
    SET_BLOCKED: 'Block',
    SET_TEMPORARILY_CLOSED: 'Temporarily Closed',
    DELETE_FRANCHISE: 'Delete Franchise',
    CONFIRM_CHANGE_STATUS: 'Are you sure you want to change this franchise status?',
    CONFIRM_DELETE_FRANCHISE: 'Are you sure you want to delete this franchise? This action can be reversed by an administrator.',
    STATUS_UPDATED: 'Franchise status updated successfully.',
    FRANCHISE_DELETED: 'Franchise deleted successfully.',
    BTN_CONFIRM: 'Confirm',
    BTN_DELETE: 'Delete',
    BTN_UPDATING: 'Updating…',
    BTN_DELETING: 'Deleting…',
    STATUS_IN_TRIP: 'In Trip',
    STATUS_AVAILABLE: 'Available',
    STATUS_OFFLINE: 'Offline',
    MEMBERS: 'Members',
    ONLINE: 'ONLINE',
    TOTAL: 'TOTAL',

    /** Actions */
    VIEW_ALL_STAFF: 'View All Staff',
    VIEW_ALL_DRIVERS: 'View All Drivers',

    /** Currency (franchise revenue is in INR) */
    CURRENCY_SYMBOL: '₹',

    /** Loading / error */
    LOADING_FRANCHISES: 'Loading franchises...',
    FAILED_TO_LOAD_FRANCHISES: 'Failed to load franchises. Please try again.',

    /** Empty / not available */
    NO_FRANCHISES_FOUND: 'No franchises found',
    NO_FRANCHISES_MATCH: 'We couldn\'t find any franchises matching your current filters. Try adjusting your search.',
    RESET_FILTERS: 'Reset all filters',
    REVENUE_NOT_AVAILABLE: '—',

    /** Onboarding / Create Franchise */
    ONBOARDING_TITLE: 'Franchise Onboarding',
    ONBOARDING_SUBTITLE: 'Initialize and setup new franchise credentials and compliance records.',
    BREADCRUMB_DASHBOARD: 'Dashboard',
    BREADCRUMB_FRANCHISES: 'Franchises',
    BREADCRUMB_ONBOARDING: 'Onboarding',
    BTN_CANCEL: 'Cancel',
    BTN_SAVE_INITIALIZE: 'Save & Initialize Franchise',
    SECTION_BASICS: 'Franchise Basics',
    SECTION_MANAGER: 'Manager Information',
    SECTION_COMPLIANCE: 'Compliance',
    LABEL_FRANCHISE_NAME: 'Franchise Name',
    LABEL_LOCATION_CODE: 'Location Code',
    LABEL_PHYSICAL_ADDRESS: 'Physical Address',
    LABEL_BUSINESS_EMAIL: 'Business Email',
    LABEL_SUPPORT_PHONE: 'Support Phone',
    LABEL_FULL_NAME: 'Full Name',
    LABEL_DIRECT_PHONE: 'Direct Phone',
    LABEL_EMAIL_ADDRESS: 'Email Address',
    LABEL_ALL_DOCS_COLLECTED: 'All Documentation Collected',
    LABEL_DOCS_COLLECTED_HINT: 'Check this once all required files are in the physical folder.',
    COMPLIANCE_PENDING: 'Pending Verification',
    COMPLIANCE_TRADE_LICENSE: 'Trade License',
    COMPLIANCE_TRADE_LICENSE_HINT: 'Required for operation',
    COMPLIANCE_TAX_ID: 'Tax ID (EIN)',
    COMPLIANCE_TAX_ID_HINT: 'Verification mandatory',
    COMPLIANCE_INSURANCE: 'Liability Insurance',
    COMPLIANCE_INSURANCE_HINT: 'Policy copy required',
    COMPLIANCE_AGREEMENT: 'Franchise Agreement',
    COMPLIANCE_AGREEMENT_HINT: 'Fully executed copy',
    PLACEHOLDER_FRANCHISE_NAME: 'e.g. Dybros Downtown',
    PLACEHOLDER_LOCATION_CODE: 'e.g. US-NY-001',
    PLACEHOLDER_PHYSICAL_ADDRESS: '123 Business Way, Suite 400, New York, NY',
    PLACEHOLDER_BUSINESS_EMAIL: 'contact@franchisename.com',
    PLACEHOLDER_SUPPORT_PHONE: '+1 (555) 000-0000',
    PLACEHOLDER_MANAGER_NAME: 'John Doe',
    PLACEHOLDER_DIRECT_PHONE: '+1 (555) 123-4567',
    PLACEHOLDER_MANAGER_EMAIL: 'j.doe@franchise.com',
    LOGO_UPLOAD_HINT: 'Click to upload logo',
    LOGO_RECOMMENDED: 'Recommended: 400x400 PNG',

    /** Placeholders / defaults */
    SEARCH_PLACEHOLDER: 'Search franchises...',
    ACTIVE_SINCE: 'Active since',
    SERVICE_COVERAGE_24_7: '24/7 Service Coverage',
    FRANCHISE_MANAGER_ROLE: 'Franchise Manager',
    ROLE_STAFF: 'Staff',
} as const;
