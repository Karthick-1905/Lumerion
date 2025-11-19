# 🎓 Lumerion - Digital Learning Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)

A comprehensive, AI-powered Learning Management System (LMS) designed to provide digital education through personalized learning paths, collaborative study groups, and intelligent progress tracking.

##  Features

###  AI-Powered Learning
- **Intelligent Roadmap Generation**: AI-driven learning path creation using LangChain and LangGraph
- **Personalized Learning Paths**: Custom-tailored educational journeys based on user goals and skill levels
- **Smart Module Dependencies**: Automatic prerequisite analysis and learning sequence optimization

###  Social Learning
- **Study Groups**: Collaborative learning communities with shared goals and progress tracking
- **Friend System**: Connect with fellow learners and track their achievements
- **Activity Feed**: Real-time updates on friends' and study group members' learning activities

###  Progress Tracking
- **Comprehensive Analytics**: Detailed learning statistics and progress visualization
- **Skill Assessments**: Interactive quizzes and competency evaluations
- **Achievement System**: Gamified learning with badges and milestones
- **Learning Streaks**: Daily learning habit tracking and streak maintenance

###  Advanced Features
- **Multi-format Content**: Support for various learning materials and resources
- **Real-time Notifications**: Instant updates on important learning events
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Dark Theme**: Modern, eye-friendly interface design

##  Architecture

```
Lumerion/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── agents/         # AI agents (LangChain/LangGraph)
│   │   ├── controller/     # API route handlers
│   │   ├── drizzle/        # Database schema & migrations
│   │   ├── middleware/     # Authentication & validation
│   │   ├── routes/         # API route definitions
│   │   ├── schema/         # Data validation schemas
│   │   └── utils/          # Helper utilities
│   └── tests/              # Backend test suite
├── frontend/                # React SPA
│   ├── src/
│   │   ├── api/           # API client & hooks
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── layouts/       # Page layouts
│   │   ├── pages/         # Application pages
│   │   └── utils/         # Frontend utilities
│   └── public/            # Static assets
├── docs/                   # Documentation
└── tests/                  # Integration tests
```

##  Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 15+
- **Redis** (optional, for caching)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Karthick-1905/Lumerion.git
   cd Lumerion
   ```

2. **Backend Setup**
   ```bash
   cd backend

   # Install dependencies
   npm install

   # Set up environment variables
   cp .env.example .env
   # Edit .env with your database credentials and API keys

   # Run database migrations
   npm run db:migrate

   # Start development server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend

   # Install dependencies
   npm install

   # Start development server
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api-docs

5. **Optional: Add Mock Data**
   ```bash
   cd backend
   npm run db:seed
   ```
   This populates your database with sample achievements, skills, and activity data for testing.

##  Environment Configuration

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/Lumerion

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AI Services (optional)
GOOGLE_AI_API_KEY=your-google-ai-key
TAVILY_API_KEY=your-tavily-key

# Notion Integration (optional)
NOTION_API_KEY=your-notion-api-key
NOTION_MCP_URL=http://localhost:8787
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
```

##  Development

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run test suite
npm run db:studio    # Open Drizzle Studio for database management
npm run db:migrate   # Run database migrations
```

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:watch
npm run test:coverage

# Integration tests (if available)
cd ..
npm run test:integration
```

### Database Management

```bash
# Generate migration
cd backend
npx drizzle-kit generate

# Push schema changes
npm run db:push

# View database in browser
npm run db:studio
```

##  Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[API Documentation](docs/api.md)** - Complete API reference with examples
- **[Deployment Guide](docs/deployment.md)** - Production deployment instructions
- **[Troubleshooting Guide](docs/troubleshooting.md)** - Common issues and solutions
- **[Architecture Overview](docs/knowledge-graph-agent-plan.md)** - System architecture and design
- **[Roadmap](docs/roadmap.md)** - Product roadmap and feature planning
- **[Notion Integration](docs/notion-mcp-integration.md)** - External integrations guide

## API Documentation

The backend provides comprehensive API documentation via Swagger UI:

- **URL**: http://localhost:8000/api-docs
- **Authentication**: JWT Bearer token required for protected endpoints
- **Format**: OpenAPI 3.0 specification

### Key Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/user/learning-paths` - Get user's learning paths
- `POST /api/roadmap/generate` - Generate AI-powered learning roadmap
- `GET /api/user/skill-assessments` - Get available skill assessments
- `GET /api/user/activity-feed` - Get social activity feed

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality assurance

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- **LangChain & LangGraph**: For powering our AI-driven learning features
- **Drizzle ORM**: For type-safe database operations
- **React Query**: For efficient data fetching and caching
- **Tailwind CSS**: For beautiful, responsive UI components
- **Express.js**: For robust API development

