import { useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { Search, Sun, Moon, Bell, Menu, ChevronDown, X, User } from 'lucide-react';
import API from '../services/api';

const PAGE_TITLES = {
    '/dashboard': 'Dashboard Overview',
    '/members': 'Member Directory',
    '/plans': 'Membership Plans',
    '/payments': 'Financial Transactions',
    '/attendance': 'Attendance Logs',
    '/expenses': 'Expense Tracking',
    '/dues': 'Outstanding Dues',
    '/reports': 'Business Reports',
    '/freeze': 'Freeze Management',
    '/classes': 'Class Scheduling',
    '/analytics': 'Performance Analytics',
    '/branches': 'Multi-Branch Management',
    '/audit': 'System Audit Logs',
    '/leads': 'Sales & Leads',
    '/member-dashboard': 'My Fitness Portal',
    '/member-classes': 'My Class Schedule',
};

const AppHeader = ({ onThemeToggle, isDark }) => {
    const { user, selectedGymId, changeSelectedGym, activeDivision, selectedBranchId, changeSelectedBranch } = useContext(AuthContext);
    const { toggleMobile } = useSidebar();
    const location = useLocation();
    const navigate = useNavigate();

    // Gym/Branch list for context selectors
    const [gyms, setGyms] = useState([]);

    useEffect(() => {
        const fetchGyms = async () => {
            if (user?.role === 'superadmin') {
                try {
                    if (activeDivision === 'h4') {
                        if (!selectedGymId) return;
                        
                        // Fetch H4 gym and partner gyms to find the current gym's name
                        const [h4Res, partnerRes] = await Promise.all([
                            API.get('/superadmin/h4-gym').catch(() => ({ data: null })),
                            API.get('/superadmin/gyms').catch(() => ({ data: [] }))
                        ]);
                        
                        const allGyms = [];
                        if (h4Res.data) allGyms.push(h4Res.data);
                        if (partnerRes.data) allGyms.push(...partnerRes.data);
                        
                        const currentGym = allGyms.find(g => (g._id || g.id) === selectedGymId);
                        
                        if (currentGym) {
                            // Fetch branches for the selected gym
                            const { data: branches } = await API.get('/branches', {
                                headers: { 'x-gym-id': selectedGymId }
                            });
                            
                            const branchOptions = (branches || []).map(b => ({
                                _id: b._id || b.id,
                                name: b.name,
                                isBranch: true,
                                parentGymId: selectedGymId
                            }));
                            
                            setGyms([currentGym, ...branchOptions]);
                            
                            // Ensure selected context is valid
                            const currentBranch = localStorage.getItem('selectedBranchId');
                            if (currentBranch && !branchOptions.some(b => b._id === currentBranch)) {
                                changeSelectedBranch('');
                                window.location.reload();
                            }
                        }
                    } else {
                        // Fetch FitPass partner gyms (which excludes H4 from backend now)
                        const { data } = await API.get('/superadmin/gyms');
                        setGyms(data || []);
                    }
                } catch (err) {
                    console.error('Failed to fetch gyms for selector:', err);
                }
            } else if (user?.role === 'partner') {
                try {
                    const { data: branches } = await API.get('/branches');
                    const branchOptions = (branches || []).map(b => ({
                        _id: b._id || b.id,
                        name: b.name,
                        isBranch: true,
                        parentGymId: user.gymId
                    }));
                    setGyms(branchOptions);
                } catch (err) {
                    console.error('Failed to fetch branches for partner:', err);
                }
            }
        };
        fetchGyms();
    }, [user, activeDivision, selectedGymId]);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    // Notifications state
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const notifRef = useRef(null);

    const getPageTitle = () => PAGE_TITLES[location.pathname] || 'GYM CRM Management';

    // Search debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setSearchOpen(false);
            return;
        }

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const { data } = await API.get(`/members?search=${encodeURIComponent(searchQuery)}&limit=5`);
                const members = data.members || data || [];
                // Filter by name/phone client-side as a fallback
                const filtered = members.filter(m =>
                    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.phone?.includes(searchQuery) ||
                    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setSearchResults(filtered.slice(0, 6));
                setSearchOpen(true);
            } catch (err) {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounceRef.current);
    }, [searchQuery]);

    // Fetch notifications
    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const { data } = await API.get('/notifications');
                setNotifications(data.slice(0, 8));
                setUnreadCount(data.filter(n => !n.read).length);
            } catch { }
        };
        fetchNotifs();
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSearchSelect = (member) => {
        setSearchQuery('');
        setSearchOpen(false);
        navigate(`/members?highlight=${member._id}`);
    };

    const handleMarkRead = async (id) => {
        try {
            await API.put(`/notifications/${id}`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { }
    };

    return (
        <header className="app-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                    className="header-btn show-mobile"
                    onClick={toggleMobile}
                    aria-label="Toggle Menu"
                >
                    <Menu size={20} />
                </button>
                <h1 className="page-title">{getPageTitle()}</h1>

                {((user?.role === 'superadmin' && activeDivision === 'h4') || user?.role === 'partner') && (
                    <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {user?.role === 'partner' ? 'Active Branch:' : 'Managing Gym:'}
                        </span>
                        <select
                            className="input"
                            style={{ 
                                padding: '0.2rem 1.8rem 0.2rem 0.6rem', 
                                fontSize: '0.8rem', 
                                width: '200px', 
                                height: '32px',
                                margin: 0,
                                backgroundPosition: 'right 0.4rem center'
                            }}
                            value={selectedBranchId || (user?.role === 'partner' ? '' : selectedGymId)}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (user?.role === 'partner') {
                                    changeSelectedBranch(val);
                                } else {
                                    const selectedObj = gyms.find(g => (g._id || g.id) === val);
                                    if (selectedObj && selectedObj.isBranch) {
                                        changeSelectedGym(selectedObj.parentGymId);
                                        changeSelectedBranch(val);
                                    } else {
                                        changeSelectedGym(val);
                                        changeSelectedBranch('');
                                    }
                                }
                                // Reload page to reset data and refresh queries
                                window.location.reload();
                            }}
                        >
                            {user?.role === 'partner' ? (
                                <>
                                    <option value="">-- All Branches --</option>
                                    {gyms.map(branch => (
                                        <option key={branch._id || branch.id} value={branch._id || branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </>
                            ) : (
                                <>
                                    <option value="">-- Select a Gym --</option>
                                    {gyms.map(gym => (
                                        <option key={gym._id || gym.id} value={gym._id || gym.id}>{gym.name}</option>
                                    ))}
                                </>
                            )}
                        </select>
                    </div>
                )}
            </div>

            {/* Search Bar */}
            <div className="header-search hide-mobile" ref={searchRef} style={{ position: 'relative' }}>
                <Search className="header-search-icon" size={18} />
                <input
                    type="text"
                    className="header-search-input"
                    placeholder="Search members by name or phone..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setSearchOpen(true)}
                />
                {searchQuery && (
                    <button
                        onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                    >
                        <X size={14} />
                    </button>
                )}

                {/* Search Dropdown */}
                {searchOpen && (
                    <div style={{
                        position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%',
                        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
                        zIndex: 1000, overflow: 'hidden'
                    }}>
                        {searchLoading ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Searching...
                            </div>
                        ) : searchResults.length > 0 ? (
                            <>
                                <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
                                    Members
                                </div>
                                {searchResults.map(member => (
                                    <button
                                        key={member._id}
                                        onClick={() => handleSearchSelect(member)}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                                            textAlign: 'left', transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0
                                        }}>
                                            {member.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{member.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.phone} · {member.status}</div>
                                        </div>
                                        <span className={`badge badge-${member.status?.toLowerCase()}`} style={{ marginLeft: 'auto' }}>{member.status}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={() => { navigate(`/members?search=${encodeURIComponent(searchQuery)}`); setSearchOpen(false); setSearchQuery(''); }}
                                    style={{
                                        width: '100%', padding: '0.7rem 1rem', background: 'var(--bg-tertiary)',
                                        border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer',
                                        fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'center'
                                    }}
                                >
                                    View all results for "{searchQuery}" →
                                </button>
                            </>
                        ) : (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                No members found for "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="header-right">
                <button
                    className="header-btn"
                    onClick={onThemeToggle}
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notification Bell */}
                <div ref={notifRef} style={{ position: 'relative' }}>
                    <button
                        className="header-btn"
                        onClick={() => setNotifOpen(o => !o)}
                        style={{ position: 'relative' }}
                        title="Notifications"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '8px', right: '8px',
                                width: '8px', height: '8px',
                                background: 'var(--accent)', borderRadius: '50%',
                                border: '2px solid var(--bg-secondary)',
                                boxShadow: '0 0 8px var(--accent)'
                            }} />
                        )}
                    </button>

                    {notifOpen && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                            width: 340, background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-lg)', zIndex: 1000, overflow: 'hidden'
                        }}>
                            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                                {unreadCount > 0 && <span className="badge badge-active">{unreadCount} new</span>}
                            </div>
                            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        No notifications yet
                                    </div>
                                ) : notifications.map(n => (
                                    <div
                                        key={n._id}
                                        onClick={() => !n.read && handleMarkRead(n._id)}
                                        style={{
                                            padding: '0.9rem 1.25rem',
                                            borderBottom: '1px solid var(--border)',
                                            background: n.read ? 'transparent' : 'var(--primary-light)',
                                            cursor: n.read ? 'default' : 'pointer',
                                            transition: 'background 0.15s'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.85rem', fontWeight: n.read ? 400 : 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                                            {n.message}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            {new Date(n.createdAt).toLocaleString()} {!n.read && '· Click to mark read'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Pill */}
                <div className="user-pill">
                    <div className="user-avatar">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1 }}>
                            {user?.name || 'User'}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.02em' }}>
                            {user?.role}
                        </span>
                    </div>
                    <ChevronDown size={14} className="hide-mobile" style={{ color: 'var(--text-muted)', marginLeft: '4px' }} />
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
