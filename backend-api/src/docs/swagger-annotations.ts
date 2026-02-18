/**
 * @swagger
 * components:
 *   schemas:
 *     # ============================================
 *     # NOTIFICATION SCHEMAS
 *     # ============================================
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         driverId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         staffId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         franchiseId:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [TRIP_ASSIGNED, TRIP_CANCELLED, COMPLAINT_CREATED, WARNING_ISSUED, LEAVE_APPROVED, PAYROLL_GENERATED]
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         metadata:
 *           type: object
 *         isRead:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     # ============================================
 *     # OTP SCHEMAS
 *     # ============================================
 *     SendOtpRequest:
 *       type: object
 *       required:
 *         - phone
 *         - purpose
 *       properties:
 *         phone:
 *           type: string
 *           minLength: 10
 *           maxLength: 15
 *           example: "9876543210"
 *         purpose:
 *           type: string
 *           enum: [TRIP_START, TRIP_END, LOGIN, PASSWORD_RESET]
 *         tripId:
 *           type: string
 *           format: uuid
 *           description: Required for TRIP_START/TRIP_END purposes
 * 
 *     VerifyOtpRequest:
 *       type: object
 *       required:
 *         - phone
 *         - otp
 *         - purpose
 *       properties:
 *         phone:
 *           type: string
 *         otp:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *           example: "123456"
 *         purpose:
 *           type: string
 *           enum: [TRIP_START, TRIP_END, LOGIN, PASSWORD_RESET]
 *         tripId:
 *           type: string
 *           format: uuid
 * 
 *     # ============================================
 *     # STAFF SCHEMAS
 *     # ============================================
 *     CreateStaffRequest:
 *       type: object
 *       required:
 *         - name
 *         - phone
 *         - email
 *         - password
 *         - monthlySalary
 *       properties:
 *         franchiseId:
 *           type: string
 *           format: uuid
 *           description: Required for ADMIN. Auto-assigned for MANAGER
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         phone:
 *           type: string
 *           minLength: 10
 *           maxLength: 15
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 8
 *         monthlySalary:
 *           type: number
 *           minimum: 0
 *         address:
 *           type: string
 *           maxLength: 500
 *         emergencyContact:
 *           type: string
 *           maxLength: 100
 *         emergencyContactRelation:
 *           type: string
 *           maxLength: 50
 *         role:
 *           type: string
 *           enum: [OFFICE_STAFF, STAFF]
 *           default: OFFICE_STAFF
 * 
 *     UpdateStaffStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, FIRED, BLOCKED]
 *         suspendedUntil:
 *           type: string
 *           format: date-time
 *           description: Required when status is SUSPENDED
 * 
 *     Staff:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         franchiseId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, FIRED, BLOCKED]
 *         warningCount:
 *           type: integer
 *         complaintCount:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     # ============================================
 *     # REPORTS SCHEMAS
 *     # ============================================
 *     RevenueReport:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             summary:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                 totalTrips:
 *                   type: integer
 *                 averageRevenuePerTrip:
 *                   type: number
 *                 period:
 *                   type: string
 *             breakdown:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   label:
 *                     type: string
 *                   revenue:
 *                     type: number
 *                   trips:
 *                     type: integer
 *                   percentage:
 *                     type: number
 *             chartData:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                   revenue:
 *                     type: number
 *                   trips:
 *                     type: integer
 *         generatedAt:
 *           type: string
 *           format: date-time
 * 
 *     TripReport:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             summary:
 *               type: object
 *               properties:
 *                 totalTrips:
 *                   type: integer
 *                 completedTrips:
 *                   type: integer
 *                 cancelledTrips:
 *                   type: integer
 *                 avgTripDuration:
 *                   type: number
 *                 driverAcceptanceRate:
 *                   type: number
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get my notifications
 *     description: Retrieve notifications for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [TRIP_ASSIGNED, COMPLAINT_CREATED, LEAVE_APPROVED, PAYROLL_GENERATED]
 *         description: Filter by notification type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 unreadCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark single notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/otp/send:
 *   post:
 *     tags: [OTP]
 *     summary: Send OTP
 *     description: Generate and send OTP to phone number (Public endpoint)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendOtpRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     phone:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       429:
 *         description: Too many OTP requests (rate limited)
 */

/**
 * @swagger
 * /api/otp/verify:
 *   post:
 *     tags: [OTP]
 *     summary: Verify OTP
 *     description: Verify OTP for phone number (Public endpoint)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpRequest'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     verified:
 *                       type: boolean
 *       400:
 *         description: Invalid or expired OTP
 *       429:
 *         description: Phone blocked due to too many failed attempts
 */

/**
 * @swagger
 * /api/staff:
 *   post:
 *     tags: [Staff]
 *     summary: Create staff member
 *     description: Create new staff (ADMIN, MANAGER only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStaffRequest'
 *     responses:
 *       201:
 *         description: Staff created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       400:
 *         description: Validation error
 * 
 *   get:
 *     tags: [Staff]
 *     summary: List staff members
 *     description: List all staff (ADMIN sees all, MANAGER sees own franchise only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: franchiseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by franchise (ADMIN only)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, FIRED, BLOCKED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or phone
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Staff list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Staff'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /api/staff/me:
 *   get:
 *     tags: [Staff]
 *     summary: Get my profile
 *     description: Get authenticated staff member's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 */

/**
 * @swagger
 * /api/staff/{id}/status:
 *   patch:
 *     tags: [Staff]
 *     summary: Update staff status
 *     description: Update staff status (ADMIN, MANAGER only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStaffStatusRequest'
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     tags: [Reports]
 *     summary: Revenue analytics report
 *     description: Generate revenue analytics (ADMIN sees global, MANAGER sees own franchise)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: franchiseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by franchise (ADMIN only)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-02-12"
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: month
 *       - in: query
 *         name: export
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *         description: Export format (future feature)
 *     responses:
 *       200:
 *         description: Revenue report generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RevenueReport'
 *       403:
 *         description: Forbidden (insufficient permissions)
 */

/**
 * @swagger
 * /api/reports/trips:
 *   get:
 *     tags: [Reports]
 *     summary: Trip analytics report
 *     description: Generate trip analytics (ADMIN, MANAGER only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: franchiseId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Trip report generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripReport'
 */

/**
 * @swagger
 * /api/reports/drivers:
 *   get:
 *     tags: [Reports]
 *     summary: Driver analytics report
 *     description: Generate driver performance analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: franchiseId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: metricType
 *         schema:
 *           type: string
 *           enum: [revenue, trips, rating, complaints]
 *           default: revenue
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Driver report generated
 */

/**
 * @swagger
 * /api/reports/franchises:
 *   get:
 *     tags: [Reports]
 *     summary: Franchise comparison report
 *     description: Compare franchise performance (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Franchise report generated
 *       403:
 *         description: Forbidden (ADMIN only)
 */
