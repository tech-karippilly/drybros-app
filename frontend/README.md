# DRybros Frontend - Admin Dashboard

This is the official administrative web dashboard for the **DRybros** platform, built with **Next.js**, **TypeScript**, and **Tailwind CSS**.

For the complete project overview and other modules, see the [Main Project README](../README.md).

## 🚀 Features

- **Authentication System**: Complete staff portal with Login, Register, Forgot Password, and Reset Password flows.
- **State Management**: Powered by **Redux Toolkit** with typed hooks and a structured slice organization.
- **API Integration**: Configured **Axios** instance with automatic access/refresh token rotation (JWT).
- **Design System**: 
  - Custom light and dark mode support.
  - Reusable UI component library (Button, Modal, Alert, Calendar, DatePicker, etc.).
  - Consistent typography and form elements.
- **Modern Tech Stack**: React 19, Next.js 15 (App Router), Lucide Icons, and date-fns.

## 🛠️ Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔗 Project Pages (Development)

The following routes are implemented and ready for testing:

- **[Login Portal](http://localhost:3000/login)**: Staff sign-in page.
- **[Register Admin](http://localhost:3000/register)**: Administrative account creation.
- **[Dashboard](http://localhost:3000/dashboard)**: Admin operations homepage.
- **[Forgot Password](http://localhost:3000/forgot-password)**: Link-based password recovery.
- **[Reset Password](http://localhost:3000/reset-password?token=example-token)**: Secure password update screen.
- **[404 Error Page](http://localhost:3000/some-non-existent-page)**: Custom branded error handling.

## 📂 Project Structure

- `app/`: Next.js App Router folders and pages.
- `components/ui/`: Reusable primitive components (Shadcn style).
- `lib/`: Utility functions, store configuration, and API clients.
- `public/`: Static assets and icons.

## 📝 Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
