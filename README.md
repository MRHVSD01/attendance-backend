# 🛠️ Attendance Calculator Backend

This is the **backend part** of the College Attendance Calculator project.  
It handles attendance processing, calculations, simulations, and database storage.

---

## ⚙️ Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Hosted on **Railway**

---

## 📂 Backend Folder Structure

- attendance-backend/
- │
- ├── controllers/
- │ └── attendanceController.js # All business logic
- │
- ├── models/
- │ └── Attendance.js # MongoDB schema
- │
- ├── routes/
- │ └── attendanceRoutes.js # API routes
- │
- ├── utils/
- │ └── csvValidator.js # ERP CSV validation
- │
- ├── server.js # App entry point
- ├── package.json
- ├── package-lock.json
- └── README.md

  
---

## 🔌 API Endpoints

- | Method |       Endpoint       | Description |
- |--------|----------------------|-------------|
- | POST   | /api/upload          | Upload or paste attendance |
- | GET    | /api/attendance      | Subject-wise attendance |
- | GET    | /api/aggregate       | Aggregate attendance |
- | POST   | /api/simulate/attend | Simulate attend |
- | POST   | /api/simulate/miss   | Simulate miss |
- | POST   | /api/target/aggregate | Target calculation |
- | POST   | /api/reset           | Reset attendance |

---

## 👥 Session-Based Multi User Logic

- Each request includes a `sessionId`
- Attendance records are stored using `sessionId`
- Multiple users can use backend at the same time
- No authentication required

---

## 🔐 Environment Variables

Create a `.env` file:
MONGO_URI=your_mongodb_atlas_connection_string.
PORT=5000

---

## ▶️ Run Locally

```bash
npm install.
node server.js

