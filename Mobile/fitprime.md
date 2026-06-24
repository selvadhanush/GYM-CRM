# FitPass (FitPrime) - Mobile App Implementation Plan

## Project Overview
FitPass is a gym access and workout-hour management platform allowing users to purchase workout hours and use them across a network of partnered gyms via a secure QR-based check-in system.

---

## 1. Core Technologies (Mobile App)
- **Framework**: React Native with Expo (Managed Workflow)
- **Navigation**: Expo Router (File-based routing)
- **State Management**: Zustand (for lightweight global state like Auth and Session)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Maps/Location**: `expo-location` (for geo-fencing verification)
- **QR Scanner**: `expo-camera`
- **Secure Storage**: `expo-secure-store` (for JWT and Session Tokens)
- **Payments**: Razorpay React Native SDK

## 2. Architecture & Modules

### A. Authentication & Security
- **JWT & Device Binding**: Store JWTs in secure storage. Capture Device ID to ensure only 1 logged-in device per user.
- **Auto-Logout**: Implement interceptors to force logout if token expires or multiple devices are detected.

### B. Home Dashboard
- Display **Remaining Workout Hours**.
- Quick action to **Scan QR Code**.
- Summary of recent workout history.

### C. QR Scanner & Check-in Flow
1. **Scan**: User scans the gym's unique QR code.
2. **Geo-Location Check**: App fetches current GPS coordinates.
3. **API Call**: Send `GymID` + `UserLat` + `UserLong` to backend.
4. **Validation**: Backend verifies user is within 100 meters of the Gym's coordinates.
5. **Session Token**: Backend generates a 5-minute session token.
6. **Duration Selection**: User selects how many hours they want to workout.
7. **Start**: Session begins, hours are temporarily reserved.

### D. Active Workout Session
- Persistent UI showing active workout timer.
- Background tasks (if necessary) or server-side CRON to auto-checkout when time expires.
- Manual Checkout button.

### E. Purchases & Hour Packages
- UI to list packages (Starter 10H, Pro 25H, Premium 50H, Elite 100H).
- Integration with Razorpay for seamless purchasing.
- Update balance immediately upon payment webhook success.

---

## 3. Development Phases

### Phase 1: Foundation (Weeks 1-2)
- Set up Expo project, NativeWind, and Expo Router.
- Build Authentication screens (Login, Register, OTP).
- Connect to existing backend API.

### Phase 2: Core User UI (Weeks 3-4)
- Build the Dashboard, Package Listing, and Profile screens.
- Implement Razorpay integration for buying workout hours.

### Phase 3: Hardware Integration (Weeks 5-6)
- Implement `expo-camera` for the QR scanning flow.
- Implement `expo-location` to fetch and request permissions for user location.
- Connect the Geo-verified Check-in API.

### Phase 4: Workout Tracking & History (Weeks 7-8)
- Build the Active Workout screen.
- Implement the checkout flow and actual hour deduction logic (connected to backend).
- Build the User History module (Invoices, Check-ins, Workouts).

### Phase 5: Polish & Security (Week 9)
- Implement push notifications using Firebase Cloud Messaging (FCM).
- Thorough testing against anti-abuse scenarios (fake GPS, screenshots).
- App Store & Play Store deployment preparation.
