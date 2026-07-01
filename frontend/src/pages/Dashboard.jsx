import { useState, useEffect, useContext } from 'react';
import { getStats, getMembers } from '../services/apiService';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { Users, CheckCircle2, AlertTriangle, Clock, Sparkles, IndianRupee, TrendingDown, TrendingUp, Megaphone, Check, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const COLORS = ['var(--primary-color)', 'var(--accent-color)', '#a855f7', '#d946ef', '#f43f5e'];

const LiveSessionTimer = ({ expiresAt }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const expiration = new Date(expiresAt);
            const diff = expiration - now;

            if (diff <= 0) {
                return 'Expired';
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [expiresAt]);

    return (
        <span style={{ fontFamily: 'monospace', color: timeLeft === 'Expired' ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 'bold' }}>
            {timeLeft}
        </span>
    );
};

const Dashboard = () => {
    const { user, activeDivision, selectedBranchId } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [expiringMembers, setExpiringMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [announceMsg, setAnnounceMsg] = useState('');
    const [showAnnounce, setShowAnnounce] = useState(false);
    const [announcing, setAnnouncing] = useState(false);
    const [announceSuccess, setAnnounceSuccess] = useState(false);
    const [showQR, setShowQR] = useState(false);

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
    }, [activeDivision, selectedBranchId]);

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
            <div className="kpi-card" style={{ '--kpi-color': '#e2e8f0', '--kpi-bg': 'var(--bg-tertiary)' }}>
                <div className="skeleton" style={{ width: 100, height: 12, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 8, marginTop: 12 }} />
            </div>
        </div>
    );

    const recentCheckins = stats?.recentCheckins || [];
    const activeLiveSessions = stats?.activeLiveSessions || [];

    const cards = activeDivision === 'h4' ? [
        { title: 'Total Members', value: stats?.totalMembers || 0, icon: <Users size={22} />, color: 'var(--primary-color)' },
        { title: 'Active Members', value: stats?.activeMembers || 0, icon: <CheckCircle2 size={22} />, color: 'var(--success-color)' },
        { title: 'Expired Members', value: stats?.expiredMembers || 0, icon: <AlertTriangle size={22} />, color: '#ef4444' },
        { title: 'Expiring Soon', value: stats?.expiringSoonCount || 0, icon: <Clock size={22} />, color: '#f59e0b' },
        { title: 'New This Month', value: stats?.newMembersThisMonth || 0, icon: <Sparkles size={22} />, color: 'var(--accent-color)' },
        { title: 'Monthly Revenue', value: `₹${(stats?.monthlyRevenue || 0).toLocaleString()}`, icon: <IndianRupee size={22} />, color: '#10b981' },
        { title: 'Monthly Expenses', value: `₹${(stats?.monthlyExpenses || 0).toLocaleString()}`, icon: <TrendingDown size={22} />, color: '#ef4444' },
        { title: 'Monthly Profit', value: `₹${(stats?.monthlyProfit || 0).toLocaleString()}`, icon: <TrendingUp size={22} />, color: '#10b981' },
    ] : [
        { title: 'Active Members', value: activeLiveSessions.length, icon: <CheckCircle2 size={22} />, color: 'var(--success-color)' },
        { title: 'Total Check-Ins Today', value: (stats?.todayAttendanceCount || 0) + (stats?.todaySessionsCount || 0), icon: <CheckCircle2 size={22} />, color: 'var(--warning-color)' },
    ];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div className="page-header-left">
                    <h2>{activeDivision === 'h4' ? 'Gym CRM Dashboard' : 'Partner Dashboard'}</h2>
                    <p>
                        {activeDivision === 'h4'
                            ? `Welcome back, ${user?.name || 'Admin'}. Overall analysis across ${selectedBranchId ? 'the selected branch' : 'all branches'}.`
                            : `Welcome back, ${user?.name || 'Partner'}. Here's the activity at your gym today.`
                        }
                    </p>
                </div>
                {(user?.role === 'admin' || user?.role === 'superadmin') && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => setShowQR(true)} className="btn btn-secondary">
                            <QrCode size={18} /> Print Check-In QR
                        </button>
                    </div>
                )}
            </div>

            {/* QR Code Modal */}
            {showQR && (
                <div className="modal-overlay" onClick={() => setShowQR(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '350px' }}>
                        <h3>{user?.name}'s Gym</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Print this QR code and place it at the front desk. Members will scan it using their mobile app to check in.
                        </p>
                        <div style={{ background: '#fff', padding: '1.5rem', display: 'inline-block', borderRadius: '12px' }}>
                            <QRCodeCanvas 
                                value={JSON.stringify({ gymId: user?.gymId, gymName: user?.name || 'Partner Gym' })}
                                size={220}
                                level="H"
                            />
                        </div>
                        <div style={{ marginTop: '2rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowQR(false)} style={{ width: '100%' }}>
                                Close
                            </button>
                        </div>
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

            {activeDivision === 'h4' && (
                <>
                    <div className="charts-grid" style={{ marginBottom: '2.5rem', marginTop: '2.5rem' }}>
                        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ marginBottom: '2rem' }}>Monthly Revenue Analytics</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={formatTrendData(stats?.revenueTrend)}>
                                        <defs>
                                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} dx={-10} />
                                        <Tooltip
                                            cursor={{ stroke: 'var(--primary-color)', strokeWidth: 1 }}
                                            contentStyle={{
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border)',
                                                boxShadow: 'var(--shadow-lg)',
                                                background: 'var(--bg-secondary)',
                                                padding: '12px'
                                            }}
                                            itemStyle={{ color: 'var(--primary-color)', fontWeight: 700 }}
                                            formatter={(value) => [`₹${value}`, 'Revenue']}
                                        />
                                        <Area type="monotone" dataKey="amount" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
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

                    <div className="charts-grid" style={{ marginBottom: '2.5rem' }}>
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
                    </div>
                </>
            )}

            <div className="charts-grid" style={{ marginTop: '2.5rem' }}>
                {activeLiveSessions.length > 0 && (
                    <div className="card" style={{ gridColumn: '1 / -1', marginBottom: '1.5rem', border: '2px solid var(--primary-color)', borderRadius: 'var(--radius-lg)', background: 'var(--bg)' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', letterSpacing: '0.05em' }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', boxShadow: '0 0 15px var(--primary-color)', animation: 'pulse 1.5s infinite alternate' }}></div>
                            CURRENTLY ACTIVE MEMBERS (LIVE)
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Members currently working out in your gym right now.
                        </p>
                        
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Member Name</th>
                                        <th>Phone</th>
                                        <th>Time Left</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeLiveSessions.map(session => (
                                        <tr key={session.id}>
                                            <td style={{ fontWeight: 600 }}>{session.memberName}</td>
                                            <td>{session.memberPhone}</td>
                                            <td><LiveSessionTimer expiresAt={session.expiresAt} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Recent Check-ins (This Month)</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        History of members who have visited your gym recently.
                    </p>
                    
                    {recentCheckins.length > 0 ? (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Member Name</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentCheckins.map(checkin => (
                                        <tr key={checkin.id}>
                                            <td style={{ fontWeight: 600 }}>{checkin.memberName}</td>
                                            <td>{new Date(checkin.date).toLocaleDateString()}</td>
                                            <td>{checkin.checkInTime}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📝</div>
                            <h3>No Recent Activity</h3>
                            <p>No members have checked in this month yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
