# 🎨 ADL LMS Frontend

[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1+-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1+-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, responsive React SPA for ADL LMS featuring beautiful UI components, real-time data fetching, and an exceptional user experience built with cutting-edge web technologies.

## Features

### User Experience
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Dark Theme**: Modern, eye-friendly interface with carefully crafted color schemes
- **Intuitive Navigation**: Clean sidebar navigation with collapsible design
- **Loading States**: Smooth loading animations and skeleton screens

### Data Management
- **React Query**: Efficient data fetching, caching, and synchronization
- **Real-time Updates**: Live data updates for activity feeds and notifications
- **Optimistic Updates**: Instant UI feedback for user actions
- **Error Handling**: Graceful error states with retry mechanisms

### Interactive Components
- **Charts & Analytics**: Beautiful data visualizations using Recharts
- **Progress Tracking**: Visual progress bars and completion indicators
- **Interactive Forms**: Real-time validation and user feedback
- **Rich Text Notes**: TipTap editor with autosave and media uploads
- **Toast Notifications**: Non-intrusive success and error messages

###  Performance
- **Vite Build Tool**: Lightning-fast development and optimized production builds
- **Code Splitting**: Automatic route-based code splitting for smaller bundles
- **Lazy Loading**: Components loaded on demand for better performance
- **Modern React**: Latest React 19 features with concurrent rendering

## Architecture

```
frontend/
├── public/                 # Static assets
│   ├── vite.svg           # Vite logo
│   └── favicon.ico        # Site favicon
├── src/
│   ├── api/              # API integration layer
│   │   ├── client.ts     # HTTP client configuration
│   │   ├── config.ts     # API endpoints and configuration
│   │   ├── types.ts      # TypeScript type definitions
│   │   ├── user.ts       # User-related API functions
│   │   ├── auth.ts       # Authentication API functions
│   │   └── index.ts      # API exports
│   ├── components/       # Reusable UI components
│   │   ├── Sidebar.tsx   # Main navigation sidebar
│   │   └── ui/          # Base UI components
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts   # Authentication hooks
│   │   ├── useUserProfile.ts # User profile hooks
│   │   └── useActivityFeed.ts # Activity feed hooks
│   ├── layouts/         # Page layout components
│   │   └── MainLayout.tsx # Main application layout
│   ├── pages/           # Page components
│   │   ├── auth/        # Authentication pages
│   │   ├── dashboard/   # Dashboard and overview
│   │   ├── learningPath/ # Learning path management
│   │   ├── skillAssessment/ # Skill assessment pages
│   │   ├── studyGroups/ # Study group features
│   │   ├── friends/     # Social features
│   │   └── profile/     # User profile management
│   ├── utils/           # Utility functions
│   │   ├── validation.ts # Form validation utilities
│   │   └── index.ts     # Utility exports
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   ├── index.css        # Global styles
│   └── vite-env.d.ts    # Vite type definitions
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tsconfig.app.json    # Application TypeScript config
├── tsconfig.node.json   # Node.js TypeScript config
├── vite.config.ts       # Vite configuration
└── tailwind.config.js   # Tailwind CSS configuration
```

## Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Backend API** running on `http://localhost:8000`

## Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your API configuration
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Configuration

### Environment Variables

Create a `.env` file in the frontend root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Optional: Additional configuration
VITE_APP_NAME=ADL LMS
VITE_APP_VERSION=1.0.0
```

### Vite Configuration

The application uses Vite for fast development and optimized builds. Configuration is in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

## Usage

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally

##  UI Components

### Design System
- **Color Palette**: Custom gradient themes with `#7FDBCA` and `#00CC99` accents
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent spacing scale using Tailwind CSS
- **Components**: Reusable component library with consistent styling

### Key Components

#### Sidebar Navigation
- Collapsible design for better space utilization
- Active state indicators with gradient backgrounds
- Smooth animations and transitions

#### Activity Feed
- Real-time activity updates
- User avatars and activity type icons
- Time-based formatting ("2h ago", "Just now")

#### Dashboard
- Learning path cards with progress indicators
- Statistics and analytics widgets
- Quick action buttons and shortcuts

##  Development Tools

### TypeScript
- Strict type checking enabled
- Comprehensive type definitions for API responses
- IntelliSense support for better development experience

### Tailwind CSS
- Utility-first CSS framework
- Custom design tokens and color schemes
- Responsive design utilities
- Dark mode support

### React Query
- Efficient data fetching and caching
- Background refetching and synchronization
- Optimistic updates for better UX
- Error handling and retry logic

### React Router
- Client-side routing with nested routes
- Protected routes with authentication checks
- Lazy loading for better performance

##  Testing

### Testing Setup (Future)
```bash
# Run tests (when implemented)
npm run test

# Run tests with coverage
npm run test:coverage
```

### Manual Testing
- **Authentication Flow**: Register → Verify Email → Login
- **Learning Paths**: Create → View → Update Progress
- **Skill Assessments**: Take Assessment → View Results
- **Social Features**: Add Friends → Join Study Groups → View Activity Feed

## Deployment

### Production Build
```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Deployment Options

#### Static Hosting
Deploy the `dist/` folder to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

#### Docker (Future)
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables for Production
```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_APP_NAME=ADL LMS
VITE_APP_VERSION=1.0.0
```

## 🔍 API Integration

### API Client Architecture
- Centralized HTTP client with error handling
- Automatic token management for authenticated requests
- Response interceptors for global error handling
- Request/response type safety with TypeScript

### Key API Hooks

#### Authentication
```typescript
const { mutate: login, isPending } = useLoginMutation();
const { mutate: register, isPending } = useRegisterMutation();
```

#### Data Fetching
```typescript
const { data: profile, isLoading } = useUserProfile();
const { data: activityFeed } = useActivityFeed();
```

#### Learning Features
```typescript
const { data: learningPaths } = useLearningPaths();
const { data: assessments } = useSkillAssessments();
```

#### Notes
```typescript
const { data: note } = useQuery({
  queryKey: ['note', noteId],
  queryFn: () => notesApi.getNote(noteId),
});

const save = useDebouncedCallback((payload) => notesApi.updateNote(noteId, payload));
```

##  Contributing

1. Follow the existing code style and architecture
2. Use TypeScript for all new code
3. Implement proper error handling
4. Add loading states for async operations
5. Test components across different screen sizes
6. Follow the established component patterns

### Code Style
- Use functional components with hooks
- Implement proper TypeScript types
- Follow React best practices
- Use Tailwind CSS for styling
- Maintain consistent naming conventions

## 📱 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Karthick-1905/adl_lms/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Karthick-1905/adl_lms/discussions)

---

**Part of the ADL LMS ecosystem** - [Main Repository](https://github.com/Karthick-1905/adl_lms)