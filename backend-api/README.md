# Drybros Backend API

This is the backend API service for the Drybros platform, built with Node.js, Express, TypeScript, and Prisma ORM. It powers the admin dashboard and driver mobile application with a robust, type-safe database layer.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Documentation**: Swagger UI (OpenAPI 3.0) + YAML
- **Dev Tools**: ts-node-dev, nodemon
- **Middleware**: CORS, dotenv

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL database

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Configuration:
   Create a `.env` file in the root of the `backend-api` directory with the following variables:

   ```env
   PORT=4000
   API_VERSION=V2
   NODE_ENV=DEVELOPMENT
   DEVELOPMENT_BASE_URL=http://localhost:4000
   PRODUCTION_BASE_URL=https://dybros.com
   DATABASE_URL="postgresql://user:password@localhost:5432/drybros?schema=public"
   JWT_SECRET=your-secret-key-change-in-production
   
   # CORS Configuration
   FRONTEND_URL_BASE=http://localhost:3000
   # For multiple frontend URLs, use comma-separated values:
   # FRONTEND_URL_BASE=http://localhost:3000,https://app.drybros.com
   
   # Email Configuration (Gmail)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-gmail-app-password
   EMAIL_FROM=your-email@gmail.com
   LOGIN_LINK=http://localhost:3000/login
   REST_PASSWORD=http://localhost:3000/reset-password
   ```

4. Set up the database:
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # (Optional) Seed the database
   npx prisma db seed
   ```

### Running the Application

- **Development Mode** (with hot reload):
  ```bash
  npm run dev
  ```
  The server will start at `http://localhost:4000`.

- **Production Start**:
  ```bash
  npm start
  ```

## 📚 API Documentation

We use **Swagger** for API documentation.

Once the server is running, you can access the interactive API docs at:
👉 **[http://localhost:4000/api-docs](http://localhost:4000/api-docs)**

This documentation provides details on available endpoints, request bodies, and response schemas.

### Available Endpoints

- `GET /health` - Health check endpoint
- `GET /version` - API version information
- `GET /` - Root endpoint
- `POST /auth/login` - User authentication
- `GET /franchises` - List all franchises
- `GET /drivers` - List all drivers
- `GET /customers` - List all customers
- `GET /trips` - List all trips

## 📂 Project Structure

```
backend-api/
├── prisma/
│   ├── migrations/        # Database migration files
│   ├── schema.prisma      # Prisma schema definition
│   └── seed.ts            # Database seeding script
├── src/
│   ├── config/            # Configuration files (App, Auth, Prisma)
│   ├── controllers/       # Request handlers
│   ├── docs/              # OpenAPI/Swagger YAML specs
│   ├── middlewares/       # Express middlewares (auth, error handling)
│   ├── repositories/      # Database access layer
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic layer
│   ├── utils/             # Utility functions (OTP, etc.)
│   └── index.ts           # Server entry point
├── .env                   # Environment variables
├── nodemon.json           # Nodemon configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies and scripts
```

## 🗄️ Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

- **Franchise**: Franchise locations
- **Driver**: Driver information and status
- **Customer**: Customer profiles
- **Trip**: Trip bookings and tracking
- **User**: Admin and staff authentication

To view and edit the database visually:
```bash
npx prisma studio
```

## 📝 Scripts

- `npm run dev`: Runs the application in development mode with hot reload
- `npm start`: Runs the application in production mode
- `npx prisma generate`: Generates Prisma Client
- `npx prisma migrate dev`: Creates and applies database migrations
- `npx prisma studio`: Opens Prisma Studio (database GUI)

## 🔐 Authentication

The API uses JWT-based authentication. Protected routes require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## 🌐 CORS

CORS is configured to allow requests from the frontend URL specified in `FRONTEND_URL_BASE` environment variable.

- **Development**: Allows requests from `FRONTEND_URL_BASE` and any localhost origin
- **Production**: Only allows requests from `FRONTEND_URL_BASE` (comma-separated if multiple URLs)

To configure, set the `FRONTEND_URL_BASE` environment variable in your `.env` file:
```env
FRONTEND_URL_BASE=http://localhost:3000
# Or for multiple URLs:
FRONTEND_URL_BASE=http://localhost:3000,https://app.drybros.com
```

The CORS configuration supports:
- Credentials (cookies, authentication headers)
- Standard HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)
- Content-Type and Authorization headers

## 🐛 Error Handling

The API includes centralized error handling middleware that returns consistent error responses:

```json
{
  "error": "Error message here"
}
```

## 📌 Notes

- The backend runs on port **4000** by default (configurable via `.env`)
- Frontend runs on port **3000**
- Ensure PostgreSQL is running before starting the server
- Use `ts-node-dev` for development with automatic restarts
