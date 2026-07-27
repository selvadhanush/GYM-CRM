import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="spinner"></div>
        </div>
    );

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const normalizedGym = (user.gymName || user.gymId?.name || '').toUpperCase();
    const userGymId = user.gymId?._id || user.gymId || '';
    const isH4Gym = normalizedGym === 'H4' || userGymId === '05a08fdf-7427-48a5-8b25-e18d5a5668cd';
    const isPartnerAdmin = user.role === 'partner' || (user.role === 'admin' && !isH4Gym);

    if (isPartnerAdmin && !['/partner/visit-log', '/partner/fitpass-leads', '/support'].includes(window.location.pathname)) {
        return <Navigate to="/partner/visit-log" replace />;
    }

    if (roles && user.role !== 'superadmin' && !roles.includes(user.role) && !isPartnerAdmin) {
        const defaultPath = user.role === 'fitpass_admin' ? '/superadmin/dashboard' :
            user.role === 'h4_admin' ? '/dashboard' :
            user.role === 'superadmin' ? '/superadmin/dashboard' :
            user.role === 'admin' ? '/dashboard' :
                user.role === 'trainer' ? '/attendance' :
                    user.role === 'member' ? '/member-dashboard' :
                        isPartnerAdmin ? '/partner/visit-log' :
                            '/members';
        return <Navigate to={defaultPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
