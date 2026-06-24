import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats } from '../../services/apiService';
import { AuthContext } from '../../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { Users, CheckCircle2, AlertTriangle, Clock, Sparkles, IndianRupee, TrendingDown, TrendingUp } from 'lucide-react';

function SuperAdminDashboard() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const statsData = await getStats();
                setStats(statsData);
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
        { title: 'Expiring Soon', value: stats?.expiringSoonCount || 0, icon: <Clock size={22} />, color: '#f59e0b' },
        { title: 'New This Month', value: stats?.newMembersThisMonth || 0, icon: <Sparkles size={22} />, color: 'var(--accent-color)' },
        { title: 'Global Revenue', value: `₹${stats?.monthlyRevenue || 0}`, icon: <IndianRupee size={22} />, color: '#34d399' },
        { title: 'Global Expenses', value: `₹${stats?.monthlyExpenses || 0}`, icon: <TrendingDown size={22} />, color: '#ef4444' },
        { title: 'Global Profit', value: `₹${stats?.monthlyProfit || 0}`, icon: <TrendingUp size={22} />, color: 'var(--success-color)' },
    ];

    const COLORS = ['var(--primary)', 'var(--accent)', '#a855f7', '#d946ef', '#f43f5e'];

    return (
        <div className="fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <h2>Super Admin Dashboard</h2>
                    <p>Welcome, {user?.name || 'Master Admin'}. Here is the global platform overview.</p>
                </div>
            </header>

            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card" onClick={() => navigate('/superadmin/gyms')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}>
                        <i className="fas fa-dumbbell"></i>
                    </div>
                    <div className="stat-details">
                        <h3>Partner Gyms</h3>
                        <p className="stat-number">Manage</p>
                    </div>
                </div>

                <div className="stat-card" onClick={() => navigate('/superadmin/plans')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
                        <i className="fas fa-tags"></i>
                    </div>
                    <div className="stat-details">
                        <h3>Fit-Prime Plans</h3>
                        <p className="stat-number">Manage</p>
                    </div>
                </div>
            </div>

            <h3 style={{ marginBottom: '1.5rem' }}>Global System Statistics</h3>
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

            <div className="charts-grid" style={{ marginBottom: '2.5rem', marginTop: '2.5rem' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '2rem' }}>Global Revenue Analytics</h3>
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
                    <h3 style={{ marginBottom: '2rem' }}>Global Plan Performance</h3>
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
                    <h3 style={{ marginBottom: '2rem' }}>Global Collections by Method</h3>
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
        </div>
    );
}

export default SuperAdminDashboard;
