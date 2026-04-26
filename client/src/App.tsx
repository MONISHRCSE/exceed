import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TeacherLayout from './layouts/TeacherLayout'
import StudentLayout from './layouts/StudentLayout'

// Teacher pages
import TeacherDashboard from './pages/teacher/Dashboard'
import RecordLecture from './pages/teacher/RecordLecture'
import ManageNotes from './pages/teacher/ManageNotes'
import EditNotes from './pages/teacher/EditNotes'
import TeacherDoubts from './pages/teacher/Doubts'
import TeacherAnalytics from './pages/teacher/Analytics'
import StudentMonitor from './pages/teacher/StudentMonitor'

import Settings from './pages/teacher/Settings'
import TeacherClasses from './pages/teacher/Classes'

// Student pages
import StudentDashboard from './pages/student/Dashboard'
import NotesListPage from './pages/student/NotesList'
import NotesViewPage from './pages/student/NotesView'
import PracticePage from './pages/student/Practice'
import QuizPlayPage from './pages/student/QuizPlay'
import FlashcardsPage from './pages/student/Flashcards'
import StudyPlanPage from './pages/student/StudyPlan'
import StudentDoubts from './pages/student/Doubts'
import TutorSessionPage from './pages/student/Tutor'
import MyClassesPage from './pages/student/MyClasses'
import QueryToTutor from './pages/student/QueryToTutor'
import TutorQueries from './pages/teacher/TutorQueries'
import LeaderboardPage from './pages/student/Leaderboard'
import StoryMode from './pages/student/StoryMode'
import JourneyPlayer from './pages/student/JourneyPlayer'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'teacher' | 'student' }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0F1F' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return <>{children}</>
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0F1F' }}>
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} replace /> : <RegisterPage />} />

      {/* Teacher routes */}
      <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="record" element={<RecordLecture />} />
        <Route path="notes" element={<ManageNotes />} />
        <Route path="notes/:id" element={<EditNotes />} />
        <Route path="doubts" element={<TeacherDoubts />} />
        <Route path="analytics" element={<TeacherAnalytics />} />
        <Route path="students" element={<StudentMonitor />} />

        <Route path="settings" element={<Settings />} />
        <Route path="classes" element={<TeacherClasses />} />
        <Route path="queries" element={<TutorQueries />} />
      </Route>

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="notes" element={<NotesListPage />} />
        <Route path="notes/:id" element={<NotesViewPage />} />
        <Route path="quiz" element={<PracticePage />} />
        <Route path="quiz/:id" element={<QuizPlayPage />} />
        <Route path="flashcards/:notesId" element={<FlashcardsPage />} />
        <Route path="plan" element={<StudyPlanPage />} />
        <Route path="doubts" element={<StudentDoubts />} />
        <Route path="tutor" element={<TutorSessionPage />} />
        <Route path="classes" element={<MyClassesPage />} />
        <Route path="queries" element={<QueryToTutor />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="story" element={<StoryMode />} />
        <Route path="story/:journeyId" element={<JourneyPlayer />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
