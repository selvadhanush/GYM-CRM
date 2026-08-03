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
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import PartnerGyms from './pages/superadmin/PartnerGyms';
import FitPrimePlans from './pages/superadmin/FitPrimePlans';
import FitPassMembers from './pages/superadmin/FitPassMembers';
import AdminManagement from './pages/superadmin/AdminManagement';
import BodyAssessments from './pages/BodyAssessments';
import TrainerAttendancePage from './pages/TrainerAttendancePage';
import PayrollPage from './pages/PayrollPage';
import FitPassAnalyticsPage from './pages/FitPassAnalyticsPage';
import WorkoutPlans from './pages/WorkoutPlans';
import DietPlans from './pages/DietPlans';
import Settings from './pages/Settings';
import FitPassVisitLog from './pages/FitPassVisitLog';
import FitPassPartnerLeads from './pages/FitPassPartnerLeads';
import GymProfileDiscovery from './pages/GymProfileDiscovery';
import DiscoveryApprovalQueue from './pages/superadmin/DiscoveryApprovalQueue';
import FitPassGymExplore from './pages/FitPassGymExplore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/ui/Toast';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <ToastProvider>
      <Router>
        <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              {(() => {
                const normalizedGym = (user?.gymName || user?.gymId?.name || '').toUpperCase();
                const userGymId = user?.gymId?._id || user?.gymId || '';
                const isH4Gym = normalizedGym === 'H4' || userGymId === '05a08fdf-7427-48a5-8b25-e18d5a5668cd';
                const isPartnerAdmin = user?.role === 'partner' || (user?.role === 'admin' && !isH4Gym);

                const targetPath = (user?.role === 'superadmin' || user?.role === 'fitpass_admin') ? "/superadmin/dashboard" :
                  isPartnerAdmin ? "/partner/visit-log" :
                  (user?.role === 'admin' || user?.role === 'h4_admin') ? "/dashboard" :
                    user?.role === 'trainer' ? "/attendance" :
                      user?.role === 'member' ? "/member-dashboard" :
                        "/members";
                return <Navigate to={targetPath} replace />;
              })()}
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/superadmin/dashboard" element={
          <ProtectedRoute roles={['superadmin', 'fitpass_admin']}>
            <Layout>
              <SuperAdminDashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/superadmin/gyms" element={
          <ProtectedRoute roles={['superadmin', 'fitpass_admin']}>
            <Layout>
              <PartnerGyms />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/superadmin/plans" element={
          <ProtectedRoute roles={['superadmin', 'fitpass_admin']}>
            <Layout>
              <FitPrimePlans />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/superadmin/fitpass-members" element={
          <ProtectedRoute roles={['superadmin', 'fitpass_admin']}>
            <Layout>
              <FitPassMembers />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/superadmin/admins" element={
          <ProtectedRoute roles={['superadmin']}>
            <Layout>
              <AdminManagement />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/superadmin/fitpass-analytics" element={
          <ProtectedRoute roles={['superadmin', 'fitpass_admin']}>
            <Layout>
              <FitPassAnalyticsPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute roles={['admin', 'h4_admin']}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />



        <Route path="/plans" element={
          <ProtectedRoute roles={['admin', 'h4_admin']}>
            <Layout>
              <Plans />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/members" element={
          <ProtectedRoute roles={['admin', 'receptionist', 'superadmin', 'fitpass_admin', 'h4_admin']}>
            <Layout>
              <Members />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/payments" element={
          <ProtectedRoute roles={['admin', 'receptionist', 'h4_admin']}>
            <Layout>
              <Payments />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/attendance" element={
          <ProtectedRoute roles={['admin', 'trainer', 'h4_admin']}>
            <Layout>
              <Attendance />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/expenses" element={
          <ProtectedRoute roles={['admin', 'h4_admin']}>
            <Layout>
              <Expenses />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/dues" element={
          <ProtectedRoute roles={['admin', 'receptionist', 'h4_admin']}>
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
          <ProtectedRoute roles={['admin', 'h4_admin']}>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/freeze" element={
          <ProtectedRoute roles={['admin', 'receptionist', 'h4_admin']}>
            <Layout>
              <FreezeManagement />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/classes" element={
          <ProtectedRoute roles={['admin', 'trainer', 'h4_admin']}>
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
          <ProtectedRoute roles={['admin', 'receptionist', 'h4_admin']}>
            <Layout>
              <Leads />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute roles={['admin', 'h4_admin']}>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/fitpass-analytics" element={
          <ProtectedRoute roles={['admin', 'h4_admin']}>
            <Layout>
              <FitPassAnalyticsPage />
            </Layout>
          </ProtectedRoute>
        } />

        {/* ─── FitPass Partner portal (read-only, gym-scoped) ─── */}
        <Route path="/partner/visit-log" element={
          <ProtectedRoute roles={['partner', 'admin']}>
            <Layout>
              <FitPassVisitLog />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/partner/fitpass-leads" element={
          <ProtectedRoute roles={['partner', 'admin']}>
            <Layout>
              <FitPassPartnerLeads />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/audit" element={
          <ProtectedRoute roles={['superadmin', 'fitpass_admin', 'h4_admin']}>
            <Layout>
              <AuditLogs />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/branches" element={
          <ProtectedRoute roles={['admin', 'h4_admin']}>
            <Layout>
              <Branches />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/staff" element={
          <ProtectedRoute roles={['admin', 'h4_admin']}>
            <Layout>
              <Staff />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/body-assessments" element={
          <ProtectedRoute roles={['admin', 'trainer', 'member', 'h4_admin']}>
            <Layout>
              <BodyAssessments />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/trainer-attendance" element={
          <ProtectedRoute roles={['admin', 'trainer', 'h4_admin']}>
            <Layout>
              <TrainerAttendancePage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/payroll" element={
          <ProtectedRoute roles={['admin', 'trainer', 'h4_admin']}>
            <Layout>
              <PayrollPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/workout-plans" element={
          <ProtectedRoute roles={['admin', 'trainer', 'member', 'h4_admin']}>
            <Layout>
              <WorkoutPlans />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/diet-plans" element={
          <ProtectedRoute roles={['admin', 'trainer', 'member', 'h4_admin']}>
            <Layout>
              <DietPlans />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/gym-social-profile" element={
          <ProtectedRoute roles={['admin', 'partner', 'h4_admin']}>
            <Layout>
              <GymProfileDiscovery />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/explore-gyms" element={
          <ProtectedRoute roles={['member', 'admin', 'partner', 'superadmin', 'h4_admin', 'fitpass_admin']}>
            <Layout>
              <FitPassGymExplore />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/superadmin/discovery-approvals" element={
          <ProtectedRoute roles={['superadmin', 'fitpass_admin', 'h4_admin']}>
            <Layout>
              <DiscoveryApprovalQueue />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute roles={['admin', 'h4_admin', 'superadmin', 'partner']}>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  </ToastProvider>
  );
}

export default App;
