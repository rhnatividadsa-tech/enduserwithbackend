# BayaniHub Mobile App

The mobile platform for the BayaniHub disaster response and resource management engine.
This application leverages **Expo (React Native)** for the frontend and a local **NestJS** backend integrated with **Supabase**.

## Getting Started

Because this application enforces an Authentication flow before accessing the dashboard, both the frontend mobile app and the backend API must be running simultaneously on your network.

### 1. Start the NestJS Backend

The backend must be running for the mobile app to successfully authenticate users and create accounts.

1. Open a new terminal.
2. Navigate into the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run start:dev
   ```
   *The backend should now be running on `http://localhost:3001`.*

### 2. Configure the Mobile API Connection

Before starting the Expo app, you must tell the app where to find the backend. This differs depending on whether you are using a Physical Phone or an Emulator.

Open `src/lib/api.ts` and update `API_BASE`:

**If testing on a Physical Phone via Wi-Fi:**
Find your computer's local Wi-Fi IP Address (e.g., `192.168.1.x`) and use it:
```typescript
// Replace 192.168.1.6 with YOUR computer's IPv4 address
export const API_BASE = "http://192.168.1.6:3001/api/v1";
```

**If testing on an Android Emulator:**
Use the loopback IP designed for Android emulators:
```typescript
export const API_BASE = "http://10.0.2.2:3001/api/v1";
```

### 3. Start the Mobile App

1. Open a *second* terminal.
2. Ensure you are in the root directory of the project (`bayanihub---mobile-app`).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Expo development server:
   ```bash
   npx expo start
   ```
5. Scan the QR code with your **Expo Go** app (iOS/Android), or press `a` to open it in a running Android Emulator.

---

## Troubleshooting

- **"Network Request Failed" during Login/Sign up:**
  This means the mobile app cannot reach the backend. Check that your backend terminal says it is running. If you're on a physical phone, double-check that `API_BASE` in `src/lib/api.ts` contains your computer's exact Wi-Fi IP address, and ensure your phone is connected to the *same* Wi-Fi network as your computer.
- **"Cannot find SecureStore":**
  Because the app uses `expo-secure-store` (a Native Module), you *must* completely restart `npx expo start` if it was installed while the server was running.
- **Red squiggly lines / TS Errors on Frontend code:**
  Make sure your `tsconfig.json` at the root of the project contains `"exclude": ["backend"]`. Otherwise, the React Native TS compiler will improperly try to compile your NestJS files.