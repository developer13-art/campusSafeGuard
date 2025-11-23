# Campus Emergency Alert System

## Overview
A full-stack emergency response and anonymous support system for campus safety. Built with React, Express, PostgreSQL, and WebSockets for real-time communication.

## Recent Changes
- **2025-11-23**: Initial Replit setup completed
  - Database provisioned and schema migrated
  - Test accounts seeded
  - Development server configured on port 5000
  - WebSocket support enabled for real-time notifications
  - Deployment configuration set up

## Project Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Real-time**: WebSockets for live alerts and chat
- **Authentication**: Session-based with bcrypt password hashing

### Project Structure
```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components (login, dashboards)
│   │   └── lib/          # Auth context, utilities
│   └── index.html
├── server/               # Express backend
│   ├── app.ts            # Express app setup
│   ├── routes.ts         # API routes
│   ├── db.ts             # Database connection
│   ├── storage.ts        # Data access layer
│   └── seed.ts           # Database seeder
├── shared/
│   └── schema.ts         # Shared database schema and types
└── vite.config.ts        # Vite configuration
```

### Key Features
1. **Emergency Alerts**: Students can send emergency alerts to medical or security departments
2. **Anonymous Chat**: Students can chat anonymously with campus support services
3. **Role-Based Access**: 
   - Students: Create alerts, start anonymous chats
   - Staff: Respond to department-specific alerts and chats
   - Admin: Full system oversight and user management
4. **Real-time Notifications**: WebSocket-based instant updates for alerts and messages

## Test Accounts

### Student Accounts
- `student1@campus.edu` / `student123`
- `student2@campus.edu` / `student123`
- `student3@campus.edu` / `student123`

### Staff Accounts
- `medical.staff@campus.edu` / `medical123` (Medical Department)
- `security.staff@campus.edu` / `security123` (Security Department)
- `guidance.staff@campus.edu` / `guidance123` (Guidance Department)

### Admin Account
- `admin@campus.edu` / `admin123`

## Development

### Running the Application
The application runs automatically via the "Start application" workflow, which:
- Starts the Express server with Vite middleware
- Serves both frontend and backend on port 5000
- Enables hot module replacement for frontend development

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# Seed test data (only needed once)
tsx server/seed.ts

# Type checking
npm run check
```

### Build and Production
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

### Required Secrets (managed by Replit)
- `SESSION_SECRET`: Session encryption key
- `DATABASE_URL`: PostgreSQL connection string (auto-provisioned)

### Auto-configured
- `REPLIT_DOMAINS`: Replit domain configuration
- `REPLIT_DEV_DOMAIN`: Development domain
- `REPL_ID`: Replit project identifier

## Database Schema

### Tables
- `users`: User accounts with role-based access (student/staff/admin)
- `alerts`: Emergency alerts with status tracking
- `chat_sessions`: Anonymous chat sessions
- `messages`: Chat messages
- `locations`: Campus buildings/locations
- `audit_logs`: Admin action logging

### Alert Flow
1. **Pending**: Alert created by student
2. **Acknowledged**: Staff member acknowledges the alert
3. **Dispatched**: Response team dispatched
4. **Resolved**: Emergency resolved

## API Endpoints

### Authentication
- `POST /api/auth/login`: User login
- `POST /api/auth/logout`: User logout
- `GET /api/auth/me`: Get current user

### Alerts
- `POST /api/alerts`: Create new alert (students)
- `GET /api/alerts/my-alerts`: Get user's alerts
- `GET /api/alerts/department/:department`: Get department alerts (staff)
- `PATCH /api/alerts/:id`: Update alert status (staff)

### Chat
- `POST /api/chats/sessions`: Create anonymous chat session
- `GET /api/chats/my-sessions`: Get user's chat sessions
- `GET /api/chats/department/:department`: Get department chats (staff)
- `POST /api/chats/messages`: Send message
- `GET /api/chats/messages/:sessionId`: Get session messages

### Admin
- `GET /api/admin/stats`: System statistics
- `GET /api/admin/users`: List all users
- `POST /api/admin/users`: Create new user
- `DELETE /api/admin/users/:id`: Delete user

## WebSocket Events

### Client Events
- Connection authenticated via session cookie
- Auto-reconnects on disconnect

### Server Events
- `new_alert`: New emergency alert created
- `alert_updated`: Alert status changed
- `chat_message`: New chat message received

## Deployment

The project is configured for deployment with:
- **Target**: Autoscale (serverless)
- **Build**: `npm run build`
- **Run**: `npm start`

The production build:
1. Compiles frontend assets to `dist/public`
2. Bundles backend server to `dist/index.js`
3. Serves static files and API from single Express server

## User Preferences
None configured yet.

## Design System
See `design_guidelines.md` for complete design specifications including:
- Material Design patterns for safety-critical applications
- Typography system and spacing
- Component library specifications
- Mobile-first responsive behavior
- Accessibility standards
