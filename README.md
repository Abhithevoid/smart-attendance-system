# Smart Attendance System

A full-stack web application for managing classroom attendance using time-limited, HMAC-signed QR codes and optional GPS geofencing. Built with the MERN stack (MongoDB, Express, React, Node.js).

---

## Features

### Students
- Scan a teacher-displayed QR code to mark attendance
- GPS-based geofence verification (auto-skips on weak signal / laptop)
- View enrolled courses and personal attendance history
- Manual QR code entry fallback

### Teachers
- Start/end class sessions with a single click
- Live QR code display with configurable expiry timer (1–60 min)
- Auto-regeneration of QR codes on expiry
- Real-time attendance list (polls every 10 seconds)
- Download or copy QR codes for projection / sharing
- Per-session attendance progress with present/late/enrolled stats

### Admins
- Full CRUD for users, courses, classrooms, and enrollments
- View and manage all sessions system-wide
- Dashboard with live metrics (students, sessions, attendance rate)

### Security
- HMAC-SHA256 signed QR payloads — cannot be replayed or forged
- QR codes expire after a configurable window
- JWT authentication with role-based access control (student / teacher / admin)
- Geofencing validates that students are physically present

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, TailwindCSS 3 |
| Auth | JWT (HS256), bcryptjs |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| QR Scanning | html5-qrcode |
| QR Generation | qrcode (Canvas) |
| Geolocation | Browser Geolocation API + geolib |
| Icons | lucide-react |
| Compression | gzip via `compression` middleware |

---

## Project Structure

```
smart-attendance-system/
├── backend/
│   ├── server.js                 # Express app entry point
│   ├── config/
│   │   ├── db.js                 # Mongoose connection
│   │   └── classrooms.js         # Seed data helpers
│   ├── controllers/
│   │   ├── attendanceController.js
│   │   ├── authController.js
│   │   ├── classroomController.js
│   │   ├── courseController.js
│   │   ├── enrollmentController.js
│   │   ├── sessionController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js               # JWT verify + attach req.user
│   │   └── roleCheck.js          # Role-based guard factories
│   ├── models/
│   │   ├── Attendance.js
│   │   ├── Classroom.js
│   │   ├── Course.js
│   │   ├── Enrollment.js
│   │   ├── Session.js
│   │   └── User.js
│   ├── routes/
│   │   └── *.js                  # One file per resource
│   └── utils/
│       ├── geofencing.js         # Haversine distance check
│       ├── qrGenerator.js        # HMAC-signed QR payload
│       └── qrValidator.js        # Verify + decode QR token
└── frontend/
    ├── index.html
    ├── vite.config.js            # /api proxy → localhost:5000
    └── src/
        ├── App.jsx               # Route definitions
        ├── context/
        │   └── AuthContext.jsx   # JWT user state
        ├── utils/
        │   ├── api.js            # Axios instance + interceptors
        │   └── geolocation.js    # GPS wrapper with accuracy scoring
        ├── components/
        │   ├── QRScanner.jsx     # Full scanning flow (GPS→Camera→Submit)
        │   ├── Layout/
        │   │   └── DashboardLayout.jsx
        │   └── ...
        └── pages/
            ├── dashboard/
            │   ├── AdminDashboard.jsx
            │   ├── TeacherDashboard.jsx
            │   └── StudentDashboard.jsx
            ├── Teacher/
            │   ├── SessionPage.jsx   # Live session + QR display
            │   └── TeacherCourses.jsx
            ├── Student/
            │   ├── ScanPage.jsx
            │   └── StudentCourses.jsx
            └── Admin*/             # Admin CRUD pages
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally or a MongoDB Atlas URI
- **npm** ≥ 9

### 1. Clone the repository

```bash
git clone <repo-url>
cd smart-attendance-system
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smart-attendance
JWT_SECRET=your_super_secret_jwt_key_here
QR_SECRET=your_qr_hmac_secret_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Start the backend:

```bash
npm run dev     # nodemon (development)
# or
npm start       # node (production)
```

The API will be available at `http://localhost:5000`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

