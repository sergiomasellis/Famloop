# Tapestry - Family Calendar Application
## PRD (Product Requirements Document) and System Design

---

## 1. PRD (Product Requirements Document)

### 1.1 Product Overview

Tapestry is a modern, touch-friendly family calendar application designed to help families organize their schedules, track household chores, and motivate children through a gamified point system. The application integrates with multiple calendar sources (iCalendar, Google Calendar, Alexa Reminders) to provide a unified view of family activities while adding a unique chore management system powered by AI.

### 1.2 Target Users

- **Primary Users**: Parents (administrators)
- **Secondary Users**: Children (participants)
- **User Characteristics**:
  - Parents need tools to manage family schedules, assign chores, and set goals
  - Children need an engaging, simple interface to view their responsibilities and track rewards
  - All users require a touch-friendly interface suitable for tablets and mobile devices

### 1.3 Key Features

#### 1.3.1 Calendar Integration
- Integration with iCalendar feeds
- Google Calendar synchronization via API
- Alexa Reminders integration
- All integrations handled on the backend for security and performance

#### 1.3.2 Weekly View
- Display of the current week with days organized horizontally
- Time-based layout showing events from start to finish
- Current time indicator as a horizontal bar across the screen
- Visual representation of family member participation on events

#### 1.3.3 Event Management
- Events display with title and emoji
- Brief description for each event
- Time span visualization from start time to finish time
- Family member icons/profile images showing participants

#### 1.3.4 Chore Tracking System
- AI-powered chore point assignment
- Weekly AI-generated chore suggestions
- Children can mark chores as complete themselves
- Visual chore cards with emojis for easy identification

#### 1.3.5 Leaderboard and Rewards
- Point tracking for completed chores
- Leaderboard display showing family members' progress
- Parent-controlled goal setting for real-world prizes
- Prizes can include toys, outings, and other incentives

#### 1.3.6 Family Management
- Parent invitation system for new family members
- Family member profiles with customizable icons/images
- Master admin password for parental controls
- Different user roles (parent/child)

### 1.4 Functional Requirements

#### 1.4.1 User Management
- FR-001: Parents can create family groups
- FR-002: Parents can invite family members via email or link
- FR-003: Parents can set a master admin password
- FR-004: Users can upload profile images
- FR-005: Users can select predefined icons if they don't upload images

#### 1.4.2 Calendar Integration
- FR-006: Backend can sync with iCalendar feeds
- FR-007: Backend can authenticate and sync with Google Calendar
- FR-008: Backend can retrieve Alexa Reminders
- FR-009: Calendar events display title with emoji
- FR-010: Calendar events display brief description
- FR-011: Calendar events show time span visually
- FR-012: Calendar events display participating family members' icons

#### 1.4.3 Chore Management
- FR-013: AI system generates weekly chore suggestions
- FR-014: AI system assigns appropriate point values to chores
- FR-015: Children can view assigned chores
- FR-016: Children can mark chores as complete
- FR-017: Chores display with short descriptions and emojis
- FR-018: Parents can override AI suggestions and point values

#### 1.4.4 Leaderboard and Goals
- FR-019: System tracks points for completed chores
- FR-020: Leaderboard displays family members' current points
- FR-021: Parents can set goals with point requirements
- FR-022: Parents can define real-world prizes for goals
- FR-023: Children can view available goals and their progress

### 1.5 Non-functional Requirements

#### 1.5.1 Usability
- NFR-001: Interface must be touch-friendly with large tap targets
- NFR-002: Application must be responsive on tablets and mobile devices
- NFR-003: Simple navigation for children's use
- NFR-004: Visual indicators must be clear and intuitive

#### 1.5.2 Performance
- NFR-005: Calendar views must load within 2 seconds
- NFR-006: Chore completion updates must appear in real-time
- NFR-007: Leaderboard refresh must occur within 1 second of updates

#### 1.5.3 Security
- NFR-008: Master admin password must be securely stored
- NFR-009: User data must be protected with appropriate authentication
- NFR-010: Calendar integration tokens must be securely managed
- NFR-011: Children should not be able to access administrative functions

#### 1.5.4 Reliability
- NFR-012: Calendar synchronization should occur automatically every 15 minutes
- NFR-013: System should handle API failures gracefully
- NFR-014: Data should be persisted locally in case of network issues

### 1.6 User Stories

#### 1.6.1 Parent Stories
- As a parent, I want to invite family members to the calendar so that everyone can participate
- As a parent, I want to set goals and prizes so that I can motivate my children
- As a parent, I want to see all family calendars in one view so that I can coordinate activities
- As a parent, I want to manage the AI chore system so that I can ensure appropriate tasks

