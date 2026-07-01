import { useState, useEffect, useContext } from 'react';
import { getPlans, createPlan, updatePlan, deletePlan } from '../services/apiService';
import Modal from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import { Pencil, Trash2 } from 'lucide-react';

const Plans = () => {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({ name: '', duration: '', price: '' });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const data = await getPlans();
            setPlans(data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({ name: plan.name, duration: plan.duration, price: plan.price });
        } else {
            setEditingPlan(null);
            setFormData({ name: '', duration: '', price: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await updatePlan(editingPlan._id, formData);
            } else {
                await createPlan(formData);
            }
            fetchPlans();
            setIsModalOpen(false);
        } catch (error) {
            alert('Error saving plan');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this plan?')) {
            try {
                await deletePlan(id);
                fetchPlans();
            } catch (error) {
                alert('Error deleting plan');
            }
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Plans Management</h2>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Add New Plan</button>
                )}
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>Plan Name</th>
                            <th>Duration (Days)</th>
                            <th>Price (₹)</th>
                            {isAdmin && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {plans.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 4 : 3}>
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📋</div>
                                        <h3>No plans found</h3>
                                        <p>Create subscription plans to get started.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            plans.map(plan => (
                                <tr key={plan._id}>
                                    <td>
                                        {plan.name}
                                        {plan.gymId === 'SYSTEM' && (
                                            <span style={{ marginLeft: '8px', fontSize: '12px', padding: '2px 6px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px' }}>Global</span>
                                        )}
                                    </td>
                                    <td>{plan.gymId === 'SYSTEM' ? `${plan.sessions} sessions` : plan.duration}</td>
                                    <td>{plan.price}</td>
                                    {isAdmin && (
                                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} onClick={() => handleOpenModal(plan)}>
                                                <Pencil size={16} />
                                            </button>
                                            <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(plan._id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPlan ? 'Edit Plan' : 'Add New Plan'}>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Plan Name</label>
                        <input className="input" type="text" placeholder="e.g. Monthly" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-grid">
                        <div className="input-group">
                            <label>Duration (days)</label>
                            <input className="input" type="number" placeholder="e.g. 30" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>Price (₹)</label>
                            <input className="input" type="number" placeholder="e.g. 1000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>{editingPlan ? 'Update Plan' : 'Create Plan'}</button>
                </form>
            </Modal>
        </div>
    );
};

export default Plans;
