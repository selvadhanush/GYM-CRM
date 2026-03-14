import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [gymName, setGymName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await register(name, email, password, gymName);
        setLoading(false);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'radial-gradient(circle at bottom left, var(--primary), var(--accent), #09090b)',
            overflow: 'hidden',
            position: 'relative',
            padding: '2rem'
        }}>
            {/* Animated background blobs */}
            <div style={{ position: 'absolute', top: '-15%', left: '-5%', width: '50%', height: '50%', background: 'var(--primary)', filter: 'blur(140px)', opacity: 0.3, borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '50%', height: '50%', background: 'var(--accent)', filter: 'blur(140px)', opacity: 0.3, borderRadius: '50%' }}></div>

            <form onSubmit={handleSubmit} className="fade-in" style={{
                padding: '3rem',
                borderRadius: 'var(--radius-xl)',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                width: '100%',
                maxWidth: '480px',
                zIndex: 10
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px', height: '60px', background: 'white', borderRadius: 'var(--radius-lg)',
                        margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)', transform: 'rotate(5deg)'
                    }}>
                        <span style={{ fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>G</span>
                    </div>
                    <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'Outfit' }}>Join GYM CRM PRO</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 500 }}>Empower your fitness business today.</p>
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
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '0.6rem', fontSize: '0.875rem', fontWeight: '600', fontFamily: 'Outfit' }}>Owner Name</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    />
                </div>

                <div className="input-group">
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '0.6rem', fontSize: '0.875rem', fontWeight: '600', fontFamily: 'Outfit' }}>Gym Name</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Titan Fitness"
                        value={gymName}
                        onChange={(e) => setGymName(e.target.value)}
                        required
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    />
                </div>

                <div className="input-group">
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '0.6rem', fontSize: '0.875rem', fontWeight: '600', fontFamily: 'Outfit' }}>Email Address</label>
                    <input
                        type="email"
                        className="input"
                        placeholder="owner@gym.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    />
                </div>

                <div className="input-group" style={{ marginBottom: '2.5rem' }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '0.6rem', fontSize: '0.875rem', fontWeight: '600', fontFamily: 'Outfit' }}>Create Password</label>
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
                    {loading ? 'Setting up...' : 'Create Gym Account'}
                </button>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '2rem' }}>
                    Member already? <Link to="/login" style={{ color: 'white', fontWeight: '700', textDecoration: 'none', borderBottom: '2px solid var(--accent)' }}>Sign In to Portal</Link>
                </p>
            </form>
        </div>

    );
};

export default Register;
