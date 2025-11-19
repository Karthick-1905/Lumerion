# 🎯 ADL LMS Backend

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.1+-black.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The powerful backend API server for ADL LMS, built with Node.js, TypeScript, and Express. Features AI-powered learning path generation, comprehensive user management, and real-time social features.

## Features

### AI Integration
- **LangChain/LangGraph**: Advanced AI agents for learning path generation
- **Google AI**: Integration with Gemini models for intelligent content creation
- **Tavily**: Web search capabilities for enhanced learning resources
- **Notion MCP**: Rich content integration with Notion workspaces

### Authentication & Security
- **Email Verification**: OTP-based email verification system
- **Password Reset**: Secure password recovery flow
- **Role-based Access**: Flexible user permissions and access control

### Data Management
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Redis Caching**: High-performance caching for frequently accessed data
- **Database Migrations**: Version-controlled schema management
- **Connection Pooling**: Optimized database connection management

### API Features
- **RESTful Design**: Clean, consistent API endpoints
- **Swagger Documentation**: Interactive API documentation
- **Rate Limiting**: Protection against abuse and DoS attacks
- **CORS Support**: Cross-origin resource sharing configuration

###  Learning Features
- **Dynamic Roadmaps**: AI-generated personalized learning paths
- **Skill Assessments**: Comprehensive quiz and evaluation system
- **Progress Tracking**: Detailed learning analytics and statistics
- **Study Groups**: Collaborative learning communities
- **Social Features**: Friend system and activity feeds

##  Architecture

```
backend/
├── src/
│   ├── agents/             # AI agents and workflows
│   │   ├── QuizGeneration/ # Quiz creation agents
│   │   └── roadmapGenerator/# Learning path generation
│   ├── config/            # Application configuration
│   ├── controller/        # API route handlers
│   ├── drizzle/           # Database schema & migrations
│   ├── mailer/            # Email service integrations
│   ├── middleware/        # Authentication & validation
│   ├── routes/            # API route definitions
│   ├── schema/            # Data validation schemas
│   ├── sockets/           # WebSocket handlers
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper utilities
├── tests/                 # Test suites
│   ├── integration/       # Integration tests
│   └── mocks/            # Test mocks and fixtures
├── drizzle.config.ts      # Database configuration
├── jest.config.ts         # Test configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

## Prerequisites

- **Node.js** 18.0 or higher
- **PostgreSQL** 15.0 or higher
- **Redis** 6.0 or higher (optional, for caching)
- **npm** or **yarn** package manager

## Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb adl_lms

   # Run migrations
   npm run db:migrate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8000`

## Configuration

### Environment Variables

Create a `.env` file in the backend root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/adl_lms

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AI Service Configuration
GOOGLE_AI_API_KEY=your-google-ai-api-key
TAVILY_API_KEY=your-tavily-api-key

# Notion Integration (Optional)
NOTION_API_KEY=your-notion-api-key
NOTION_MCP_URL=http://localhost:8787

# Server Configuration
PORT=8000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Database Configuration

The application uses Drizzle ORM with PostgreSQL. Configuration is in `drizzle.config.ts`:

```typescript
export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  out: "./src/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Usage

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database Operations

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Push schema changes to database
npm run db:push

# Pull schema from database
npm run db:pull

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Documentation

### Swagger UI
Access interactive API documentation at: `http://localhost:8000/api-docs`

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request

#### Learning Paths
- `GET /api/user/learning-paths` - Get user's learning paths
- `POST /api/roadmap/generate` - Generate AI-powered roadmap
- `PUT /api/user/learning-paths/:id` - Update learning path

#### Skill Assessments
- `GET /api/user/skill-assessments` - Get available assessments
- `POST /api/user/skill-assessments/:id/submit` - Submit assessment

#### Social Features
- `GET /api/friends` - Get friend list
- `GET /api/user/activity-feed` - Get activity feed
- `GET /api/study-groups` - Get user's study groups

## Testing

The backend includes comprehensive testing with Jest:

### Test Structure
```
tests/
├── integration/           # API integration tests
│   └── health-check.test.ts
└── mocks/                # Test mocks and fixtures
    ├── cuid2.cjs
    └── ioredis.ts
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- health-check.test.ts
```

## 🔧 Development Tools

### Code Quality
- **ESLint**: Code linting and style enforcement
- **TypeScript**: Strict type checking
- **Prettier**: Code formatting

### Database Tools
- **Drizzle Studio**: Visual database management
- **Drizzle Kit**: Migration and schema management

### AI Integration
- **LangChain**: Framework for LLM applications
- **LangGraph**: Orchestration for complex AI workflows
- **Google AI**: Access to Gemini models
- **Tavily**: Web search and research capabilities

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Considerations
- Set `NODE_ENV=production`
- Use production database credentials
- Configure proper SMTP settings
- Set secure JWT secrets
- Enable HTTPS in production

### Docker Support (Future)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8000
CMD ["npm", "start"]
```

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
