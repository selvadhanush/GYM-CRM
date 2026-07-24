import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMembers, getPlans, createMember, updateMember, deleteMember, getMemberAuditTrail } from '../services/apiService';
import Modal from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import API from '../services/api';
import { Pencil, Trash2, Smartphone, FileText, RefreshCw, ArrowRightLeft } from 'lucide-react';

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
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', planId: '', joinDate: '', branchId: '', gymId: '', password: '' });
    const [highlightId, setHighlightId] = useState(null);
    const highlightRef = useRef(null);

    // Renew & Transfer states
    const [renewMemberData, setRenewMemberData] = useState(null);
    const [renewForm, setRenewForm] = useState({ planId: '', paidAmount: '', method: 'Cash' });
    const [transferMemberData, setTransferMemberData] = useState(null);
    const [transferBranchId, setTransferBranchId] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);


    const [gyms, setGyms] = useState([]);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [auditData, setAuditData] = useState(null);
    const [loadingAudit, setLoadingAudit] = useState(false);

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

            if (user?.role === 'superadmin' || user?.role === 'fitpass_admin') {
                const gymsRes = await API.get('/superadmin/gyms');
                // Include H4 gym in the list so superadmin can switch to it!
                const h4GymRes = await API.get('/superadmin/h4-gym');
                const list = gymsRes.data || [];
                const hasH4 = list.some(g => g.name === 'H4' || g._id === h4GymRes.data._id);
                if (!hasH4 && h4GymRes.data) {
                    list.unshift(h4GymRes.data);
                }
                setGyms(list);
            }
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
                branchId: member.branchId?._id || member.branchId || '',
                gymId: member.gymId?._id || member.gymId || '',
                password: ''
            });
        } else {
            setEditingMember(null);
            setFormData({ name: '', phone: '', email: '', planId: '', joinDate: new Date().toISOString().split('T')[0], branchId: '', gymId: '', password: '' });
        }
        setIsModalOpen(true);
    };

    const handleOpenAudit = async (member) => {
        setLoadingAudit(true);
        setIsAuditModalOpen(true);
        setAuditData(null);
        try {
            const data = await getMemberAuditTrail(member._id);
            setAuditData(data);
        } catch (error) {
            alert('Failed to load member audit trail');
            setIsAuditModalOpen(false);
        } finally {
            setLoadingAudit(false);
        }
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
                                        <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', color: '#10b981', background: 'rgba(16,185,129,0.1)' }} title="Renew Plan" onClick={() => {
                                            setRenewMemberData(member);
                                            setRenewForm({ planId: member.planId?._id || member.planId || '', paidAmount: member.planId?.price || '', method: 'Cash' });
                                        }}>
                                            <RefreshCw size={16} />
                                        </button>
                                        <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', color: '#0ea5e9', background: 'rgba(14,165,233,0.1)' }} title="Transfer Branch" onClick={() => {
                                            setTransferMemberData(member);
                                            setTransferBranchId(member.branchId?._id || member.branchId || '');
                                        }}>
                                            <ArrowRightLeft size={16} />
                                        </button>
                                        {user?.role === 'superadmin' && (
                                            <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', color: 'var(--primary)', background: 'rgba(240,160,32,0.1)' }} title="Audit Trail" onClick={() => handleOpenAudit(member)}>
                                                <FileText size={16} />
                                            </button>
                                        )}
                                        <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} title="Show QR" onClick={() => { setViewingQRMember(member); setIsQRModalOpen(true); }}>
                                            <Smartphone size={16} />
                                        </button>
                                        <button className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} onClick={() => handleOpenModal(member)}>
                                            <Pencil size={16} />
                                        </button>
                                        {['superadmin', 'admin', 'fitpass_admin', 'h4_admin'].includes(user?.role) && (
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
                        {['superadmin', 'fitpass_admin'].includes(user?.role) && (
                            <div className="input-group">
                                <label>Gym Division / Partner Gym</label>
                                <select className="input" value={formData.gymId} onChange={(e) => setFormData({ ...formData, gymId: e.target.value })} required>
                                    <option value="">Select Gym</option>
                                    {gyms.map(g => <option key={g._id || g.id} value={g._id || g.id}>{g.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="input-group">
                            <label>{editingMember ? 'Reset Password (optional)' : 'Password (optional, default: Phone)'}</label>
                            <input className="input" type="password" placeholder="Set member password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        {!editingMember && (
                            <div className="input-group">
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

            {/* Audit Trail Modal */}
            <Modal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} title="Member Profile & Audit Trail">
                {loadingAudit ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                        <p style={{ color: 'var(--text-secondary)' }}>Loading audit trail...</p>
                    </div>
                ) : auditData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '75vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        
                        {/* Member Card */}
                        <div style={{ background: 'var(--card-bg, #2D251C)', border: '1px solid var(--border-color, #3A3025)', borderRadius: '12px', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.25rem' }}>{auditData.member.name}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>📞 {auditData.member.phone} | ✉️ {auditData.member.email || 'No email'}</p>
                                </div>
                                <span className={`badge badge-${auditData.member.status.toLowerCase()}`}>{auditData.member.status}</span>
                            </div>
                            
                            <hr style={{ borderColor: 'var(--border-color, #3A3025)', margin: '1rem 0' }} />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Current Division/Gym</span>
                                    <strong style={{ color: '#fff' }}>🏢 {auditData.member.gymName}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Joined Date</span>
                                    <strong style={{ color: '#fff' }}>📅 {new Date(auditData.member.joinDate).toLocaleDateString()} ({auditData.member.joinMonth})</strong>
                                </div>
                            </div>
                        </div>

                        {/* Financials & Subscription Plan */}
                        <div style={{ background: 'var(--card-bg, #2D251C)', border: '1px solid var(--border-color, #3A3025)', borderRadius: '12px', padding: '1.5rem' }}>
                            <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', marginTop: 0 }}>Subscription & Financial Summary</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Current Plan</span>
                                    <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{auditData.member.currentPlan ? auditData.member.currentPlan.name : 'No active plan'}</strong>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Plan Price</span>
                                    <strong style={{ fontSize: '1.1rem', color: '#fff' }}>₹{auditData.member.financials.planPrice}</strong>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Total Paid</span>
                                    <strong style={{ fontSize: '1.1rem', color: '#2E7D32' }}>₹{auditData.member.financials.paidAmount}</strong>
                                </div>
                                <div style={{ background: auditData.member.financials.pendingAmount > 0 ? 'rgba(198,40,40,0.1)' : 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: auditData.member.financials.pendingAmount > 0 ? '1px solid #C62828' : 'none' }}>
                                    <span style={{ fontSize: '0.75rem', color: auditData.member.financials.pendingAmount > 0 ? '#ff8a80' : 'var(--text-secondary)', display: 'block' }}>Pending Balance</span>
                                    <strong style={{ fontSize: '1.1rem', color: auditData.member.financials.pendingAmount > 0 ? '#C62828' : '#2E7D32' }}>
                                        ₹{auditData.member.financials.pendingAmount}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* Division Switch History */}
                        <div style={{ background: 'var(--card-bg, #2D251C)', border: '1px solid var(--border-color, #3A3025)', borderRadius: '12px', padding: '1.5rem' }}>
                            <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', marginTop: 0 }}>Division Transition History</h4>
                            {auditData.divisionSwitches.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>No transition events recorded. Member has remained in their initial division since registration.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {auditData.divisionSwitches.map((sw, idx) => (
                                        <div key={idx} style={{ padding: '0.75rem', background: 'rgba(240,160,32,0.04)', borderLeft: '3px solid var(--primary)', borderRadius: '0 8px 8px 0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <strong style={{ fontSize: '0.88rem', color: '#fff' }}>{sw.details}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(sw.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>Authorized by: {sw.performedBy}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SuperAdmin Conversion controls */}
                        {['superadmin', 'fitpass_admin'].includes(user?.role) && (
                            <div style={{ background: 'var(--card-bg, #2D251C)', border: '1px solid var(--border-color, #3A3025)', borderRadius: '12px', padding: '1.5rem' }}>
                                <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1.0rem', marginTop: 0 }}>🔄 Convert Member Type / Division</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                        Instantly transition this member's type by migrating them to a different division/gym. This will trigger audit logging.
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <select
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color, #3A3025)',
                                                background: 'var(--bg-secondary, #231D14)',
                                                color: '#fff',
                                                fontSize: '0.88rem',
                                                flex: 1,
                                                minWidth: '200px'
                                            }}
                                            value={auditData.member.gymId || ''}
                                            onChange={async (e) => {
                                                const newGymId = e.target.value;
                                                if (newGymId === auditData.member.gymId) return;
                                                if (window.confirm(`Are you sure you want to transition this member to the selected gym/division?`)) {
                                                    try {
                                                        setLoadingAudit(true);
                                                        await updateMember(auditData.member.id, { gymId: newGymId });
                                                        // Refetch audit trail data
                                                        const freshAudit = await getMemberAuditTrail(auditData.member.id);
                                                        setAuditData(freshAudit);
                                                        fetchData(); // update background members table
                                                    } catch (err) {
                                                        alert(err.response?.data?.message || 'Failed to transition member');
                                                    } finally {
                                                        setLoadingAudit(false);
                                                    }
                                                }
                                            }}
                                        >
                                            <option value="" disabled>Select Division / Gym</option>
                                            {gyms.map(g => (
                                                <option key={g._id || g.id} value={g._id || g.id}>
                                                    {g.name === 'H4' ? '🏢 H4 (Gym Membership)' : `🏋️ ${g.name} (FitPass Partner)`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Comprehensive Audit Logs */}
                        <div style={{ background: 'var(--card-bg, #2D251C)', border: '1px solid var(--border-color, #3A3025)', borderRadius: '12px', padding: '1.5rem' }}>
                            <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', marginTop: 0 }}>Comprehensive Action Audit Logs</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                                {auditData.auditLogs.map((log) => (
                                    <div key={log._id} style={{ padding: '0.6rem', borderBottom: '1px solid var(--border-color, #3A3025)', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>{log.action}</span>
                                            <p style={{ fontSize: '0.82rem', color: '#fff', margin: '0.15rem 0' }}>{log.details}</p>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Actor: {log.userName} ({log.userRole})</span>
                                        </div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                ) : (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No audit data available</p>
                )}

            </Modal>

            {/* Renew Plan Modal */}
            <Modal isOpen={!!renewMemberData} onClose={() => setRenewMemberData(null)} title={`🔄 Renew Membership: ${renewMemberData?.name}`}>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmittingAction(true);
                    try {
                        await API.post(`/members/${renewMemberData._id}/renew`, renewForm);
                        setRenewMemberData(null);
                        fetchData();
                    } catch (err) {
                        alert(err.response?.data?.message || 'Failed to renew membership');
                    } finally {
                        setSubmittingAction(false);
                    }
                }}>
                    <div className="input-group">
                        <label>Renewal Plan *</label>
                        <select
                            className="input"
                            value={renewForm.planId}
                            onChange={(e) => {
                                const selected = plans.find(p => p._id === e.target.value);
                                setRenewForm({
                                    ...renewForm,
                                    planId: e.target.value,
                                    paidAmount: selected ? selected.price : renewForm.paidAmount
                                });
                            }}
                            required
                        >
                            <option value="">Select Plan</option>
                            {plans.map(p => (
                                <option key={p._id} value={p._id}>{p.name} — ₹{p.price} ({p.duration ? `${p.duration} days` : `${p.sessions} sessions`})</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Amount Paid Now (₹)</label>
                        <input
                            className="input"
                            type="number"
                            value={renewForm.paidAmount}
                            onChange={(e) => setRenewForm({ ...renewForm, paidAmount: e.target.value })}
                            placeholder="Amount collected"
                        />
                    </div>

                    <div className="input-group">
                        <label>Payment Method</label>
                        <select
                            className="input"
                            value={renewForm.method}
                            onChange={(e) => setRenewForm({ ...renewForm, method: e.target.value })}
                        >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={submittingAction}>
                        {submittingAction ? 'Processing Renewal...' : 'Confirm Plan Renewal'}
                    </button>
                </form>
            </Modal>

            {/* Transfer Branch Modal */}
            <Modal isOpen={!!transferMemberData} onClose={() => setTransferMemberData(null)} title={`🏢 Transfer Branch: ${transferMemberData?.name}`}>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmittingAction(true);
                    try {
                        await API.put(`/members/${transferMemberData._id}/transfer`, { targetBranchId: transferBranchId });
                        setTransferMemberData(null);
                        fetchData();
                    } catch (err) {
                        alert(err.response?.data?.message || 'Failed to transfer branch');
                    } finally {
                        setSubmittingAction(false);
                    }
                }}>
                    <div className="input-group">
                        <label>Target Gym Branch *</label>
                        <select
                            className="input"
                            value={transferBranchId}
                            onChange={(e) => setTransferBranchId(e.target.value)}
                        >
                            <option value="">No Branch (Global Gym Access)</option>
                            {branches.map(b => (
                                <option key={b._id} value={b._id}>🏢 {b.name} — {b.address || 'Main Location'}</option>
                            ))}
                        </select>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Transferring this member updates their branch assignment for attendance, trainer assignments, and revenue reports.
                    </p>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={submittingAction}>
                        {submittingAction ? 'Transferring...' : 'Confirm Branch Transfer'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Members;

