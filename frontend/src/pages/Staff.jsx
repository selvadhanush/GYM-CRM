import { useState, useEffect, useContext } from 'react';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../services/apiService';
import Modal from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

const Staff = () => {
    const { user } = useContext(AuthContext);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    
    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'trainer'
    });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const data = await getStaff();
            setStaffList(data);
        } catch (error) {
            console.error('Error fetching staff list:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (staff = null) => {
        setError('');
        setShowPassword(false);
        if (staff) {
            setEditingStaff(staff);
            setFormData({
                name: staff.name,
                email: staff.email,
                password: '',
                role: staff.role
            });
        } else {
            setEditingStaff(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'trainer'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingStaff) {
                const payload = { ...formData };
                if (!payload.password) {
                    delete payload.password;
                }
                await updateStaff(editingStaff._id, payload);
            } else {
                await createStaff(formData);
            }
            fetchStaff();
            setIsModalOpen(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save staff member');
        }
    };

    const handleDelete = async (staffMember) => {
        if (staffMember._id === user?._id || staffMember.id === user?.id) {
            alert('You cannot delete your own account.');
            return;
        }
        if (window.confirm(`Are you sure you want to remove ${staffMember.name} from the gym staff?`)) {
            try {
                await deleteStaff(staffMember._id);
                fetchStaff();
            } catch (err) {
                alert(err.response?.data?.message || 'Error deleting staff member');
            }
        }
    };

    const filteredStaff = staffList.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                              s.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter ? s.role === roleFilter : true;
        return matchesSearch && matchesRole;
    });

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2>Staff & Trainers</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Manage gym instructors, receptionists, and administrator accounts.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    👤 Add New Staff
                </button>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                    className="input" 
                    style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select 
                    className="input" 
                    style={{ width: '180px', marginBottom: 0 }}
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                >
                    <option value="">All Roles</option>
                    <option value="trainer">Trainer</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email Address</th>
                            <th>Role</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStaff.length > 0 ? (
                            filteredStaff.map(staff => (
                                <tr key={staff._id || staff.id}>
                                    <td style={{ fontWeight: '600' }}>{staff.name}</td>
                                    <td>{staff.email}</td>
                                    <td>
                                        <span className={`badge`} style={{
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            background: staff.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 
                                                        staff.role === 'trainer' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: staff.role === 'admin' ? '#ef4444' : 
                                                   staff.role === 'trainer' ? '#6366f1' : '#f59e0b'
                                        }}>
                                            {staff.role}
                                        </span>
                                    </td>
                                    <td>{new Date(staff.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button 
                                                className="btn" 
                                                style={{ padding: '0.4rem', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                                onClick={() => handleOpenModal(staff)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                className="btn btn-danger" 
                                                style={{ padding: '0.4rem' }}
                                                onClick={() => handleDelete(staff)}
                                                disabled={staff._id === user?._id || staff.id === user?.id}
                                                title={staff._id === user?._id || staff.id === user?.id ? 'Cannot delete yourself' : ''}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No staff members found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingStaff ? `✏️ Edit Staff: ${editingStaff.name}` : '👤 Create New Staff Member'}
            >
                <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
                    {error && (
                        <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: '500' }}>
                            {error}
                        </div>
                    )}
                    
                    <div className="input-group">
                        <label>Full Name *</label>
                        <input 
                            className="input" 
                            type="text" 
                            value={formData.name} 
                            onChange={e => setFormData({ ...formData, name: e.target.value })} 
                            required 
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="input-group">
                        <label>Email Address *</label>
                        <input 
                            className="input" 
                            type="email" 
                            value={formData.email} 
                            onChange={e => setFormData({ ...formData, email: e.target.value })} 
                            required 
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="input-group">
                        <label>{editingStaff ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                                className="input" 
                                type={showPassword ? 'text' : 'password'} 
                                value={formData.password} 
                                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                                required={!editingStaff} 
                                placeholder={editingStaff ? '••••••••' : 'Enter login password'}
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>System Role *</label>
                        <select 
                            className="input" 
                            value={formData.role} 
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            required
                        >
                            <option value="trainer">Trainer / Instructor</option>
                            <option value="receptionist">Receptionist / Desk Staff</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        {editingStaff ? 'Save Changes' : 'Create Account'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Staff;
