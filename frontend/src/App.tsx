import {QueryClientProvider, QueryClient} from '@tanstack/react-query'
import {createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider} from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Register from './pages/auth/Register'
import Login from './pages/auth/Login'
import VerifyEmail from './pages/auth/VerifyEmail'
import ResetPassword from './pages/auth/ResetPassword'
import ProfileSetup from './pages/auth/ProfileSetup'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/dashboard/DashBoard'
import LearningPathDetail from './pages/learningPath/LearningPathDetail'
import StudyGroupsList from './pages/studyGroups/StudyGroupsList'
import StudyGroupDetail from './pages/studyGroups/StudyGroupDetail'
import MyStudyGroups from './pages/studyGroups/MyStudyGroups'

const router = createBrowserRouter(createRoutesFromElements(
  <Route path='/' element={<MainLayout/>}>
      <Route path='/register' element={<Register/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/verify-email' element={<VerifyEmail/>}/>
      <Route path='/reset-password' element={<ResetPassword/>}/>
      <Route path='/profile-setup' element={<ProfileSetup/>}/>
      <Route path='/dashboard' element={<Dashboard/>}/>
      <Route path='/learning-path/:pathId' element={<LearningPathDetail/>}/>
      <Route path='/study-groups' element={<MyStudyGroups/>}/>
      <Route path='/study-groups/learning-paths/:pathId' element={<StudyGroupsList/>}/>
      <Route path='/study-groups/:groupId' element={<StudyGroupDetail/>}/>
      <Route path='*' element={<Navigate to='/login' replace/>}/>
  </Route>
))

const queryclient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
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
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </QueryClientProvider>
  )
}

export default App
