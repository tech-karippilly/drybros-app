import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DryBros API Documentation',
      version: '1.0.0',
      description: 'Complete API documentation for DryBros transport management system',
      contact: {
        name: 'API Support',
        email: 'support@drybros.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'https://api.drybros.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token (obtained from login endpoint)',
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              example: 'Detailed error description',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 20,
            },
            total: {
              type: 'integer',
              example: 100,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
            hasNext: {
              type: 'boolean',
              example: true,
            },
            hasPrev: {
              type: 'boolean',
              example: false,
            },
          },
        },
        AttendanceResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            driverId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440001',
            },
            staffId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440002',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440003',
            },
            date: {
              type: 'string',
              format: 'date',
              example: '2023-12-01',
            },
            loginTime: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T09:00:00Z',
            },
            clockIn: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T09:15:00Z',
            },
            clockOut: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T18:00:00Z',
            },
            status: {
              type: 'string',
              enum: ['PRESENT', 'ABSENT', 'LEAVE'],
              example: 'PRESENT',
            },
            notes: {
              type: 'string',
              example: 'Regular shift',
            },
            firstOnlineAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T09:00:00Z',
            },
            lastOfflineAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T18:00:00Z',
            },
            totalOnlineMinutes: {
              type: 'number',
              example: 480,
            },
            totalSessions: {
              type: 'number',
              example: 1,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T00:00:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T18:00:00Z',
            },
          },
        },
        AttendanceSession: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440004',
            },
            clockIn: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T09:15:00Z',
            },
            clockOut: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T18:00:00Z',
            },
            durationMinutes: {
              type: 'number',
              example: 480,
            },
            clockInLat: {
              type: 'number',
              example: 12.9716,
            },
            clockInLng: {
              type: 'number',
              example: 77.5946,
            },
            clockOutLat: {
              type: 'number',
              example: 12.9716,
            },
            clockOutLng: {
              type: 'number',
              example: 77.5946,
            },
          },
        },
        AttendanceMonitorRow: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440005',
            },
            driverId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440001',
            },
            staffId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440002',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440003',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            status: {
              type: 'string',
              example: 'Present',
            },
            clockIn: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T09:15:00Z',
            },
            clockOut: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T18:00:00Z',
            },
            totalDuration: {
              type: 'number',
              example: 480,
            },
            onlineStatus: {
              type: 'string',
              enum: ['online', 'offline'],
              example: 'online',
            },
            lastSeen: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T18:00:00Z',
            },
          },
        },
        AttendanceStatus: {
          type: 'object',
          properties: {
            clockedIn: {
              type: 'boolean',
              example: true,
            },
            clockInTime: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T09:15:00Z',
            },
            lastClockOutTime: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T18:00:00Z',
            },
            status: {
              type: 'string',
              example: 'Present',
            },
            attendanceId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
          },
        },
        SingleAttendanceResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              $ref: '#/components/schemas/AttendanceResponse',
            },
          },
        },
        PaginatedAttendanceResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AttendanceResponse',
              },
            },
            pagination: {
              $ref: '#/components/schemas/Pagination',
            },
          },
        },
        ClockAttendanceResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            date: {
              type: 'string',
              format: 'date',
              example: '2023-12-01',
            },
            loginTime: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T09:00:00Z',
            },
            clockIn: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T09:15:00Z',
            },
            clockOut: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T18:00:00Z',
            },
            status: {
              type: 'string',
              enum: ['PRESENT', 'ABSENT', 'LEAVE'],
              example: 'PRESENT',
            },
            driverId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440001',
            },
            staffId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440002',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440003',
            },
          },
        },
        CreateAttendanceRequest: {
          type: 'object',
          properties: {
            driverId: {
              type: 'string',
              format: 'uuid',
            },
            staffId: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            date: {
              type: 'string',
              format: 'date',
              example: '2023-12-01',
            },
            loginTime: {
              type: 'string',
              format: 'date-time',
            },
            clockIn: {
              type: 'string',
              format: 'date-time',
            },
            clockOut: {
              type: 'string',
              format: 'date-time',
            },
            status: {
              type: 'string',
              enum: ['PRESENT', 'ABSENT', 'LEAVE'],
              example: 'PRESENT',
            },
            notes: {
              type: 'string',
            },
          },
          required: ['date', 'status'],
        },
        UpdateAttendanceRequest: {
          type: 'object',
          properties: {
            loginTime: {
              type: 'string',
              format: 'date-time',
            },
            clockIn: {
              type: 'string',
              format: 'date-time',
            },
            clockOut: {
              type: 'string',
              format: 'date-time',
            },
            status: {
              type: 'string',
              enum: ['PRESENT', 'ABSENT', 'LEAVE'],
            },
            notes: {
              type: 'string',
            },
          },
        },
        UpdateAttendanceStatusRequest: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['PRESENT', 'ABSENT', 'LEAVE'],
              example: 'PRESENT',
            },
            notes: {
              type: 'string',
              example: 'Updated status',
            },
          },
          required: ['status'],
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'OTP',
        description: 'OTP generation and verification',
      },
      {
        name: 'Notifications',
        description: 'Notification management',
      },
      {
        name: 'Staff',
        description: 'Staff management (ADMIN, MANAGER access)',
      },
      {
        name: 'Reports',
        description: 'Analytics and reporting endpoints',
      },
      {
        name: 'Security',
        description: 'Security and audit endpoints',
      },
      {
        name: 'Attendance',
        description: 'Attendance tracking and management',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
