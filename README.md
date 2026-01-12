# Drybros App

Monorepo for the Drybros driver-on-demand platform. This repository houses the complete ecosystem including the backend APIs, admin web dashboard, and the driver mobile application. The platform is designed to manage trips, drivers, pricing, payroll, incentives, and operations at scale.

## Project Structure

The project is organized into three main directories:

- **`backend-api`**: The server-side application handling business logic, database interactions, and API endpoints. Built with **Node.js** and **TypeScript**.
- **`frontend`**: The web-based administration dashboard for operations to manage the platform. Built with **Next.js** and **TypeScript**.
- **`mobile`**: The mobile application for drivers to accept trips and manage their profile. Built with **React Native** (Expo) and **TypeScript**.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS version recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- For Mobile: [Expo Go](https://expo.dev/client) app on your mobile device or an Emulator.

### Installation & Running Locally

Since this is a multi-project repository, you will need to setup each part individually.

#### 1. Backend API

```bash
cd backend-api
npm install
# Create a .env file if required based on configuration
npm run dev
```

#### 2. Frontend (Admin Web)

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the web app.

**Available Routes:**
- [Login](http://localhost:3000/login)
- [Forgot Password](http://localhost:3000/forgot-password)
- [Reset Password](http://localhost:3000/reset-password?token=test)

#### 3. Mobile App

```bash
cd mobile
npm install
npx expo start
```
Scan the QR code with the Expo Go app to run on your device.

## Technologies

- **Backend**: Node.js, TypeScript, Express (assumed), Nodemon
- **Frontend**: Next.js (App Router), TypeScript, TailwindCSS (assumed common pair with Next.js)
- **Mobile**: React Native, Expo, TypeScript

## License

[MIT](LICENSE)