#### 1.6.2 Child Stories
- As a child, I want to see my chores and events for the week so that I know what I need to do
- As a child, I want to mark chores as complete so that I can earn points
- As a child, I want to see my progress on the leaderboard so that I'm motivated to do more
- As a child, I want to view available prizes so that I know what I'm working toward

### 1.7 Acceptance Criteria

#### 1.7.1 Calendar View
- Weekly calendar displays correctly with horizontal day layout
- Current time bar appears across all days at the correct time
- Events show title, emoji, description, and time span
- Family member icons appear on events they're participating in

#### 1.7.2 Chore System
- AI generates at least 5 age-appropriate chores per child weekly
- Each chore has a point value between 1-10
- Children can successfully mark chores as complete
- Points update immediately in the leaderboard

#### 1.7.3 User Management
- Parent can successfully invite family members
- Master admin password protects administrative functions
- Profile images display correctly on all relevant components
- Different user roles have appropriate permissions

#### 1.7.4 Integration
- iCalendar feeds sync correctly with backend
- Google Calendar events appear in the unified view
- Alexa Reminders are retrieved and displayed
- All integrations refresh automatically every 15 minutes

---

## 2. System Design

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  Components: Calendar, Events, Chores, Leaderboard, Auth   │
│  UI Library: ShadCN via TanStack Start                     │
│  Styling: shadCN + Tailwind                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                    REST API Calls
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                        │
├─────────────────────────────────────────────────────────────┤
│  Services:                                                  │
│  - User Management                                          │
│  - Calendar Integration (iCal, Google, Alexa)              │
│  - Chore AI System                                          │
│  - Points Tracking                                          │
│  - Leaderboard Management                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                    Database Operations
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Database (SQLite)                        │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                    │
│  - Users                                                    │
│  - Events                                                   │
│  - Chores                                                   │
│  - Points                                                   │
│  - FamilyGroups                                             │
│  - CalendarTokens                                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Frontend Design (Next.js)

#### 2.2.1 Component Hierarchy
```
App
├── Header
│   ├── FamilyMemberIcons
│   └── UserProfile
├── CalendarView
│   ├── WeekHeader
│   ├── DayColumn
│   │   ├── CurrentTimeIndicator
│   │   ├── EventCard
│   │   │   ├── EventTitle (with emoji)
│   │   │   ├── EventDescription
│   │   │   └── ParticipantIcons
│   │   └── ChoreCard
│   │       ├── ChoreTitle (with emoji)
│   │       ├── ChoreDescription
│   │       ├── PointValue
│   │       └── ParticipantIcons
├── EventDetailsModal
├── ChoreDetailsModal
├── Leaderboard
│   ├── FamilyMemberRow
│   │   ├── ProfileIcon
│   │   └── PointDisplay
│   └── GoalsSection
└── Auth
    ├── Login
    ├── Signup
    └── Invite
```

#### 2.2.2 Pages and Routing
- `/dashboard` - Main calendar view showing the current week
- `/events/[id]` - Detailed view of specific events
- `/chores/[id]` - Detailed view of specific chores
- `/leaderboard` - Points tracking and goal management
- `/admin` - Parent administrative functions
- `/auth/login` - User login page
- `/auth/signup` - User signup page
- `/auth/invite` - Family member invitation page

#### 2.2.3 State Management
- Global state for user authentication and profile information
- Calendar state for events and chores
- Leaderboard state for points tracking
- Modal state for event/chore details

#### 2.2.4 Touch-Friendly UI Implementation
- Large tap targets for all interactive elements
- Swipe gestures for navigating between weeks
- Modal dialogs for detailed views
- Responsive grid layout using shadcn
- ShadCN components customized for touch interaction

### 2.3 Backend Design (FastAPI)

#### 2.3.1 API Endpoints

**User Management:**
- `POST /api/users/` - Create new user
- `GET /api/users/{user_id}` - Get user details
- `PUT /api/users/{user_id}` - Update user profile
- `DELETE /api/users/{user_id}` - Delete user
- `POST /api/families/` - Create family group
- `POST /api/families/{family_id}/invite` - Invite family member
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login with master password

**Calendar Integration:**
- `GET /api/calendars/` - Get all calendar events for current week
- `POST /api/calendars/ical` - Add iCalendar feed
- `POST /api/calendars/google` - Connect Google Calendar
- `POST /api/calendars/alexa` - Connect Alexa Reminders
- `GET /api/calendars/sync` - Force calendar synchronization

