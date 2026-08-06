import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminHome from './pages/AdminHome.jsx'
import StudentsPage from './pages/StudentsPage.jsx'
import CoursesPage from './pages/CoursesPage.jsx'
import OperationsPage from './pages/OperationsPage.jsx'
import ResourcePersonDashboard from './pages/ResourcePersonDashboard.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<App />} />
        <Route
          path="/admin"
          element={<ProtectedRoute role="admin"><AdminHome /></ProtectedRoute>}
        />
        <Route
          path="/admin/students"
          element={<ProtectedRoute role="admin"><StudentsPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/courses"
          element={<ProtectedRoute role="admin"><CoursesPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations"
          element={<ProtectedRoute role="admin"><OperationsPage /></ProtectedRoute>}
        />
        <Route
          path="/resource-person"
          element={<ProtectedRoute role="resource_person"><ResourcePersonDashboard /></ProtectedRoute>}
        />
        <Route
          path="/student"
          element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)