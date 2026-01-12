# Drybros App

Monorepo for the **Drybros** driver-on-demand platform. This repository houses the complete ecosystem including the backend APIs, admin web dashboard, and the driver mobile application.

## 📁 Project Structure

The project is organized into three main directories:

- **[`backend-api`](./backend-api)**: Server-side application handling business logic, database, and APIs. (Node.js/TS).
- **[`frontend`](./frontend)**: Administrative dashboard for operations management. (Next.js/TS).
- **[`mobile`](./mobile)**: Driver-facing mobile application for trip management. (React Native/Expo).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS)
- [npm](https://www.npmjs.com/)
- [Expo Go](https://expo.dev/client) (For mobile testing)

### Installation & Development

#### 1. Backend API
```bash
cd backend-api
npm install
npm run dev
```

#### 2. Frontend (Admin Web)
```bash
cd frontend
npm install
npm run dev
```
**Routes:** [Login](http://localhost:3000/login) | [Register](http://localhost:3000/register) | [Dashboard](http://localhost:3000/dashboard) | [Forgot Password](http://localhost:3000/forgot-password)

#### 3. Mobile App
```bash
cd mobile
npm install
npx expo start
```

## 💻 Technologies

| Backend | Frontend | Mobile |
| :--- | :--- | :--- |
| Node.js | Next.js 15 | React Native |
| TypeScript | TypeScript | Expo |
| Express | Tailwind CSS | TypeScript |
| JWT | Redux Toolkit | - |

## ⚖️ License

[MIT](LICENSE)
