# Gym CRM - Management System

A production-ready Gym Management System built with the MERN stack. Designed for gym owners to manage members, subscription plans, payments, and attendance with ease.

## 🚀 Live Demo (Future Link)
[View Live Demo](https://your-deployment-link.vercel.app)

## ✨ Features

- **Admin Dashboard**: Real-time stats (Revenue, Total Members, Attendance, Expiring Soon).
- **Member Management**: Register, update, and track members with automatic expiry logic.
- **Plan Management**: CRUD operations for various subscription plans.
- **Payment Tracking**: Record transactions and view payment history per member.
- **Attendance System**: Daily check-in system with check-out tracking (future) and duplicate prevention.
- **Production Optimized**: JSON/CSV exports, pagination, and fast MongoDB queries (.lean architecture).
- **Security**: JWT Authentication, CORS protection, and secure password hashing.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Axios, React Router.
- **Backend**: Node.js, Express, Mongoose.
- **Database**: MongoDB Atlas.
- **Styling**: Vanilla CSS (Premium Glassmorphism Design).

## ⚙️ Installation

### 1. Clone the repo
```bash
git clone https://github.com/your-username/gym-crm.git
cd gym-crm
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_strong_secret
CLIENT_URL=http://localhost:5173
```
Run the server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
```
Run the client:
```bash
npm run dev
```

## 📊 API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login as admin |
| GET | `/api/members` | Get paginated members |
| GET | `/api/members/expiring-soon` | Get members expiring in 7 days |
| GET | `/api/members/export/csv` | Download members report |
| GET | `/api/dashboard/stats` | Get dashboard overview |

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
