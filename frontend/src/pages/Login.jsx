import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (result.success) {
            const role = result.user.role;
            if (role === 'superadmin' || role === 'fitpass_admin') {
                navigate('/superadmin/dashboard');
            } else if (role === 'member') {
                navigate('/member-dashboard');
            } else if (role === 'trainer') {
                navigate('/attendance');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError(result.message);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'var(--bg-secondary)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <form onSubmit={handleSubmit} className="fade-in" style={{
                padding: '3rem',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                width: '100%',
                maxWidth: '440px',
                zIndex: 10
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px', height: '60px', background: 'var(--primary)', borderRadius: 'var(--radius-lg)',
                        margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)', transform: 'rotate(-5deg)', border: '1px solid var(--border)'
                    }}>
                        <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-inverse)' }}>G</span>
                    </div>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'Outfit' }}>GYM CRM PRO</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>The ultimate fitness management experience.</p>
                </div>

                {error && (
                    <div className="badge badge-expired" style={{
                        width: '100%', justifyContent: 'center', padding: '0.75rem',
                        marginBottom: '1.5rem', background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.15)'
                    }}>
                        {error}
                    </div>
                )}

                <div className="input-group">
                    <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.6rem', fontSize: '0.875rem', fontWeight: '600', fontFamily: 'Outfit' }}>Email Address</label>
                    <input
                        type="email"
                        className="input"
                        placeholder="name@gym.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group" style={{ marginBottom: '2.5rem' }}>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.6rem', fontSize: '0.875rem', fontWeight: '600', fontFamily: 'Outfit' }}>Password</label>
                    <input
                        type="password"
                        className="input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1rem',
                        fontWeight: 700,
                    }}
                    disabled={loading}
                >
                    {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                </button>

                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2rem' }}>
                    New here? <Link to="/register" style={{ color: 'var(--text-primary)', fontWeight: '700', textDecoration: 'none', borderBottom: '2px solid var(--primary)' }}>Empower your gym today</Link>
                </p>
            </form>
        </div>
    );
};

export default Login;