> The Vite dev server proxies all `/api/*` requests to `http://localhost:5000`, so no CORS issues during development.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens (≥ 32 chars recommended) |
| `QR_SECRET` | ✅ | HMAC secret for QR code signing (≥ 32 chars recommended) |
| `PORT` | ❌ | Server port (default: `5000`) |
| `FRONTEND_URL` | ❌ | Allowed CORS origin (default: `http://localhost:5173`) |
| `NODE_ENV` | ❌ | `development` or `production` |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user profile |

### Sessions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/session/create` | Teacher/Admin | Create session + generate QR |
| GET | `/api/session/active` | All | Get active sessions |
| GET | `/api/session/:id` | All | Get session by ID |
| GET | `/api/session/course/:courseId` | Teacher/Admin | Get all sessions for a course |
| GET | `/api/session/teacher/today` | Teacher/Admin | Today's sessions |
| POST | `/api/session/:id/generate-qr` | Teacher/Admin | Generate QR for session |
| POST | `/api/session/:id/regenerate-qr` | Teacher/Admin | Regenerate expired QR |
| PATCH | `/api/session/:id/end` | Teacher/Admin | End session |
| DELETE | `/api/session/:id` | Teacher/Admin | Cancel session |

### Attendance
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/attendance/mark` | Student | Mark attendance via QR |
| GET | `/api/attendance/session/:sessionId` | Teacher/Admin | Get session attendance |
| GET | `/api/attendance/student/:studentId` | Teacher/Admin/Self | Get student attendance |

### Courses
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/course` | All | List courses |
| POST | `/api/course` | Admin | Create course |
| GET | `/api/course/:id` | All | Get course details |
| PUT | `/api/course/:id` | Admin | Update course |
| DELETE | `/api/course/:id` | Admin | Delete course |

### Enrollments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/enrollment` | Admin | List all enrollments |
| POST | `/api/enrollment` | Admin | Enroll student in course |
| GET | `/api/enrollment/student/:studentId` | All | Student's enrollments |
| DELETE | `/api/enrollment/:id` | Admin | Remove enrollment |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user` | List all users |
| GET | `/api/user/:id` | Get user |
| PUT | `/api/user/:id` | Update user |
| DELETE | `/api/user/:id` | Delete user |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server + DB health check |

---

## QR Code Security

QR codes use a tamper-proof flow:

1. **Generation**: Server creates a payload `{ sessionId, courseId, teacherId, exp }` and signs it with HMAC-SHA256 using `QR_SECRET`.
2. **Encoding**: The signed payload is base64url encoded and stored in the session document.
3. **Scanning**: Student's device sends the raw QR string to `/api/attendance/mark`.
4. **Validation**: Server decodes, verifies HMAC signature, checks expiry, checks session status — only then marks attendance.

This prevents:
- Screenshot replay attacks (QR expires)
- Manual QR forgery (HMAC signature required)
- Cross-session reuse (sessionId embedded in payload)

---

## Geofencing

When a student marks attendance:
1. The browser requests GPS coordinates using the Geolocation API.
2. Coordinates and accuracy are sent alongside the QR code.
3. The server uses the Haversine formula to calculate distance from the classroom coordinates.
4. If the student is outside the allowed radius, attendance is **rejected with a distance hint**.

GPS signals are voluntary — students on desktops or with blocked GPS are allowed to skip location (marked as `geofence: weak_signal_skipped`). Teachers can see which records are unverified.

---

## Roles

| Role | Capabilities |
|------|-------------|
| `student` | Enroll in courses, scan QR, view own attendance |
| `teacher` | Manage own courses, create/end sessions, view session attendance |
| `admin` | Full access — users, courses, sessions, enrollments |

---

## Development Notes

- **Hot reload**: Both frontend (Vite HMR) and backend (`nodemon`) support hot reload during development.
- **QR Duration**: Configurable per session (1–60 minutes). Default is 10 minutes. Auto-regeneration fires when the countdown reaches zero.
- **Polling**: SessionPage polls attendance every 10 seconds while a session is active.
- **Mobile**: The QR scanner uses `facingMode: "environment"` to prefer the rear camera on mobile devices.

---

## Known Issues / Limitations

- GPS accuracy on desktop browsers is typically poor (~1000m+). The app auto-detects this and allows skipping location verification.
- Camera access requires **HTTPS** in production. Localhost is exempt from this restriction during development.
- `html5-qrcode` may trigger multiple scan callbacks on some devices; deduplicated with a `hasScanned` ref guard.
