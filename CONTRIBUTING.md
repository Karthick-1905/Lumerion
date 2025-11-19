#  Contributing to Lumerion

We welcome contributions from the community! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **PostgreSQL** 15.0 or higher
- **Redis** 6.0 or higher (optional)
- **Git**

### Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Lumerion.git
   cd Lumerion
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your environment variables
   npm run db:migrate
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start Development**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

##  Development Workflow

### Branch Naming Convention

- `feature/description-of-feature` - New features
- `bugfix/description-of-bug` - Bug fixes
- `hotfix/critical-fix` - Critical hotfixes
- `docs/update-documentation` - Documentation updates
- `refactor/code-improvements` - Code refactoring

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

**Examples:**
```
feat(auth): add Google OAuth integration
fix(api): resolve user profile loading issue
docs(readme): update installation instructions
```

## Project Structure

```
Lumerion/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── agents/         # AI agents (LangChain)
│   │   ├── controller/     # API route handlers
│   │   ├── drizzle/        # Database schema/migrations
│   │   ├── middleware/     # Auth/validation middleware
│   │   ├── routes/         # API route definitions
│   │   └── utils/          # Helper utilities
│   └── tests/              # Backend tests
├── frontend/                # React SPA
│   ├── src/
│   │   ├── api/           # API client & hooks
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── hooks/         # Custom React hooks
│   └── public/            # Static assets
├── docs/                   # Documentation
└── README.md              # Project overview
```

##  Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Enable strict type checking
- Use meaningful variable and function names
- Follow ESLint configuration
- Use async/await over Promises
- Prefer const over let, avoid var

### React

- Use functional components with hooks
- Implement proper TypeScript types
- Use React Query for data fetching
- Follow component composition patterns
- Implement proper error boundaries
- Use custom hooks for reusable logic

### Backend

- Use Express.js best practices
- Implement proper middleware chains
- Use Drizzle ORM for database operations
- Implement comprehensive error handling
- Follow RESTful API conventions
- Use proper HTTP status codes

### Database

- Use Drizzle ORM for type safety
- Follow naming conventions
- Implement proper indexes
- Use transactions for multi-step operations
- Validate data integrity

## Testing

### Backend Testing

```bash
cd backend
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

### Frontend Testing

```bash
cd frontend
npm run test              # Run tests (when implemented)
npm run test:coverage     # With coverage
```

### Testing Guidelines

- Write tests for new features
- Maintain test coverage above 80%
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies
- Test API endpoints thoroughly

##  Submitting Changes

### Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding standards
   - Add tests for new features
   - Update documentation if needed
   - Ensure all tests pass

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

### PR Requirements

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No linting errors
- [ ] Related issues linked
- [ ] Changes reviewed by maintainer

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Title**: Clear, descriptive title
- **Description**: Detailed description of the issue
- **Steps to Reproduce**: Step-by-step instructions
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, browser, Node.js version
- **Screenshots**: If applicable
- **Additional Context**: Any other relevant information

### Feature Requests

For feature requests, please include:

- **Title**: Clear, descriptive title
- **Description**: Detailed description of the feature
- **Use Case**: Why this feature would be useful
- **Implementation Ideas**: Any thoughts on implementation
- **Mockups/Screenshots**: If applicable

## Documentation

### Updating Documentation

- Keep README files up to date
- Document new API endpoints
- Update environment variable documentation
- Maintain changelog for releases

### API Documentation

- Use Swagger/OpenAPI for API docs
- Document request/response formats
- Include authentication requirements
- Provide example requests

##  Development Tips

### Performance
- Optimize database queries
- Implement proper caching strategies
- Use lazy loading for components
- Minimize bundle sizes

### Security
- Validate all user inputs
- Use parameterized queries
- Implement proper authentication
- Keep dependencies updated

### Accessibility
- Follow WCAG guidelines
- Test with screen readers
- Ensure keyboard navigation
- Provide alt text for images

##  Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check the docs folder for detailed guides

##  Recognition

Contributors will be recognized in:
- GitHub repository contributors list
- Changelog for significant contributions
- Project documentation

Thank you for contributing to Lumerion! 