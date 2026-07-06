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

    if (roles && user.role !== 'superadmin' && !roles.includes(user.role)) {
        const defaultPath = user.role === 'fitpass_admin' ? '/superadmin/dashboard' :
            user.role === 'h4_admin' ? '/dashboard' :
            user.role === 'superadmin' ? '/superadmin/dashboard' :
            user.role === 'admin' ? '/dashboard' :
                user.role === 'trainer' ? '/attendance' :
                    user.role === 'member' ? '/member-dashboard' :
                        '/members';
        return <Navigate to={defaultPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