**Chore Management:**
- `GET /api/chores/` - Get all chores for current week
- `POST /api/chores/` - Create new chore
- `PUT /api/chores/{chore_id}` - Update chore
- `DELETE /api/chores/{chore_id}` - Delete chore
- `POST /api/chores/{chore_id}/complete` - Mark chore as complete
- `GET /api/chores/generate` - Generate AI chore suggestions

**Points and Leaderboard:**
- `GET /api/points/` - Get current points for all family members
- `POST /api/points/` - Add points to user
- `GET /api/goals/` - Get all available goals
- `POST /api/goals/` - Create new goal
- `PUT /api/goals/{goal_id}` - Update goal
- `DELETE /api/goals/{goal_id}` - Delete goal

#### 2.3.2 Calendar Integration Services

**iCalendar Service:**
- Parse .ics files and feeds
- Extract events with titles, descriptions, times
- Handle recurring events

**Google Calendar Service:**
- OAuth2 authentication flow
- Use Google Calendar API to retrieve events
- Handle token refresh automatically

**Alexa Reminders Service:**
- Integration with Alexa Skills Kit
- Retrieve reminders from Alexa accounts
- Parse reminder data into event format

#### 2.3.3 AI Chore Management System

**Chore Generation:**
- Age-appropriate chore suggestions
- Weekly chore planning algorithm
- Customizable chore templates

**Point Assignment:**
- AI determines point values based on chore difficulty
- Point values between 1-10
- Learning system to improve point assignments over time

#### 2.3.4 Authentication and Authorization

**Authentication:**
- JWT tokens for session management
- Password hashing with bcrypt
- Master admin password verification

**Authorization:**
- Role-based access control (Parent/Child)
- Administrative functions protected by master password
- User-specific data access restrictions

### 2.4 Database Schema (SQLite)

#### 2.4.1 Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('parent', 'child')),
    profile_image_url TEXT,
    icon_emoji TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES family_groups(id)
);
```

#### 2.4.2 FamilyGroups Table
```sql
CREATE TABLE family_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    admin_password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.4.3 Events Table
```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    emoji TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    source TEXT CHECK(source IN ('ical', 'google', 'alexa', 'manual')),
    source_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES family_groups(id)
);
```

#### 2.4.4 EventParticipants Table
```sql
CREATE TABLE event_participants (
    event_id INTEGER,
    user_id INTEGER,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 2.4.5 Chores Table
```sql
CREATE TABLE chores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    emoji TEXT,
    point_value INTEGER CHECK(point_value BETWEEN 1 AND 10),
    assigned_to INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    week_start DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES family_groups(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

#### 2.4.6 Points Table
```sql
CREATE TABLE points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    chore_id INTEGER,
    points INTEGER,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (chore_id) REFERENCES chores(id)
);
```

#### 2.4.7 Goals Table
```sql
CREATE TABLE goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    point_requirement INTEGER,
    prize TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES family_groups(id)
);
```

#### 2.4.8 CalendarTokens Table
```sql
CREATE TABLE calendar_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER,
    service TEXT CHECK(service IN ('google', 'alexa')),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES family_groups(id)
);
```

### 2.5 Security Considerations

1. **Password Security**:
   - All passwords hashed with bcrypt
   - Master admin password stored separately with additional security
   - Secure password reset mechanism

2. **API Security**:
   - JWT token authentication for all API endpoints
   - Token expiration and refresh mechanisms
   - Rate limiting to prevent abuse

3. **Data Protection**:
   - Family data isolated by family group
   - Role-based access control preventing unauthorized access
   - Secure storage of calendar integration tokens

4. **Calendar Integration Security**:
   - OAuth2 flows handled securely
   - Tokens encrypted in database
   - Regular token refresh to maintain access

### 2.6 Deployment Strategy

#### 2.6.1 Frontend Deployment
- Next.js application built for production
- Static assets served via CDN
- Deployed to Vercel or similar platform for optimal Next.js performance

#### 2.6.2 Backend Deployment
- FastAPI application containerized with Docker
- Deployed to cloud platform (AWS, Google Cloud, or Azure)
- API Gateway for handling requests
- Scheduled tasks for calendar synchronization

#### 2.6.3 Database Deployment
- SQLite for initial development and small-scale deployment
- Migration path to PostgreSQL for production scaling
- Regular backups of family data
- Database connection pooling for performance

#### 2.6.4 CI/CD Pipeline
- Automated testing for both frontend and backend
- Deployment triggered on git push to main branch
- Staging environment for testing new features
- Rollback mechanisms for failed deployments
