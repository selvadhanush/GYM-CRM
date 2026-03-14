import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import {
    LayoutDashboard, Users, ShieldCheck, Calendar, IndianRupee,
    UserCheck, Clock, Building2, History, ChevronRight,
    ChevronLeft, LogOut, Target, Package, Banknote,
    AlertTriangle, Receipt, CalendarCheck, Snowflake, LineChart, FileText, Home, Dumbbell
} from 'lucide-react';

const NAV_GROUPS = {
    admin: [
        {
            label: 'Overview',
            items: [
                { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: 'Analytics', path: '/analytics', icon: LineChart },
            ]
        },
        {
            label: 'Management',
            items: [
                { name: 'Members', path: '/members', icon: Users },
                { name: 'Leads', path: '/leads', icon: Target },
                { name: 'Plans', path: '/plans', icon: Package },
                { name: 'Classes', path: '/classes', icon: Dumbbell },
            ]
        },
        {
            label: 'Ops & Finance',
            items: [
                { name: 'Payments', path: '/payments', icon: IndianRupee },
                { name: 'Attendance', path: '/attendance', icon: UserCheck },
                { name: 'Pending Dues', path: '/dues', icon: Clock },
            ]
        },
        {
            label: 'System',
            items: [
                { name: 'Branches', path: '/branches', icon: Building2 },
                { name: 'Audit Logs', path: '/audit', icon: History },
            ]
        }
    ],
    receptionist: [
        {
            label: 'Management',
            items: [
                { name: 'Members', path: '/members', icon: Users },
                { name: 'Leads', path: '/leads', icon: Target },
                { name: 'Attendance', path: '/attendance', icon: UserCheck },
            ]
        },
        {
            label: 'Finance',
            items: [
                { name: 'Payments', path: '/payments', icon: IndianRupee },
                { name: 'Dues', path: '/dues', icon: Clock },
            ]
        }
    ],
    trainer: [
        {
            label: 'Operations',
            items: [
                { name: 'Attendance', path: '/attendance', icon: UserCheck },
                { name: 'Classes', path: '/classes', icon: Dumbbell },
            ]
        }
    ],
    member: [
        {
            label: 'My Portal',
            items: [
                { name: 'Dashboard', path: '/member-dashboard', icon: Home },
                { name: 'Classes', path: '/member-classes', icon: Dumbbell },
            ]
        }
    ]
};

const Sidebar = () => {
    const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar();
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    const role = user?.role || 'member';
    const groups = NAV_GROUPS[role] || NAV_GROUPS.member;

    const isActive = (path) => location.pathname === path;

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">G</div>
                {!collapsed && <span className="sidebar-logo-text">GYM CRM PRO</span>}
            </div>

            <nav className="sidebar-nav">
                {groups.map((group, gIdx) => (
                    <div key={gIdx} className="sidebar-group">
                        {!collapsed && <div className="sidebar-group-label">{group.label}</div>}
                        {group.items.map((item, iIdx) => (
                            <Link
                                key={iIdx}
                                to={item.path}
                                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                                onClick={closeMobile}
                            >
                                <div className="nav-icon"><item.icon size={20} /></div>
                                <span className="nav-label">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>

            <button className="sidebar-collapse-btn hide-mobile" onClick={toggle}>
                {collapsed ? <ChevronRight size={18} /> : (
                    <>
                        <ChevronLeft size={18} />
                        <span>Collapse Menu</span>
                    </>
                )}
            </button>

            <div className="sidebar-footer">
                <div className="sidebar-user" onClick={logout} title="Click to Sign Out">
                    <div className="user-avatar">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    {!collapsed && (
                        <>
                            <div className="user-info" style={{ overflow: 'hidden' }}>
                                <div className="user-name" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {user?.name || 'User'}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Logout</div>
                            </div>
                            <LogOut size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
