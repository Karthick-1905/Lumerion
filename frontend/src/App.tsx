import {QueryClientProvider, QueryClient} from '@tanstack/react-query'
import {createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider} from 'react-router-dom'
import Register from './pages/auth/Register'
import Login from './pages/auth/Login'
import VerifyEmail from './pages/auth/VerifyEmail'
import ResetPassword from './pages/auth/ResetPassword'
import ProfileSetup from './pages/auth/ProfileSetup'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/dashboard/DashBoard'
import LearningPathDetail from './pages/learningPath/LearningPathDetail'
import CreateLearningPath from './pages/learningPath/CreateLearningPath'
import StudyGroupsList from './pages/studyGroups/StudyGroupsList'
import StudyGroupDetail from './pages/studyGroups/StudyGroupDetail'
import MyStudyGroups from './pages/studyGroups/MyStudyGroups'
import Profile from './pages/profile/Profile'
import FriendsPage from './pages/friends/Friends'
import Notifications from './pages/notifications/Notifications'
import SkillAssessments from './pages/skillAssessment/SkillAssessments'
import SkillAssessment from './pages/skillAssessment/SkillAssessment'
import ActivityFeed from './pages/activityFeed/ActivityFeed'
import ToastContainer from './components/ui/ToastContainer'
import NotePage from './pages/notes/NotePage'
import LandingPage from './pages/landingPage/LandingPage'

const router = createBrowserRouter(createRoutesFromElements(
  <Route path='/' element={<MainLayout/>}>
      <Route index element={<LandingPage/>}/>
      <Route path='/register' element={<Register/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/verify-email' element={<VerifyEmail/>}/>
      <Route path='/reset-password' element={<ResetPassword/>}/>
      <Route path='/profile-setup' element={<ProfileSetup/>}/>
      <Route path='/dashboard' element={<Dashboard/>}/>
      <Route path='/notes' element={<NotePage/>}/>
      <Route path="/learning-path/create" element={<CreateLearningPath />} />
      <Route path="/learning-path/:pathId" element={<LearningPathDetail />} />

      <Route path="/study-groups" element={<MyStudyGroups />} />
      <Route path="/study-groups/learning-paths/:pathId" element={<StudyGroupsList />} />
      <Route path="/study-groups/:groupId" element={<StudyGroupDetail />} />
      
      <Route path='/friends' element={<FriendsPage/>}/>
      <Route path='/profile' element={<Profile/>}/>
      <Route path='/notifications' element={<Notifications/>}/>
      <Route path='/skill-assessments' element={<SkillAssessments/>}/>
      <Route path='/skill-assessments/:assessmentId' element={<SkillAssessment/>}/>
      <Route path='/activity-feed' element={<ActivityFeed/>}/>
      <Route path='*' element={<Navigate to='/login' replace/>}/>
  </Route>
))

const queryclient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});
function App() {
  return (
    <QueryClientProvider client={queryclient}>
      <RouterProvider  router={router}/>
      <ToastContainer />
    </QueryClientProvider>
  )
}

export default App
