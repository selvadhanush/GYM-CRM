import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMembers, getPlans, createMember, updateMember, deleteMember } from '../services/apiService';
import Modal from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import API from '../services/api';
import { Pencil, Trash2, Smartphone } from 'lucide-react';

const Members = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [viewingQRMember, setViewingQRMember] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [branches, setBranches] = useState([]);
    const [branchFilter, setBranchFilter] = useState('');
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', planId: '', joinDate: '', branchId: '' });
    const [highlightId, setHighlightId] = useState(null);
    const highlightRef = useRef(null);

    // Read URL params from global search
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchParam = params.get('search');
        const highlightParam = params.get('highlight');
        if (searchParam) setSearchTerm(searchParam);
        if (highlightParam) setHighlightId(highlightParam);
    }, [location.search]);

    // Scroll to highlighted member
    useEffect(() => {
        if (highlightId && highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightId(null), 3000);
        }
    }, [highlightId, members]);

    useEffect(() => {
        fetchData();
    }, [page, statusFilter]);

    const fetchData = async () => {
        try {
            const [membersData, plansData, branchesRes] = await Promise.all([
                getMembers(statusFilter, page),
                getPlans(),
                API.get('/branches')
            ]);
            setMembers(membersData.members || []);
            setPages(membersData.pages || 1);
            setPlans(plansData);
            setBranches(branchesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchData();
    }, [statusFilter]);

    const handleOpenModal = (member = null) => {
        if (member) {
            setEditingMember(member);
            setFormData({
                name: member.name,
                phone: member.phone,
                email: member.email || '',
                planId: member.planId?._id || '',
                joinDate: member.joinDate.split('T')[0],
                branchId: member.branchId?._id || member.branchId || ''
            });
        } else {
            setEditingMember(null);
            setFormData({ name: '', phone: '', email: '', planId: '', joinDate: new Date().toISOString().split('T')[0], branchId: '' });
        }
        setIsModalOpen(true);
    };

    const handleDownloadQR = () => {
        const canvas = document.getElementById('member-qr');
        const url = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = `QR - ${viewingQRMember.name}.png`;
        link.href = url;
        link.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMember) {
                await updateMember(editingMember._id, formData);
            } else {
                await createMember(formData);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving member');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this member?')) {
            try {
                await deleteMember(id);
                fetchData();
            } catch (error) {
                alert('Error deleting member');
            }
        }
    };

    const filteredMembers = members.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm);
        const matchBranch = !branchFilter || (m.branchId?._id || m.branchId || '') === branchFilter;
        return matchSearch && matchBranch;
    });

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <div className="page-header">
                <h2>Members Management</h2>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Add New Member</button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input
                    className="input"
                    style={{ flex: '1', minWidth: '200px' }}
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="input"
                    style={{ flex: '1', minWidth: '150px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Frozen">❄️ Frozen</option>
                </select>
                {branches.length > 0 && (
                    <select
                        className="input"
                        style={{ flex: '1', minWidth: '150px' }}
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                    >
                        <option value="">All Branches</option>
                        {branches.map(b => <option key={b._id} value={b._id}>🏢 {b.name}</option>)}
                    </select>
                )}
            </div>

            <div className="table-container">

                <table>
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th className="hide-mobile">Phone</th>
                            <th>Plan</th>
                            <th className="hide-mobile">Branch</th>
                            <th className="hide-mobile">Expiry Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.length === 0 ? (
                            <tr>
                                <td colSpan="7">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">👥</div>
                                        <h3>No members found</h3>
                                        <p>Try adjusting your search query or status filter.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredMembers.map(member => (
                            <tr
                                key={member._id}
                                ref={member._id === highlightId ? highlightRef : null}
                                style={member._id === highlightId ? {
                                    background: 'var(--primary-light)',
                                    outline: '2px solid var(--primary)',
                                    transition: 'background 1s, outline 1s'
                                } : {}}
                            >
                                <td>
                                    <div style={{ fontWeight: '600' }}>{member.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{member.email}</div>
                                </td>
                                <td className="hide-mobile">{member.phone}</td>
                                <td>{member.planId?.name || 'N/A'}</td>
                                <td className="hide-mobile">
                                    {member.branchId ? (
                                        <span style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600' }}>
                                            🏢 {branches.find(b => b._id === (member.branchId?._id || member.branchId))?.name || 'Branch'}
                                        </span>
                                    ) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>}
                                </td>
                                <td className="hide-mobile">{new Date(member.expiryDate).toLocaleDateString()}</td>
                                <td><span className={`badge badge-${member.status.toLowerCase()}`}>{member.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>

                                        <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} title="Show QR" onClick={() => { setViewingQRMember(member); setIsQRModalOpen(true); }}>
                                            <Smartphone size={16} />
                                        </button>
                                        <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} onClick={() => handleOpenModal(member)}>
                                            <Pencil size={16} />
                                        </button>
                                        {(user?.role === 'admin' || user?.role === 'superadmin') && (
                                            <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(member._id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                    <button
                        className="btn"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        style={{ opacity: page === 1 ? 0.5 : 1 }}
                    >
                        ◀ Previous
                    </button>
                    <span style={{ fontWeight: '600' }}>Page {page} of {pages}</span>
                    <button
                        className="btn"
                        disabled={page === pages}
                        onClick={() => setPage(page + 1)}
                        style={{ opacity: page === pages ? 0.5 : 1 }}
                    >
                        Next ▶
                    </button>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMember ? 'Edit Member' : 'Add New Member'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="input-group full-width">
                            <label>Name</label>
                            <input className="input" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>Phone</label>
                            <input className="input" type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>Email (Optional)</label>
                            <input className="input" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Subscription Plan</label>
                            <select className="input" value={formData.planId} onChange={(e) => setFormData({ ...formData, planId: e.target.value })} required>
                                <option value="">Select a plan</option>
                                {plans.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Branch (optional)</label>
                            <select className="input" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}>
                                <option value="">No Branch / All Locations</option>
                                {branches.map(b => <option key={b._id} value={b._id}>🏢 {b.name}</option>)}
                            </select>
                        </div>
                        {!editingMember && (
                            <div className="input-group full-width">
                                <label>Join Date</label>
                                <input className="input" type="date" value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} required />
                            </div>
                        )}
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>{editingMember ? 'Update Member' : 'Register Member'}</button>
                </form>
            </Modal>

            {/* QR Code Modal */}
            <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Member QR Attendance Code">
                {viewingQRMember && (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', display: 'inline-block', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <QRCodeCanvas
                                id="member-qr"
                                value={viewingQRMember._id}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                        <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>{viewingQRMember.name}</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Member ID: {viewingQRMember._id}</p>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleDownloadQR}>Download QR Code</button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Members;
