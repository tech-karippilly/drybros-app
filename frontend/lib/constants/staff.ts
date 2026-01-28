/**
 * Staff module – UI strings, labels, and messages.
 * Used by StaffList, StaffDetails, CreateStaffForm, etc.
 */

export const STAFF_STRINGS = {
    /** Page titles */
    PAGE_TITLE: 'Staff Directory',
    PAGE_SUBTITLE: 'Manage and monitor personnel across all franchise branches.',
    ADD_NEW_STAFF: 'Add New Staff',
    CREATE_STAFF: 'Create Staff',

    /** Filters */
    FILTERS: 'Filters',
    FRANCHISE_ALL_BRANCHES: 'Franchise: All Branches',
    FRANCHISE_LABEL: 'Franchise',
    ROLE_ALL_ROLES: 'Role: All Roles',
    ROLE_LABEL: 'Role',
    STATUS_ACTIVE: 'Status: Active',
    STATUS_LABEL: 'Status',
    RESET: 'Reset',
    SEARCH_PLACEHOLDER: 'Search staff or ID...',

    /** Table headers */
    TABLE_STAFF_NAME: 'Staff Name',
    TABLE_FRANCHISE: 'Franchise',
    TABLE_ROLE: 'Role',
    TABLE_CONTACT: 'Contact',
    TABLE_STATUS: 'Status',
    TABLE_ACTIONS: 'Actions',

    /** Status display (listing) */
    STATUS_ACTIVE_LABEL: 'Active',
    STATUS_ON_BREAK: 'On Break',
    STATUS_INACTIVE: 'Inactive',

    /** Role display (placeholder until backend supports) */
    ROLE_STAFF: 'Staff',
    ROLE_MANAGER: 'Manager',
    ROLE_ADMIN: 'Admin',
    ROLE_DISPATCHER: 'Dispatcher',

    /** Pagination */
    SHOWING_X_TO_Y_OF_Z: 'Showing %s to %s of %s staff members',

    /** Stats cards */
    STAT_TOTAL_ACTIVE: 'Total Active',
    STAT_ON_BREAK: 'On Break',
    STAT_TOTAL_BRANCHES: 'Total Branches',

    /** Empty state */
    NO_STAFF_FOUND: 'No staff found',
    NO_STAFF_MATCH: 'We couldn\'t find any staff matching your current filters. Try adjusting your search.',
    RESET_ALL_FILTERS: 'Reset all filters',

    /** Actions (dropdown) */
    ACTION_VIEW_DETAILS: 'View Details',
    ACTION_EDIT: 'Edit',
    ACTION_SUSPEND: 'Suspend',
    ACTION_FIRE: 'Fire',

    /** Staff Onboarding page */
    ONBOARDING_TITLE: 'Staff Onboarding',
    ONBOARDING_SUBTITLE: 'Add a new member to the Dybros network and assign roles.',
    BACK_TO_LIST: 'Back to List',
    PROFILE_PHOTO: 'Profile Photo',
    PROFILE_PHOTO_HINT: 'Upload a professional headshot (JPG, PNG)',
    AUTO_PASSWORD: 'Auto-generated Password',
    TEMP_PASSWORD_HINT: 'Temporary password for first login.',
    REGENERATE: 'Regenerate',
    PERSONAL_DETAILS: 'Personal Details',
    FULL_NAME: 'Full Name',
    PHONE_NUMBER: 'Phone Number',
    EMAIL_ADDRESS: 'Email Address',
    MONTHLY_SALARY_INR: 'Monthly Salary (INR)',
    FRANCHISE_SELECTION: 'Franchise Selection',
    SELECT_FRANCHISE: 'Select a Franchise',
    ADDRESS_EMERGENCY: 'Address & Emergency Contact',
    FULL_ADDRESS: 'Full Address',
    FULL_ADDRESS_PLACEHOLDER: 'Street name, Building, Area, City, Pin Code',
    EMERGENCY_CONTACT_NAME: 'Emergency Contact Name',
    EMERGENCY_CONTACT_PLACEHOLDER: 'Relative Name',
    RELATIONSHIP: 'Relationship',
    RELATIONSHIP_PLACEHOLDER: 'e.g., Mother, Spouse',
    COMPLIANCE_CHECKLIST: 'Compliance Checklist',
    GOVT_VERIFICATION: 'Government Verification (ID Proof)',
    GOVT_VERIFICATION_HINT: 'Aadhar, PAN, or Passport copy',
    ADDRESS_PROOF: 'Address Proof',
    ADDRESS_PROOF_HINT: 'Utility bill, Rent agreement, etc.',
    EDUCATION_CERT: 'Education Certificate',
    EDUCATION_CERT_HINT: 'Highest qualification degree/diploma',
    UPLOAD_DOCUMENT: 'Upload Document',
    DISCARD_CHANGES: 'Discard Changes',
    REGISTER_STAFF_MEMBER: 'Register Staff Member',
} as const;
