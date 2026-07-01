import { useState, useEffect, useContext } from 'react';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';

function PartnerGyms() {
    const { user } = useContext(AuthContext);
    const [gyms, setGyms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedGymQr, setSelectedGymQr] = useState(null);
    const [editingGym, setEditingGym] = useState(null);
    // Per-gym editable session duration (id -> minutes), used for the settings column.
    const [durationDraft, setDurationDraft] = useState({});

    // Form state
    const [gymName, setGymName] = useState('');
    const [gymAddress, setGymAddress] = useState('');
    const [sessionHours, setSessionHours] = useState(2);
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');

    useEffect(() => {
        fetchGyms();
    }, []);

    const fetchGyms = async () => {
        try {
            const { data } = await API.get('/superadmin/gyms');
            setGyms(data.filter(g => g.name !== 'SYSTEM'));
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch gyms');
            setLoading(false);
        }
    };

    const handleCreateGym = async (e) => {
        e.preventDefault();
        try {
            await API.post('/superadmin/gyms', {
                gymName, gymAddress,
                defaultSessionDurationMinutes: Number(sessionHours) * 60 || 120,
                adminName, adminEmail, adminPassword
            });
            setGymName(''); setGymAddress(''); setSessionHours(2);
            setAdminName(''); setAdminEmail(''); setAdminPassword('');
            fetchGyms();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create partner gym');
        }
    };

    // Save a gym's default session duration via the new PUT endpoint.
    const handleSaveDuration = async (gymId) => {
        const minutes = Number(durationDraft[gymId]);
        if (!minutes || minutes < 15) {
            alert('Session duration must be at least 15 minutes');
            return;
        }
        try {
            await API.put(`/superadmin/gyms/${gymId}`, { defaultSessionDurationMinutes: minutes });
            setDurationDraft((d) => { const next = { ...d }; delete next[gymId]; return next; });
            fetchGyms();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update session duration');
        }
    };

    const handleDeleteGym = async (gymId) => {
        if (!window.confirm('Are you sure you want to delete this gym and its admins? This action cannot be undone.')) {
            return;
        }
        try {
            await API.delete(`/superadmin/gyms/${gymId}`);
            fetchGyms();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete gym');
        }
    };

    const handleUpdateGym = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/superadmin/gyms/${editingGym._id}`, {
                name: editingGym.name,
                address: editingGym.address,
            });
            setEditingGym(null);
            fetchGyms();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update gym');
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div style={{ padding: '1rem 0' }}>
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Partner Gyms Management</h2>
            </header>

            {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,0,68,0.1)', borderRadius: '6px' }}>{error}</div>}

            <div className="card" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Create New Partner Gym</h3>
                <form onSubmit={handleCreateGym}>
                    <div className="form-grid">
                        <div className="input-group">
                            <label>Gym Name</label>
                            <input className="input" type="text" placeholder="e.g. Elite Fitness Center" value={gymName} onChange={(e) => setGymName(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Default Session Duration (Hours)</label>
                            <select className="input" value={sessionHours} onChange={(e) => setSessionHours(e.target.value)} required>
                                <option value="1">1 Hour</option>
                                <option value="2">2 Hours</option>
                                <option value="3">3 Hours</option>
                                <option value="4">4 Hours</option>
                                <option value="5">5 Hours</option>
                                <option value="6">6 Hours</option>
                            </select>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Gym Address</label>
                        <input className="input" type="text" placeholder="e.g. 123 Fitness Ave, Muscle Town" value={gymAddress} onChange={(e) => setGymAddress(e.target.value)} required />
                    </div>
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="input-group">
                            <label>Admin Name</label>
                            <input className="input" type="text" placeholder="e.g. Admin User" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Admin Email</label>
                            <input className="input" type="email" placeholder="e.g. admin@example.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Admin Password</label>
                            <input className="input" type="text" placeholder="e.g. securepassword" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Partner Gym</button>
                </form>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Gym Name</th>
                            <th>Address</th>
                            <th>Admin</th>
                            <th>Session Duration</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gyms.length === 0 ? (
                            <tr>
                                <td colSpan="5">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">🏢</div>
                                        <h3>No Partner Gyms Found</h3>
                                        <p>Create a partner gym above to begin managing subscriptions and sessions.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            gyms.map(gym => {
                                const current = gym.defaultSessionDurationMinutes || 120;
                                const draft = durationDraft[gym.id] ?? durationDraft[gym._id];
                                const draftVal = draft !== undefined ? draft : current;
                                return (
                                    <tr key={gym._id}>
                                        <td style={{ fontWeight: '600' }}>{gym.name}</td>
                                        <td>{gym.address}</td>
                                        <td>
                                            <div style={{ fontWeight: '500' }}>{gym.admins?.[0]?.name || 'N/A'}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{gym.admins?.[0]?.email || ''}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                <select
                                                    value={draftVal / 60}
                                                    onChange={(e) => setDurationDraft((d) => ({ ...d, [gym._id]: Number(e.target.value) * 60 }))}
                                                    className="input"
                                                    style={{ width: '120px', padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem' }}
                                                >
                                                    <option value="1">1 Hour</option>
                                                    <option value="2">2 Hours</option>
                                                    <option value="3">3 Hours</option>
                                                    <option value="4">4 Hours</option>
                                                    <option value="5">5 Hours</option>
                                                    <option value="6">6 Hours</option>
                                                </select>
                                                {draft !== undefined && Number(draft) !== current && (
                                                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleSaveDuration(gym._id)}>Save</button>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                                    onClick={() => setEditingGym({ ...gym })}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                                    onClick={() => handleDeleteGym(gym._id)}
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                                    onClick={() => setSelectedGymQr(gym)}
                                                >
                                                    View QR
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {selectedGymQr && (
                <div className="modal-overlay" onClick={() => setSelectedGymQr(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '380px' }}>
                        <h3>{selectedGymQr.name}</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Print this QR code. Members will scan it using their mobile app to check in to this gym.
                        </p>
                        <div style={{ background: '#fff', padding: '1.5rem', display: 'inline-block', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                            <QRCodeCanvas
                                value={JSON.stringify({ gymId: selectedGymQr._id, gymName: selectedGymQr.name })}
                                size={220}
                                level="H"
                            />
                        </div>
                        <div style={{ marginTop: '2rem' }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedGymQr(null)} style={{ width: '100%' }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingGym && (
                <div className="modal-overlay" onClick={() => setEditingGym(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <h3>Edit Partner Gym</h3>
                        <form onSubmit={handleUpdateGym} style={{ marginTop: '1.5rem' }}>
                            <div className="input-group">
                                <label>Gym Name</label>
                                <input 
                                    className="input"
                                    type="text" 
                                    value={editingGym.name} 
                                    onChange={(e) => setEditingGym({...editingGym, name: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Gym Address</label>
                                <input 
                                    className="input"
                                    type="text" 
                                    value={editingGym.address} 
                                    onChange={(e) => setEditingGym({...editingGym, address: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingGym(null)} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PartnerGyms;
