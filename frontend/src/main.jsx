import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminHome from './pages/AdminHome.jsx'
import StudentsPage from './pages/StudentsPage.jsx'
import StudentListPage from './pages/StudentListPage.jsx'
import StudentSearchPage from './pages/StudentSearchPage.jsx'
import CoursesPage from './pages/CoursesPage.jsx'
import OperationsHome from './pages/OperationsHome.jsx'
import PaymentPage from './pages/PaymentPage.jsx'
import CertificatePage from './pages/CertificatePage.jsx'
import AssignResourcePersonPage from './pages/AssignResourcePersonPage.jsx'
import RegisterCoursePage from './pages/RegisterCoursePage.jsx'
import CreateResourcePersonPage from './pages/CreateResourcePersonPage.jsx'
import CreateUserPage from './pages/CreateUserPage.jsx'
import AssignCoordinatorPage from './pages/AssignCoordinatorPage.jsx'
import ReceiptJournalPage from './pages/ReceiptJournalPage.jsx'
import PaymentJournalPage from './pages/PaymentJournalPage.jsx'
import ManageVendorsPage from './pages/ManageVendorsPage.jsx'
import GeneralJournalPage from './pages/GeneralJournalPage.jsx'
import JournalEntriesPage from './pages/JournalEntriesPage.jsx'
import ManagePaymentMethodsPage from './pages/ManagePaymentMethodsPage.jsx'
import ResourcePersonDashboard from './pages/ResourcePersonDashboard.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import CoordinatorDashboard from './pages/CoordinatorDashboard.jsx'

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
          path="/admin/students/list"
          element={<ProtectedRoute role="admin"><StudentListPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/students/search"
          element={<ProtectedRoute role="admin"><StudentSearchPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/courses"
          element={<ProtectedRoute role="admin"><CoursesPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations"
          element={<ProtectedRoute role="admin"><OperationsHome /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/payment"
          element={<ProtectedRoute role="admin"><PaymentPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/certificate"
          element={<ProtectedRoute role="admin"><CertificatePage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/assign-resource-person"
          element={<ProtectedRoute role="admin"><AssignResourcePersonPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/register-course"
          element={<ProtectedRoute role="admin"><RegisterCoursePage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/create-resource-person"
          element={<ProtectedRoute role="admin"><CreateResourcePersonPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/create-user"
          element={<ProtectedRoute role="admin"><CreateUserPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/assign-coordinator"
          element={<ProtectedRoute role="admin"><AssignCoordinatorPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/receipt-journal"
          element={<ProtectedRoute role="admin"><ReceiptJournalPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/payment-journal"
          element={<ProtectedRoute role="admin"><PaymentJournalPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/manage-vendors"
          element={<ProtectedRoute role="admin"><ManageVendorsPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/general-journal"
          element={<ProtectedRoute role="admin"><GeneralJournalPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/journal-entries"
          element={<ProtectedRoute role="admin"><JournalEntriesPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/operations/manage-payment-methods"
          element={<ProtectedRoute role="admin"><ManagePaymentMethodsPage /></ProtectedRoute>}
        />
        <Route
          path="/resource-person"
          element={<ProtectedRoute role="resource_person"><ResourcePersonDashboard /></ProtectedRoute>}
        />
        <Route
          path="/student"
          element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>}
        />
        <Route
          path="/coordinator"
          element={<ProtectedRoute role="coordinator"><CoordinatorDashboard /></ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)