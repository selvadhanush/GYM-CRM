import { useState, useEffect } from 'react';
import API from '../services/api';
import { LogIn, LogOut, UserPlus, UserCog, UserMinus, IndianRupee, Banknote, TrendingDown, ClipboardList, ClipboardEdit, ClipboardX, CalendarPlus, CalendarMinus, Target, Snowflake, Sun, Building, Settings } from 'lucide-react';

const ACTION_ICONS = {
    LOGIN: <LogIn size={18} />, LOGOUT: <LogOut size={18} />,
    MEMBER_CREATED: <UserPlus size={18} />, MEMBER_UPDATED: <UserCog size={18} />, MEMBER_DELETED: <UserMinus size={18} />,
    PAYMENT_ADDED: <IndianRupee size={18} />, PAYMENT_DELETED: <Banknote size={18} />,
    EXPENSE_ADDED: <TrendingDown size={18} />, EXPENSE_DELETED: <TrendingDown size={18} />,
    PLAN_CREATED: <ClipboardList size={18} />, PLAN_UPDATED: <ClipboardEdit size={18} />, PLAN_DELETED: <ClipboardX size={18} />,
    CLASS_CREATED: <CalendarPlus size={18} />, CLASS_DELETED: <CalendarMinus size={18} />,
    LEAD_CREATED: <Target size={18} />, LEAD_UPDATED: <Target size={18} />, LEAD_DELETED: <Target size={18} />,
    FREEZE_APPLIED: <Snowflake size={18} />, FREEZE_REMOVED: <Sun size={18} />,
    BRANCH_CREATED: <Building size={18} />, BRANCH_UPDATED: <Building size={18} />, BRANCH_DELETED: <Building size={18} />,
    OTHER: <Settings size={18} />
};

const ACTION_COLORS = {
    LOGIN: '#10b981', LOGOUT: '#6b7280',
    MEMBER_CREATED: '#6366f1', MEMBER_UPDATED: '#f59e0b', MEMBER_DELETED: '#ef4444',
    PAYMENT_ADDED: '#10b981', PAYMENT_DELETED: '#ef4444',
    EXPENSE_ADDED: '#f59e0b', EXPENSE_DELETED: '#ef4444',
    PLAN_CREATED: '#6366f1', PLAN_UPDATED: '#f59e0b', PLAN_DELETED: '#ef4444',
    CLASS_CREATED: '#0ea5e9', CLASS_DELETED: '#ef4444',
    LEAD_CREATED: '#8b5cf6', LEAD_UPDATED: '#f59e0b', LEAD_DELETED: '#ef4444',
    FREEZE_APPLIED: '#6366f1', FREEZE_REMOVED: '#10b981',
    BRANCH_CREATED: '#0ea5e9', BRANCH_UPDATED: '#f59e0b', BRANCH_DELETED: '#ef4444',
    OTHER: '#6b7280'
};

const timeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [tab, setTab] = useState('timeline'); // 'timeline' | 'logins'

    const fetchLogs = async (p = 1, action = '') => {
        try {
            const params = new URLSearchParams({ page: p, limit: 50 });
            if (action) params.append('action', action);
            const { data } = await API.get(`/audit?${params}`);
            setLogs(data.logs);
            setTotalPages(data.pages);
            setTotal(data.total);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchSummary = async () => {
        try {
            const { data } = await API.get('/audit/summary');
            setSummary(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchSummary();
        fetchLogs(1, filterAction);
    }, []);

    const handleFilter = (action) => {
        setFilterAction(action);
        setPage(1);
        fetchLogs(1, action);
    };

    const handlePage = (p) => {
        setPage(p);
        fetchLogs(p, filterAction);
    };

    const loginLogs = summary?.recentLogins || [];

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>🔍 Audit Logs</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{total} total events tracked</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setTab('timeline')} className="btn" style={{ background: tab === 'timeline' ? 'var(--primary-color)' : 'var(--bg-secondary)', color: tab === 'timeline' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>📋 Activity</button>
                    <button onClick={() => setTab('logins')} className="btn" style={{ background: tab === 'logins' ? 'var(--primary-color)' : 'var(--bg-secondary)', color: tab === 'logins' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>🔐 Login History</button>
                </div>
            </div>

            {/* Summary action counts */}
            {summary?.summary?.length > 0 && tab === 'timeline' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => handleFilter('')}
                        style={{ background: !filterAction ? 'var(--primary-color)' : 'var(--bg-secondary)', color: !filterAction ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '999px', padding: '0.25rem 0.75rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                        All ({total})
                    </button>
                    {summary.summary.map(s => (
                        <button
                            key={s._id}
                            onClick={() => handleFilter(s._id)}
                            style={{ background: filterAction === s._id ? ACTION_COLORS[s._id] || 'var(--primary-color)' : 'var(--bg-secondary)', color: filterAction === s._id ? '#fff' : 'var(--text-secondary)', border: `1px solid ${filterAction === s._id ? (ACTION_COLORS[s._id] || 'var(--primary-color)') : 'var(--border-color)'}`, borderRadius: '999px', padding: '0.25rem 0.75rem', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {ACTION_ICONS[s._id] || <Settings size={14} />} {s._id.replace(/_/g, ' ')} ({s.count})
                        </button>
                    ))}
                </div>
            )}

            {/* Activity Timeline */}
            {tab === 'timeline' && (
                <div className="card" style={{ padding: '1rem' }}>
                    {logs.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                            <div style={{ fontSize: '2.5rem' }}>🔍</div>
                            <p>No activity logged yet. Actions will appear here.</p>
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            {/* Timeline line */}
                            <div style={{ position: 'absolute', left: '19px', top: 0, bottom: 0, width: '2px', background: 'var(--border-color)' }} />
                            {logs.map((log, i) => {
                                const color = ACTION_COLORS[log.action] || '#6b7280';
                                const icon = ACTION_ICONS[log.action] || '⚙️';
                                return (
                                    <div key={log._id} style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', position: 'relative' }}>
                                        {/* Dot */}
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '50%',
                                            background: `${color}22`, border: `2px solid ${color}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.9rem', flexShrink: 0, zIndex: 1
                                        }}>{icon}</div>
                                        {/* Content */}
                                        <div style={{ flex: 1, paddingTop: '0.3rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <span style={{ background: `${color}22`, color, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800' }}>
                                                        {log.action.replace(/_/g, ' ')}
                                                    </span>
                                                    <p style={{ margin: '0.3rem 0 0.15rem', fontWeight: '600', fontSize: '0.9rem' }}>{log.details || log.action}</p>
                                                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                        by <strong>{log.userName}</strong>
                                                        {log.userRole && <span> · {log.userRole}</span>}
                                                        {log.userEmail && <span> · {log.userEmail}</span>}
                                                    </p>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>{timeAgo(log.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                            <button disabled={page === 1} onClick={() => handlePage(page - 1)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem' }}>← Prev</button>
                            <span style={{ padding: '0.35rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Page {page} of {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => handlePage(page + 1)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem' }}>Next →</button>
                        </div>
                    )}
                </div>
            )}

            {/* Login History Tab */}
            {tab === 'logins' && (
                <div className="card" style={{ padding: 0 }}>
                    <table>
                        <thead><tr><th>User</th><th>Role</th><th>Email</th><th>Time</th><th>IP</th></tr></thead>
                        <tbody>
                            {loginLogs.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No logins recorded yet.</td></tr>
                            ) : loginLogs.map(l => (
                                <tr key={l._id}>
                                    <td style={{ fontWeight: '600' }}>{l.userName}</td>
                                    <td><span style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem' }}>{l.userRole}</span></td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{l.userEmail}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(l.createdAt).toLocaleString()}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{l.ip || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
