import { useState, useEffect } from 'react';
import API from '../services/api';
import Modal from '../components/Modal';
import { Trash2 } from 'lucide-react';

const CLASS_TYPES = ['Yoga', 'Zumba', 'Strength', 'Cardio', 'HIIT', 'Pilates', 'CrossFit', 'Boxing', 'Dance', 'Stretching'];

const Classes = () => {
    const [classes, setClasses] = useState([]);
    const [members, setMembers] = useState([]);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingsModal, setBookingsModal] = useState(null);
    const [formData, setFormData] = useState({
        name: '', type: 'Yoga', description: '', trainerName: '',
        scheduleDate: '', startTime: '', endTime: '', maxSeats: 10
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchClasses = async () => {
        try {
            const { data } = await API.get('/classes');
            setClasses(data);
        } catch (err) {
            console.error('Error fetching classes:', err);
        } finally { setLoading(false); }
    };

    const fetchMembers = async () => {
        try {
            const { data } = await API.get('/members?limit=1000&status=Active');
            setMembers(data.members || []);
        } catch (err) {
            console.error('Error fetching members:', err);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await API.post('/classes', formData);
            setIsModalOpen(false);
            setFormData({ name: '', type: 'Yoga', description: '', trainerName: '', scheduleDate: '', startTime: '', endTime: '', maxSeats: 10 });
            fetchClasses();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create class');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this class?')) return;
        try {
            await API.delete(`/classes/${id}`);
            fetchClasses();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };

    const viewBookings = async (gymClass) => {
        try {
            const { data } = await API.get(`/classes/${gymClass._id}/bookings`);
            setBookingsModal(data);
            fetchMembers();
        } catch (err) {
            alert('Failed to fetch bookings');
        }
    };

    const handleAdminBook = async (e) => {
        e.preventDefault();
        if (!selectedMemberId) return;
        try {
            await API.post(`/classes/${bookingsModal._id}/book`, { memberId: selectedMemberId });
            const { data } = await API.get(`/classes/${bookingsModal._id}/bookings`);
            setBookingsModal(data);
            setSelectedMemberId('');
            fetchClasses();
            alert('Member booked successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to book member');
        }
    };

    const handleAdminCancel = async (memberId) => {
        if (!window.confirm('Remove this member from the class?')) return;
        try {
            await API.delete(`/classes/${bookingsModal._id}/bookings/${memberId}`);
            const { data } = await API.get(`/classes/${bookingsModal._id}/bookings`);
            setBookingsModal(data);
            fetchClasses();
            alert('Booking cancelled successfully.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const typeColors = {
        Yoga: '#10b981', Zumba: '#f59e0b', Strength: '#6366f1', Cardio: '#ef4444',
        HIIT: '#f43f5e', Pilates: '#8b5cf6', CrossFit: '#0ea5e9', Boxing: '#d946ef',
        Dance: '#ec4899', Stretching: '#14b8a6'
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>📅 Class Scheduling</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{classes.length} class(es) scheduled</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Schedule Class</button>
            </div>

            {classes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                    <p>No classes scheduled yet. Create your first class!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {classes.map(gymClass => (
                        <div key={gymClass._id} className="card" style={{ borderTop: `4px solid ${typeColors[gymClass.type] || 'var(--primary-color)'}`, padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                    <span style={{
                                        background: `${typeColors[gymClass.type] || 'var(--primary-color)'}22`,
                                        color: typeColors[gymClass.type] || 'var(--primary-color)',
                                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700'
                                    }}>{gymClass.type}</span>
                                    <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.1rem' }}>{gymClass.name}</h3>
                                    {gymClass.trainerName && <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>👤 {gymClass.trainerName}</p>}
                                </div>
                                <span style={{
                                    background: gymClass.seatsAvailable > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: gymClass.seatsAvailable > 0 ? '#10b981' : '#ef4444',
                                    padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700'
                                }}>
                                    {gymClass.seatsAvailable}/{gymClass.maxSeats} seats
                                </span>
                            </div>

                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                <div>📆 {new Date(gymClass.scheduleDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                <div>⏰ {gymClass.startTime} – {gymClass.endTime}</div>
                                {gymClass.description && <div style={{ marginTop: '0.25rem' }}>📝 {gymClass.description}</div>}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => viewBookings(gymClass)}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)' }}
                                >
                                    👥 Bookings ({gymClass.bookings?.length || 0})
                                </button>
                                <button
                                    onClick={() => handleDelete(gymClass._id)}
                                    className="btn"
                                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Class Modal */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setError(''); }} title="📅 Schedule New Class">
                <form onSubmit={handleCreate}>
                    {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Class Name *</label>
                            <input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Morning Yoga" />
                        </div>
                        <div className="input-group">
                            <label>Type *</label>
                            <select className="input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                {CLASS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Trainer Name</label>
                            <input className="input" value={formData.trainerName} onChange={e => setFormData({ ...formData, trainerName: e.target.value })} placeholder="Trainer name" />
                        </div>
                        <div className="input-group">
                            <label>Max Seats *</label>
                            <input className="input" type="number" min="1" value={formData.maxSeats} onChange={e => setFormData({ ...formData, maxSeats: e.target.value })} required />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Date *</label>
                        <input className="input" type="date" value={formData.scheduleDate} onChange={e => setFormData({ ...formData, scheduleDate: e.target.value })} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Start Time *</label>
                            <input className="input" type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>End Time *</label>
                            <input className="input" type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} required />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Description</label>
                        <textarea className="input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} placeholder="Optional description..." />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
                        {submitting ? 'Scheduling...' : '📅 Schedule Class'}
                    </button>
                </form>
            </Modal>

            {/* Bookings Modal */}
            <Modal isOpen={!!bookingsModal} onClose={() => { setBookingsModal(null); setSelectedMemberId(''); }} title={`👥 Bookings — ${bookingsModal?.name}`}>
                
                {/* Admin Booking Form */}
                <form onSubmit={handleAdminBook} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>Add Member to Class</label>
                        <select 
                            className="input" 
                            value={selectedMemberId} 
                            onChange={e => setSelectedMemberId(e.target.value)}
                            required
                        >
                            <option value="">-- Select Member --</option>
                            {members
                                .filter(m => !bookingsModal?.bookings?.some(b => b.memberId?._id?.toString() === m._id?.toString() || b.memberId?.toString() === m._id?.toString()))
                                .map(m => (
                                    <option key={m._id} value={m._id}>{m.name} ({m.phone})</option>
                                ))
                            }
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 1.25rem' }}>
                        Book Member
                    </button>
                </form>

                {/* Bookings List Table */}
                {bookingsModal?.bookings?.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Member</th>
                                <th>Booked At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookingsModal.bookings.map((b, i) => (
                                <tr key={b._id || b.memberId?._id || b.memberId}>
                                    <td>{i + 1}</td>
                                    <td>{b.memberName || b.memberId?.name || 'Unknown'}</td>
                                    <td>{b.bookedAt ? new Date(b.bookedAt).toLocaleString('en-IN') : 'N/A'}</td>
                                    <td>
                                        <button
                                            onClick={() => handleAdminCancel(b.memberId?._id || b.memberId)}
                                            className="btn"
                                            style={{ 
                                                padding: '0.25rem 0.5rem', 
                                                background: 'rgba(239,68,68,0.1)', 
                                                color: '#ef4444', 
                                                border: '1px solid rgba(239,68,68,0.2)', 
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No bookings yet for this class.</p>
                )}
            </Modal>
        </div>
    );
};

export default Classes;
