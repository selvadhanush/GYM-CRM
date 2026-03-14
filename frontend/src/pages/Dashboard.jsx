import { useState, useEffect, useContext } from 'react';
import { getStats, getMembers } from '../services/apiService';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { Users, CheckCircle2, AlertTriangle, Clock, Sparkles, IndianRupee, TrendingDown, TrendingUp, Megaphone, Check } from 'lucide-react';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [expiringMembers, setExpiringMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [announceMsg, setAnnounceMsg] = useState('');
    const [showAnnounce, setShowAnnounce] = useState(false);
    const [announcing, setAnnouncing] = useState(false);
    const [announceSuccess, setAnnounceSuccess] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsData, membersData] = await Promise.all([
                    getStats(),
                    getMembers('Active')
                ]);
                setStats(statsData);

                // Filter members expiring in the next 7 days
                const today = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(today.getDate() + 7);

                const expiring = (membersData.members || []).filter(m => {
                    const expiry = new Date(m.expiryDate);
                    return expiry > today && expiry <= nextWeek;
                });
                setExpiringMembers(expiring);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatTrendData = (trend) => {
        if (!trend) return [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return trend.map(item => ({
            name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
            amount: item.total
        }));
    };

    const handleAnnounce = async (e) => {
        e.preventDefault();
        setAnnouncing(true);
        try {
            await API.post('/notifications/announcement', { message: announceMsg });
            setAnnounceSuccess(true);
            setAnnounceMsg('');
            setTimeout(() => { setShowAnnounce(false); setAnnounceSuccess(false); }, 1500);
        } catch (err) {
            alert('Failed to send announcement.');
        } finally {
            setAnnouncing(false);
        }
    };

    if (loading) return (
        <div className="kpi-grid" style={{ marginBottom: '1.75rem' }}>
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="kpi-card" style={{ '--kpi-color': '#e2e8f0', '--kpi-bg': 'var(--bg-tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="skeleton" style={{ width: 100, height: 12, borderRadius: 6 }} />
                        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
                    </div>
                    <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 8 }} />
                    <div className="skeleton" style={{ width: 110, height: 11, borderRadius: 6 }} />
                </div>
            ))}
        </div>
    );

    const cards = [
        { title: 'Total Members', value: stats?.totalMembers || 0, icon: <Users size={22} />, color: 'var(--primary-color)' },
        { title: 'Active Members', value: stats?.activeMembers || 0, icon: <CheckCircle2 size={22} />, color: 'var(--success-color)' },
        { title: 'Expired Members', value: stats?.expiredMembers || 0, icon: <AlertTriangle size={22} />, color: '#ef4444' },
        { title: 'Inactive (7+ Days)', value: stats?.inactiveMembersCount || 0, icon: <Clock size={22} />, color: '#f43f5e' },
        { title: 'New This Month', value: stats?.newMembersThisMonth || 0, icon: <Sparkles size={22} />, color: 'var(--accent-color)' },
        { title: 'Monthly Revenue', value: `₹${stats?.monthlyRevenue || 0}`, icon: <IndianRupee size={22} />, color: '#f59e0b' },
        { title: 'Monthly Expenses', value: `₹${stats?.monthlyExpenses || 0}`, icon: <TrendingDown size={22} />, color: '#ef4444' },
        { title: 'Monthly Profit', value: `₹${stats?.monthlyProfit || 0}`, icon: <TrendingUp size={22} />, color: 'var(--success-color)' },
    ];

    const COLORS = ['var(--primary)', 'var(--accent)', '#a855f7', '#d946ef', '#f43f5e'];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Dashboard Overview</h2>
                    <p>Welcome back, {user?.name || 'Administrator'}. Here's what's happening today.</p>
                </div>
                {user?.role === 'admin' && (
                    <button onClick={() => setShowAnnounce(true)} className="btn btn-primary">
                        <Megaphone size={18} /> Send Announcement
                    </button>
                )}
            </div>

            {/* Announcement Modal */}
            {showAnnounce && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAnnounce(false); }}>
                    <div className="modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Megaphone size={22} className="text-primary" /> Send Announcement
                            </h3>
                            <button onClick={() => setShowAnnounce(false)} className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}>×</button>
                        </div>

                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Broadcast a message to all members and staff. This will appear as a notification in their portal.
                        </p>

                        {announceSuccess ? (
                            <div className="badge badge-active" style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem' }}>
                                <Check size={20} /> Announcement Dispatched Successfully!
                            </div>
                        ) : (
                            <form onSubmit={handleAnnounce}>
                                <div className="input-group">
                                    <textarea
                                        className="input"
                                        style={{ minHeight: '120px', resize: 'none' }}
                                        placeholder="Type your message here..."
                                        value={announceMsg}
                                        onChange={e => setAnnounceMsg(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="button" onClick={() => setShowAnnounce(false)} className="btn btn-secondary" style={{ flex: 1 }}>Discard</button>
                                    <button type="submit" disabled={announcing} className="btn btn-primary" style={{ flex: 1 }}>
                                        {announcing ? 'Sending...' : 'Broadcast Now'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <div className="kpi-grid">
                {cards.map((card, index) => (
                    <div key={index} className="kpi-card" style={{ '--kpi-color': card.color, '--kpi-bg': `${card.color}18` }}>
                        <div className="kpi-header">
                            <span className="kpi-label">{card.title}</span>
                            <div className="kpi-icon">{card.icon}</div>
                        </div>
                        <div className="kpi-value">{card.value}</div>
                    </div>
                ))}
            </div>

            <div className="charts-grid" style={{ marginBottom: '2.5rem' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '2rem' }}>Revenue Analytics</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={formatTrendData(stats?.revenueTrend)}>
                                <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} dx={-10} />
                                <Tooltip
                                    cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                                    contentStyle={{
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        boxShadow: 'var(--shadow-lg)',
                                        background: 'var(--bg-secondary)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ color: 'var(--primary)', fontWeight: 700 }}
                                    formatter={(value) => [`₹${value}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '2rem' }}>Plan Performance</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats?.planBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: 'var(--primary-light)' }}
                                    contentStyle={{
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        boxShadow: 'var(--shadow-lg)',
                                        background: 'var(--bg-secondary)'
                                    }}
                                    formatter={(value) => [`₹${value}`, 'Generated Revenue']}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                    {stats?.planBreakdown?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.9} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="card">
                    <h3 style={{ marginBottom: '2rem' }}>Collections by Method</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats?.methodBreakdown}
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={8}
                                    dataKey="value"
                                    nameKey="_id"
                                    stroke="none"
                                >
                                    {stats?.methodBreakdown?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        boxShadow: 'var(--shadow-lg)',
                                        background: 'var(--bg-secondary)'
                                    }}
                                    formatter={(value) => [`₹${value}`, 'Total Collected']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Expiring Memberships</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Members whose plans expire within the next 7 days.</p>
                    {expiringMembers.length > 0 ? (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Expiry</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiringMembers.map(member => (
                                        <tr key={member._id}>
                                            <td style={{ fontWeight: 600 }}>{member.name}</td>
                                            <td>{new Date(member.expiryDate).toLocaleDateString()}</td>
                                            <td><span className={`badge badge-${member.status.toLowerCase()}`}>{member.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">✅</div>
                            <h3>Clean Slate</h3>
                            <p>No memberships are expiring in the coming week.</p>
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
};

export default Dashboard;
