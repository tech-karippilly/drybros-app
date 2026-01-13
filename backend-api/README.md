# Drybros Backend API

This is the backend API service for the Drybros platform, built with Node.js, Express, and TypeScript. It powers the admin dashboard and driver mobile application.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Documentation**: Swagger UI
- **Utilities**: Nodemon, Dotenv, CORS

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS version)
- npm or yarn

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
   PORT=5000
   SERVER_URL=http://localhost:5000
   ```

### Running the Application

- **Development Mode** (with hot reload):
  ```bash
  npm run dev
  ```
  The server will start at `http://localhost:5000`.

- **Production Start**:
  ```bash
  npm start
  ```

## 📚 API Documentation

We use **Swagger** for API documentation.

Once the server is running, you can access the interactive API docs at:
👉 **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)**

This documentation provides details on available endpoints, request bodies, and response schemas.

## 📂 Project Structure

```
backend-api/
├── src/
│   ├── config/         # Configuration files (Swagger, DB, etc.)
│   ├── constants/      # Global constants (Endpoints, Status Codes)
│   ├── app.ts          # Express application setup and middleware
│   └── index.ts        # Server entry point
├── .env                # Environment variables
├── nodemon.json        # Nodemon configuration
└── package.json        # Project dependencies and scripts
```

## 📝 Scripts

- `npm run dev`: Runs the application in development mode using `nodemon`.
- `npm start`: Runs the application.
