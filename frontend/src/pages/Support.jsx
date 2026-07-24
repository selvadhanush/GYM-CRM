import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
    HelpCircle, Mail, MessageSquare, Plus, CheckCircle, Clock, 
    Send, AlertCircle, RefreshCw, ChevronRight, User, Shield
} from 'lucide-react';
import API from '../services/api';

const Support = () => {
    const { user } = useContext(AuthContext);
    
    // UI states
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // New ticket form
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('billing');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Reply form
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    // Tickets state
    const [tickets, setTickets] = useState([]);
    const [fetchingTickets, setFetchingTickets] = useState(true);

    const isStaffOrAdmin = ['admin', 'h4_admin', 'trainer', 'superadmin'].includes(user?.role);

    // Fetch tickets on load
    const fetchTickets = async () => {
        try {
            const { data } = await API.get('/tickets');
            setTickets(data.data);
        } catch (error) {
            console.error('Error fetching tickets', error);
        } finally {
            setFetchingTickets(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // --- Actions ---
    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!subject || !description) return;
        setLoading(true);

        try {
            const { data } = await API.post('/tickets', {
                subject,
                category,
                message: description
            });
            const newTicket = data.data;
            setTickets([newTicket, ...tickets]);
            setSelectedTicketId(newTicket.id);
            setSubject('');
            setDescription('');
            setShowNewTicketModal(false);
        } catch (error) {
            console.error('Error creating ticket', error);
            alert('Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        setSendingReply(true);

        try {
            const { data } = await API.post(`/tickets/${selectedTicketId}/reply`, {
                message: replyText
            });
            
            const updatedTicket = data.data;
            const updated = tickets.map(t => t.id === selectedTicketId ? updatedTicket : t);
            setTickets(updated);
            setReplyText('');
        } catch (error) {
            console.error('Error sending reply', error);
            alert('Failed to send reply');
        } finally {
            setSendingReply(false);
        }
    };

    const handleUpdateStatus = async (ticketId, newStatus) => {
        try {
            const { data } = await API.put(`/tickets/${ticketId}/status`, {
                status: newStatus
            });
            const updatedTicket = data.data;
            const updated = tickets.map(t => t.id === ticketId ? updatedTicket : t);
            setTickets(updated);
        } catch (error) {
            console.error('Error updating status', error);
            alert('Failed to update status');
        }
    };

    const selectedTicket = tickets.find(t => t.id === selectedTicketId);

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (fetchingTickets) {
        return (
            <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Loading support tickets...</p>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontWeight: '800', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <HelpCircle color="var(--primary)" /> Support & Help Desk
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Troubleshoot scanner errors, request billing updates, or log client issues.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowNewTicketModal(true)}>
                    <Plus size={16} /> File New Ticket
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* LEFT: Tickets List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1rem' }}>
                        {/* Search input */}
                        <div style={{ marginBottom: '1rem' }}>
                            <input 
                                type="text" 
                                placeholder="Search ticket ID or topic..."
                                className="form-control"
                                style={{ width: '100%', fontSize: '0.8rem' }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Status Filter buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '8px' }}>
                            {['all', 'pending', 'resolved'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    style={{
                                        border: 'none', background: statusFilter === status ? 'var(--primary)' : 'none',
                                        color: statusFilter === status ? 'var(--text-inverse)' : 'var(--text-secondary)',
                                        fontSize: '0.75rem', fontWeight: '700', borderRadius: '6px', padding: '0.35rem 0',
                                        cursor: 'pointer', textTransform: 'capitalize'
                                    }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto' }}>
                        {filteredTickets.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                <AlertCircle size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                                <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>No tickets found</div>
                            </div>
                        ) : (
                            filteredTickets.map(t => {
                                const isSelected = t.id === selectedTicketId;
                                const shortId = 'TIC-' + t.id.substring(0, 4).toUpperCase();
                                const dateFormatted = new Date(t.createdAt).toISOString().split('T')[0];
                                return (
                                    <div 
                                        key={t.id} 
                                        onClick={() => setSelectedTicketId(t.id)}
                                        style={{
                                            background: isSelected ? 'rgba(240, 160, 32, 0.08)' : 'var(--bg-secondary)',
                                            border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                                            borderRadius: '16px', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>{shortId} • {dateFormatted}</span>
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem',
                                                color: t.status === 'resolved' ? 'var(--success)' : 'var(--warning)'
                                            }}>
                                                {t.status === 'resolved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                {t.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ fontWeight: '700', fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-primary)', lineBreak: 'anywhere' }}>
                                            {t.subject}
                                        </div>
                                        <span style={{
                                            fontSize: '0.65rem', display: 'inline-block', padding: '0.15rem 0.4rem',
                                            borderRadius: '4px', background: 'var(--border)', color: 'var(--text-secondary)',
                                            fontWeight: '700', textTransform: 'uppercase', marginTop: '0.75rem'
                                        }}>
                                            {t.category}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT: Ticket Details & Comment Feed */}
                <div className="card" style={{ padding: '2rem', minHeight: '450px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {!selectedTicket ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-secondary)' }}>
                            <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <h3>No Ticket Selected</h3>
                            <p style={{ fontSize: '0.85rem' }}>Select a ticket from the left column or create a new support request.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', flex: 1 }}>
                            {/* Ticket header info */}
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            <span>TIC-{selectedTicket.id.substring(0, 4).toUpperCase()}</span>
                                            <span>•</span>
                                            <span style={{ textTransform: 'uppercase', fontWeight: '700', color: 'var(--primary)' }}>{selectedTicket.category}</span>
                                            <span>•</span>
                                            <span>Created by {selectedTicket.creatorName} ({selectedTicket.creatorRole})</span>
                                        </div>
                                        <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.25rem', lineBreak: 'anywhere' }}>{selectedTicket.subject}</h3>
                                    </div>

                                    {/* Workflow actions */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {isStaffOrAdmin && (
                                            <select 
                                                className="form-control"
                                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                                value={selectedTicket.status}
                                                onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages feed */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto', marginBottom: '1.5rem', maxHeight: '350px', paddingRight: '0.5rem' }}>
                                {selectedTicket.messages?.map((msg, index) => {
                                    const isSupport = msg.senderRole === 'support' || ['admin', 'h4_admin', 'superadmin'].includes(msg.senderRole) && msg.senderId !== selectedTicket.creatorId;
                                    return (
                                        <div 
                                            key={msg.id || index}
                                            style={{
                                                alignSelf: isSupport ? 'flex-end' : 'flex-start',
                                                background: isSupport ? 'rgba(240, 160, 32, 0.08)' : 'var(--bg-secondary)',
                                                border: isSupport ? '1px solid var(--primary)' : '1px solid var(--border)',
                                                borderRadius: '16px', padding: '1rem', maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: '0.25rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: '700', color: isSupport ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                                {isSupport ? <Shield size={10} /> : <User size={10} />}
                                                <span>{msg.senderName} ({msg.senderRole})</span>
                                                <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                                {msg.message}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reply Input */}
                            <form onSubmit={handleSendReply} style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    placeholder="Type message response..."
                                    style={{ flex: 1 }}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    required
                                    disabled={sendingReply}
                                />
                                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={sendingReply}>
                                    <Send size={16} /> Send
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* NEW TICKET FILING MODAL */}
            {showNewTicketModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '540px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={20} color="var(--primary)" /> File Support Request
                        </h3>
                        <form onSubmit={handleCreateTicket}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Subject</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    placeholder="Brief summary of the issue"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Category</label>
                                <select 
                                    className="form-control"
                                    style={{ width: '100%' }}
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="billing">Billing & Membership Dues</option>
                                    <option value="fitpass">FitPass Scanning Issues</option>
                                    <option value="system">Software Glitch / App Bug</option>
                                    <option value="other">General Query</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Detailed Description</label>
                                <textarea 
                                    className="form-control"
                                    style={{ minHeight: '100px', width: '100%', resize: 'vertical' }}
                                    placeholder="Provide logs, error codes, or clear description..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowNewTicketModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Filing...' : 'Submit Support Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Support;
