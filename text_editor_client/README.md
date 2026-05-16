# Realtime Text Editor Client

A modern React frontend client for a realtime collaborative text editor application using SignalR and Syncfusion Document Editor.

## 🚀 Project Overview

This repository contains the client-side application for a realtime document collaboration platform. It includes:

- Authentication and session management
- Protected routes for users and admins
- Realtime presence, locking, and document synchronization using SignalR
- Rich document editing via Syncfusion Document Editor
- Tailwind CSS UI styling
- API communication via Axios

## 🧩 Technology Stack

- **React** 19
- **Vite** for fast development and build
- **Tailwind CSS** for styling
- **React Router v7** for client-side routing
- **Axios** for HTTP requests
- **SignalR** for realtime synchronization
- **Syncfusion React Document Editor** for rich document editing
- **Zustand** for lightweight state management
- **React Toastify** for notifications

## 📁 Project Structure

```text
src/
  components/         # Reusable UI and editor components
  pages/              # React pages and routes
  services/           # API, auth, realtime, session, and HTTP helpers
  store/              # Zustand state stores
  utils/              # Helpers, parsers, and document utilities
  App.jsx             # Route definitions and auth guards
  main.jsx            # App bootstrap
  index.css           # Global styles
```

## ⚙️ Environment

The app uses `VITE_API_URL` to override the backend API base URL. If not provided, the default API URL is:

```bash
https://localhost:8001/api
```

## 💻 Local Setup

Make sure you have Node.js installed, then run:

```bash
npm install
npm run dev
```

The app will start in development mode using Vite.

## 🧪 Build

Build the production bundle with:

```bash
npm run build
```

Preview the production build locally with:

```bash
npm run preview
```

## 🔐 Authentication

- Login and registration flows are implemented in `src/services/userService.js` and `src/pages/LoginPage.jsx`
- Access tokens are stored in `localStorage` under `accessToken`
- HTTP requests automatically attach `Authorization: Bearer <token>` using the Axios interceptor in `src/services/http.js`
- The app redirects to `/login` on missing or invalid auth

## 🌐 Realtime Collaboration

Realtime synchronization and presence are handled by SignalR:

- `@microsoft/signalr` is used to connect to the backend
- SignalR connection logic is in `src/services/signalRService.js`
- Editor sections and presence updates are managed via realtime events

## 📝 Important Files

- `src/services/http.js` — Axios instance, auth header injection, refresh token flow
- `src/services/userService.js` — login/register/profile API calls
- `src/services/signalRService.js` — realtime connection and event handling
- `src/pages/LoginPage.jsx` — login/register UI and auth flow
- `src/pages/SectionUserEdit.jsx` — user section editor page
- `src/App.jsx` — protected route definitions and navigation logic

## 📌 Notes

- The client currently expects the backend API to expose auth and document endpoints, including Token-based auth on most `/api` routes.
- If you want to change the backend base URL, set `VITE_API_URL` in a `.env` file or the environment.

## 👍 Recommended Improvements

- Move token storage to HTTP-only cookies for better security
- Add more robust error handling for API and realtime failures
- Add automated tests for auth, routing, and collaboration flows

## 📚 Reference

The project includes a backend API specification in `BACKEND_API_SPEC.md`.
