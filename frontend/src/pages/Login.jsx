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
            background: 'radial-gradient(circle at top right, var(--primary), var(--accent), #09090b)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Animated background blobs */}
            <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40%', height: '40%', background: 'var(--primary)', filter: 'blur(120px)', opacity: 0.4, borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '40%', height: '40%', background: 'var(--accent)', filter: 'blur(120px)', opacity: 0.4, borderRadius: '50%' }}></div>

            <form onSubmit={handleSubmit} className="fade-in" style={{
                padding: '3rem',
                borderRadius: 'var(--radius-xl)',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                width: '100%',
                maxWidth: '440px',
                zIndex: 10
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px', height: '60px', background: 'white', borderRadius: 'var(--radius-lg)',
                        margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)', transform: 'rotate(-5deg)'
                    }}>
                        <span style={{ fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>G</span>
                    </div>
                    <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'Outfit' }}>GYM CRM PRO</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 500 }}>The ultimate fitness management experience.</p>
                </div>

                {error && (
                    <div className="badge badge-expired" style={{
                        width: '100%', justifyContent: 'center', padding: '0.75rem',
                        marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                <div className="input-group">
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '0.6rem', fontSize: '0.875rem', fontWeight: '600', fontFamily: 'Outfit' }}>Email Address</label>
                    <input
                        type="email"
                        className="input"
                        placeholder="name@gym.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    />
                </div>

                <div className="input-group" style={{ marginBottom: '2.5rem' }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '0.6rem', fontSize: '0.875rem', fontWeight: '600', fontFamily: 'Outfit' }}>Password</label>
                    <input
                        type="password"
                        className="input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
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
                        background: 'white',
                        color: '#09090b',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}
                    disabled={loading}
                >
                    {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                </button>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '2rem' }}>
                    New here? <Link to="/register" style={{ color: 'white', fontWeight: '700', textDecoration: 'none', borderBottom: '2px solid var(--primary)' }}>Empower your gym today</Link>
                </p>
            </form>
        </div>

    );
};

export default Login;
