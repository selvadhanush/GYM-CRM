import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { isH4Gym } from '../utils/gymConstants';

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

    const userGymId = user.gymId?._id || user.gymId || '';
    const isUserH4Gym = isH4Gym(user.gymName || user.gymId?.name, userGymId);
    const isPartnerAdmin = user.role === 'partner' || (user.role === 'admin' && !isUserH4Gym);

    const partnerAllowedPaths = [
        '/partner/visit-log',
        '/partner/fitpass-leads',
        '/gym-social-profile',
        '/explore-gyms',
        '/settings'
    ];

    if (isPartnerAdmin && !partnerAllowedPaths.includes(window.location.pathname)) {
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
