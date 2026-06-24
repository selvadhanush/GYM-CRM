import { useState, useEffect, useContext } from 'react';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

function FitPrimePlans() {
    const { user } = useContext(AuthContext);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state -- FitPrime plans grant a number of SESSIONS (not a duration).
    const [name, setName] = useState('');
    const [sessions, setSessions] = useState('');
    const [price, setPrice] = useState('');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data } = await API.get('/superadmin/plans');
            setPlans(data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch plans');
            setLoading(false);
        }
    };

    const handleCreatePlan = async (e) => {
        e.preventDefault();
        if (Number(sessions) <= 0) {
            alert('Sessions must be a positive whole number');
            return;
        }
        try {
            await API.post('/superadmin/plans', { name, sessions: Number(sessions), price: Number(price) });
            setName(''); setSessions(''); setPrice('');
            fetchPlans();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create plan');
        }
    };

    const handleDeletePlan = async (id) => {
        if (!window.confirm('Delete this FitPrime plan? Existing members keep their current session balance.')) return;
        try {
            await API.delete(`/superadmin/plans/${id}`);
            fetchPlans();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete plan');
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="plans-container">
            <header className="page-header">
                <h2>FitPrime (Global) Plans</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Session-based plans. Each plan grants a fixed number of gym check-ins.</p>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="form-card">
                <h3>Create FitPrime Plan</h3>
                <form onSubmit={handleCreatePlan} className="plan-form">
                    <div className="form-group">
                        <label>Plan Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. 10 Session Pack" />
                    </div>
                    <div className="form-group">
                        <label>Sessions (number of check-ins)</label>
                        <input type="number" min="1" step="1" value={sessions} onChange={(e) => setSessions(e.target.value)} required placeholder="e.g. 10" />
                    </div>
                    <div className="form-group">
                        <label>Price (Rs)</label>
                        <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="e.g. 999" />
                    </div>
                    <button type="submit" className="btn btn-primary">Create Plan</button>
                </form>
            </div>

            <div className="plans-grid" style={{ marginTop: '30px' }}>
                {plans.map(plan => (
                    <div key={plan._id} className="plan-card">
                        <div className="plan-header">
                            <h3>{plan.name}</h3>
                            <div className="plan-price">₹{plan.price}</div>
                        </div>
                        <div className="plan-details">
                            <p>🎟️ {plan.sessions ?? plan.duration} sessions</p>
                            <p className="status-badge status-active">Global</p>
                        </div>
                        <button onClick={() => handleDeletePlan(plan._id)} className="btn btn-secondary" style={{ marginTop: '0.75rem', width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FitPrimePlans;
