import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Plans from './pages/Plans';
import Members from './pages/Members';
import Payments from './pages/Payments';
import Attendance from './pages/Attendance';
import Expenses from './pages/Expenses';
import Dues from './pages/Dues';
import MemberDashboard from './pages/MemberDashboard';
import Reports from './pages/Reports';
import FreezeManagement from './pages/FreezeManagement';
import Classes from './pages/Classes';
import MemberClasses from './pages/MemberClasses';
import Leads from './pages/Leads';
import Analytics from './pages/Analytics';
import AuditLogs from './pages/AuditLogs';
import Branches from './pages/Branches';
import Staff from './pages/Staff';
import BodyAssessments from './pages/BodyAssessments';
import TrainerAttendancePage from './pages/TrainerAttendancePage';
import PayrollPage from './pages/PayrollPage';
import Equipments from './pages/Equipments';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Navigate to={
                user?.role === 'admin' ? "/dashboard" :
                  user?.role === 'trainer' ? "/attendance" :
                    user?.role === 'member' ? "/member-dashboard" :
                      "/members"
              } replace />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/plans" element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <Plans />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/members" element={
          <ProtectedRoute roles={['admin', 'receptionist']}>
            <Layout>
              <Members />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/payments" element={
          <ProtectedRoute roles={['admin', 'receptionist']}>
            <Layout>
              <Payments />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/attendance" element={
          <ProtectedRoute roles={['admin', 'trainer']}>
            <Layout>
              <Attendance />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/expenses" element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <Expenses />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/dues" element={
          <ProtectedRoute roles={['admin', 'receptionist']}>
            <Layout>
              <Dues />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/member-dashboard" element={
          <ProtectedRoute roles={['member']}>
            <Layout>
              <MemberDashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/freeze" element={
          <ProtectedRoute roles={['admin', 'receptionist']}>
            <Layout>
              <FreezeManagement />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/classes" element={
          <ProtectedRoute roles={['admin', 'trainer']}>
            <Layout>
              <Classes />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/member-classes" element={
          <ProtectedRoute roles={['member']}>
            <Layout>
              <MemberClasses />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/leads" element={
          <ProtectedRoute roles={['admin', 'receptionist']}>
            <Layout>
              <Leads />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/audit" element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <AuditLogs />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/branches" element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <Branches />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/staff" element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <Staff />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/body-assessments" element={
          <ProtectedRoute roles={['admin', 'trainer', 'member']}>
            <Layout>
              <BodyAssessments />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/trainer-attendance" element={
          <ProtectedRoute roles={['admin', 'trainer']}>
            <Layout>
              <TrainerAttendancePage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/payroll" element={
          <ProtectedRoute roles={['admin', 'trainer']}>
            <Layout>
              <PayrollPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/equipments" element={
          <ProtectedRoute roles={['admin', 'receptionist', 'trainer']}>
            <Layout>
              <Equipments />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
