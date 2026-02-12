# Contest App

<!-- ![Tech Stack](https://img.shields.io/badge/Stack-HTML_CSS_Node_Express_Mongo_JavaScript-blue) ![License](https://img.shields.io/badge/License-MIT-green) -->

A unified platform to track programming contests from multiple platforms, manage reminders, and receive timely notifications.

---

## Features

### Contest Management
- Aggregates contests from various coding platforms
- Shows start time, duration, and platform name
- Clean dashboard with filters and search

### Reminder System
- Schedule reminders for selected contests
- Enable or disable reminders with one click
- View already scheduled reminders

### User Module
- Secure authentication with Passport.js
- Personalized preferences
- User specific reminder list

### Admin Module
- Add or remove contest sources
- Control scheduled jobs
- View system status

---

## API Documentation

### Authentication
- POST /api/auth/register – Create new user
- POST /api/auth/login – User login
- GET /api/auth/logout – End session

### Contests
- GET /api/contests – Get all upcoming contests
- POST /api/contests/save – Store contests in DB
- DELETE /api/contests/:id – Remove contest

### Reminders
- POST /api/reminder/create – Schedule reminder
- GET /api/reminder/user – User reminders
- DELETE /api/reminder/:id – Cancel reminder
- POST /api/reminder/disable-all – Stop all reminders

### Users
- GET /api/user/profile – Get user data
- PUT /api/user/update – Update preferences

---

## Database Schema

### User
- name : String
- email : String
- password : String
- preferences : Object
- createdAt : Date

### Contest
- title : String
- platform : String
- startTime : Date
- duration : Number
- url : String

### Reminder
- userId : ObjectId
- contestId : ObjectId
- notifyAt : Date
- status : Boolean

---

## Repository Hierarchy

```
contest-app
│
├── backend
│   ├── src
│   │   ├── routes
│   │   │   ├── authRoutes.js
│   │   │   ├── contestRoutes.js
│   │   │   ├── reminder.route.js
│   │   │   └── userRoutes.js
│   │   │
│   │   ├── models
│   │   │   ├── user.js
│   │   │   ├── contest.js
│   │   │   └── reminder.js
│   │   │
│   │   ├── middleware
│   │   │   └── auth.js
│   │   │
│   │   └── config
│   │       └── passport.js
│   │
│   ├── server.js
│   └── package.json
│
├── frontend
│   ├── app.js
│   ├── index.html
│   └── style.css
│
├── .env
├── README.md
└── package.json
```

## Project Structure

### Backend
- src/routes
  - authRoutes.js
  - contestRoutes.js
  - reminder.route.js
  - userRoutes.js
- config/passport.js
- server.js

### Frontend
- app.js
- index.html
- style.css

---
