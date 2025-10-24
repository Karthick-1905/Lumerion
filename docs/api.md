# 📡 API Documentation

Comprehensive API documentation for ADL LMS backend services.

## 🔗 Base URL

```
Production: https://api.adl-lms.com
Development: http://localhost:8000
```

## 🔐 Authentication

All API requests require authentication except for public endpoints. Use Bearer token authentication:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "student"
    },
    "token": "jwt_token_here",
    "expiresIn": "7d"
  }
}
```

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "role": "student"
}
```

#### POST /api/auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/auth/reset-password
Reset password using token.

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

## 👤 User Management

### GET /api/users/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "student",
    "avatar": "avatar_url",
    "createdAt": "2024-01-01T00:00:00Z",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }
}
```

### PUT /api/users/profile
Update user profile.

**Request Body:**
```json
{
  "name": "Updated Name",
  "preferences": {
    "theme": "light",
    "notifications": false
  }
}
```

### POST /api/users/avatar
Upload user avatar.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `avatar`: Image file (max 5MB, formats: jpg, png, gif)

## 📚 Learning Paths

### GET /api/learning-paths
Get user's learning paths.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (active, completed, paused)

**Response:**
```json
{
  "success": true,
  "data": {
    "paths": [
      {
        "id": "path_id",
        "title": "Full Stack Development",
        "description": "Complete web development path",
        "status": "active",
        "progress": 65,
        "modules": [
          {
            "id": "module_id",
            "title": "HTML & CSS",
            "status": "completed",
            "progress": 100
          }
        ],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### POST /api/learning-paths
Create a new learning path.

**Request Body:**
```json
{
  "title": "New Learning Path",
  "description": "Description of the path",
  "subject": "Computer Science",
  "difficulty": "intermediate",
  "estimatedHours": 40
}
```

### GET /api/learning-paths/:id
Get specific learning path details.

### PUT /api/learning-paths/:id
Update learning path.

### DELETE /api/learning-paths/:id
Delete learning path.

### POST /api/learning-paths/:id/generate
Generate personalized learning path using AI.

**Request Body:**
```json
{
  "goals": ["Learn React", "Build projects"],
  "currentLevel": "beginner",
  "timeCommitment": "10_hours_week",
  "preferences": {
    "focusAreas": ["frontend", "backend"],
    "learningStyle": "practical"
  }
}
```

## 📖 Modules & Content

### GET /api/modules/:id
Get module details and content.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "module_id",
    "title": "React Fundamentals",
    "description": "Learn React basics",
    "content": {
      "type": "structured",
      "sections": [
        {
          "title": "Introduction",
          "content": "React is a JavaScript library...",
          "resources": [
            {
              "type": "video",
              "url": "https://example.com/video",
              "title": "React Intro Video"
            }
          ]
        }
      ]
    },
    "quiz": {
      "id": "quiz_id",
      "questions": 10,
      "timeLimit": 30
    },
    "progress": {
      "completed": false,
      "score": null,
      "timeSpent": 45
    }
  }
}
```

### PUT /api/modules/:id/progress
Update module progress.

**Request Body:**
```json
{
  "completed": true,
  "timeSpent": 60,
  "notes": "Completed all exercises"
}
```

## 🧠 AI-Powered Features

### POST /api/ai/quiz/generate
Generate quiz for a module.

**Request Body:**
```json
{
  "moduleId": "module_id",
  "difficulty": "intermediate",
  "questionCount": 10,
  "topics": ["react", "hooks", "components"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": "quiz_id",
      "title": "React Fundamentals Quiz",
      "questions": [
        {
          "id": "q1",
          "question": "What is JSX?",
          "type": "multiple_choice",
          "options": [
            "JavaScript XML",
            "Java Syntax Extension",
            "JSON XML",
            "JavaScript Extension"
          ],
          "correctAnswer": 0,
          "explanation": "JSX stands for JavaScript XML..."
        }
      ],
      "timeLimit": 30,
      "passingScore": 70
    }
  }
}
```

### POST /api/ai/roadmap/generate
Generate personalized learning roadmap.

**Request Body:**
```json
{
  "currentSkills": ["HTML", "CSS", "JavaScript"],
  "targetRole": "Full Stack Developer",
  "timeframe": "6_months",
  "learningStyle": "project_based"
}
```

### POST /api/ai/tutor/chat
Chat with AI tutor.

**Request Body:**
```json
{
  "message": "I'm confused about React hooks",
  "context": {
    "moduleId": "module_id",
    "currentTopic": "useState hook"
  }
}
```

## 👥 Study Groups

### GET /api/study-groups
Get user's study groups.

**Response:**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": "group_id",
        "name": "React Study Group",
        "description": "Weekly React discussions",
        "members": [
          {
            "id": "user_id",
            "name": "John Doe",
            "role": "admin"
          }
        ],
        "schedule": {
          "day": "Wednesday",
          "time": "19:00",
          "timezone": "UTC"
        },
        "isActive": true
      }
    ]
  }
}
```

### POST /api/study-groups
Create a new study group.

**Request Body:**
```json
{
  "name": "New Study Group",
  "description": "Group description",
  "maxMembers": 20,
  "schedule": {
    "day": "Monday",
    "time": "20:00",
    "timezone": "UTC"
  },
  "tags": ["javascript", "react"]
}
```

### POST /api/study-groups/:id/join
Join a study group.

### POST /api/study-groups/:id/leave
Leave a study group.

## 👫 Friends & Social

### GET /api/friends
Get user's friends list.

**Response:**
```json
{
  "success": true,
  "data": {
    "friends": [
      {
        "id": "friend_id",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatar": "avatar_url",
        "status": "online",
        "lastActive": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

### POST /api/friends/request
Send friend request.

**Request Body:**
```json
{
  "email": "friend@example.com"
}
```

### PUT /api/friends/request/:id/accept
Accept friend request.

### PUT /api/friends/request/:id/reject
Reject friend request.

## 📊 Analytics & Progress

### GET /api/analytics/progress
Get user's learning progress analytics.

**Query Parameters:**
- `period`: Time period (week, month, year)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalPaths": 5,
      "completedPaths": 2,
      "totalHours": 120,
      "currentStreak": 7,
      "averageScore": 85
    },
    "progress": [
      {
        "date": "2024-01-01",
        "hoursStudied": 2.5,
        "modulesCompleted": 1,
        "averageScore": 90
      }
    ],
    "achievements": [
      {
        "id": "achievement_id",
        "title": "First Module Completed",
        "description": "Completed your first learning module",
        "icon": "trophy",
        "unlockedAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### GET /api/analytics/leaderboard
Get leaderboard rankings.

**Query Parameters:**
- `type`: Ranking type (global, friends, study_group)
- `period`: Time period (week, month, all_time)

## 🔔 Notifications

### GET /api/notifications
Get user's notifications.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `unreadOnly`: Filter unread only (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_id",
        "type": "achievement",
        "title": "New Achievement!",
        "message": "You earned 'Quick Learner' badge",
        "isRead": false,
        "createdAt": "2024-01-01T00:00:00Z",
        "actionUrl": "/achievements"
      }
    ],
    "unreadCount": 3
  }
}
```

### PUT /api/notifications/:id/read
Mark notification as read.

### PUT /api/notifications/read-all
Mark all notifications as read.

## 🔍 Search

### GET /api/search
Search across the platform.

**Query Parameters:**
- `q`: Search query (required)
- `type`: Search type (all, paths, modules, users, groups)
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "results": {
      "paths": [
        {
          "id": "path_id",
          "title": "React Development",
          "description": "Learn React...",
          "relevanceScore": 0.95
        }
      ],
      "modules": [],
      "users": [],
      "groups": []
    },
    "totalResults": 15,
    "searchTime": 0.12
  }
}
```

## 🏥 Health & Monitoring

### GET /api/health
Check API health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "email": "healthy"
    }
  }
}
```

### GET /api/health/database
Check database connectivity.

### GET /api/health/redis
Check Redis connectivity.

## 📊 Rate Limiting

API endpoints are rate limited to prevent abuse:

- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **AI-powered endpoints**: 50 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🚨 Error Handling

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid request data
- `AUTHENTICATION_ERROR`: Authentication failed
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## 🔄 WebSocket Events

Real-time features use WebSocket connections:

### Connection
```
ws://localhost:8000?token=<jwt_token>
```

### Events

#### Study Group Messages
```json
{
  "event": "group_message",
  "data": {
    "groupId": "group_id",
    "message": {
      "id": "msg_id",
      "userId": "user_id",
      "content": "Hello everyone!",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Friend Status Updates
```json
{
  "event": "friend_status_update",
  "data": {
    "userId": "friend_id",
    "status": "online",
    "lastActive": "2024-01-01T00:00:00Z"
  }
}
```

#### Learning Progress Updates
```json
{
  "event": "progress_update",
  "data": {
    "userId": "user_id",
    "pathId": "path_id",
    "progress": 75,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## 📋 API Versioning

API versioning is handled through URL paths:

- **Current version**: `v1` (default)
- **Version format**: `/api/v1/endpoint`

Future versions will be available at `/api/v2/endpoint`, etc.

## 🔒 Security

- All requests use HTTPS in production
- JWT tokens expire after 7 days
- Sensitive data is encrypted
- Rate limiting prevents abuse
- Input validation on all endpoints
- SQL injection protection
- XSS protection

## 📞 Support

For API support:
- Check the Swagger documentation at `/api-docs`
- Review error messages for details
- Contact support@adl-lms.com for assistance

## 📝 Changelog

### v1.0.0
- Initial API documentation
- Complete endpoint coverage
- Authentication and authorization
- Real-time WebSocket support
- Comprehensive error handling