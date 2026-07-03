import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import API from '../services/api';
import {
    LayoutDashboard, Users, ShieldCheck, Calendar, IndianRupee,
    UserCheck, Clock, Building2, History, ChevronRight,
    ChevronLeft, LogOut, Target, Package, Banknote,
    AlertTriangle, Receipt, CalendarCheck, Snowflake, LineChart, FileText, Home, Dumbbell, Image, Wrench, Zap
} from 'lucide-react';

const NAV_GROUPS = {
    superadmin: [
        {
            label: 'Global Overview',
            items: [
                { name: 'Dashboard', path: '/superadmin/dashboard', icon: LayoutDashboard },
            ]
        },
        {
            label: 'Management',
            items: [
                { name: 'Partner Gyms', path: '/superadmin/gyms', icon: Building2 },
                { name: 'Fit-Prime Plans', path: '/superadmin/plans', icon: Package },
                { name: 'Members Directory', path: '/members', icon: Users },
            ]
        },
        {
            label: 'System',
            items: [
                { name: 'Audit Logs', path: '/audit', icon: History },
            ]
        }
    ],
    admin: [
        {
            label: 'Gym Management',
            items: [
                { name: 'Gym Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: 'Gym Profile', path: '/profile', icon: Image },
                { name: 'Members', path: '/members', icon: Users },
                { name: 'Leads', path: '/leads', icon: Target },
                { name: 'Plans', path: '/plans', icon: Package },
                { name: 'Classes', path: '/classes', icon: Dumbbell },
                { name: 'Assessments', path: '/body-assessments', icon: LineChart },
                { name: 'Equipments', path: '/equipments', icon: Wrench },
                { name: 'Staff', path: '/staff', icon: ShieldCheck },
                { name: 'Branches', path: '/branches', icon: Building2 },
            ]
        },
        {
            label: 'Gym Ops & Finance',
            items: [
                { name: 'Payments', path: '/payments', icon: IndianRupee },
                { name: 'Expenses', path: '/expenses', icon: IndianRupee },
                { name: 'Pending Dues', path: '/dues', icon: Clock },
                { name: 'Attendance', path: '/attendance', icon: UserCheck },
                { name: 'Trainer Attendance', path: '/trainer-attendance', icon: CalendarCheck },
                { name: 'Payroll', path: '/payroll', icon: Banknote },
            ]
        },
        {
            label: 'Gym System & Reports',
            items: [
                { name: 'Reports', path: '/reports', icon: FileText },
                { name: 'Freeze System', path: '/freeze', icon: Snowflake },
                { name: 'Analytics', path: '/analytics', icon: LineChart },
                { name: 'FitPass Reports', path: '/fitpass-analytics', icon: Zap },
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
                { name: 'Equipments', path: '/equipments', icon: Wrench },
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
                { name: 'Assessments', path: '/body-assessments', icon: LineChart },
                { name: 'Check In/Out', path: '/trainer-attendance', icon: Clock },
                { name: 'My Payroll', path: '/payroll', icon: Banknote },
                { name: 'Equipments', path: '/equipments', icon: Wrench },
            ]
        }
    ],
    member: [
        {
            label: 'My Portal',
            items: [
                { name: 'Dashboard', path: '/member-dashboard', icon: Home },
                { name: 'My InBody', path: '/body-assessments', icon: LineChart },
                { name: 'Classes', path: '/member-classes', icon: Dumbbell },
            ]
        }
    ]
};

const Sidebar = () => {
    const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar();
    const { user, logout, selectedGymId, changeSelectedGym, activeDivision, changeActiveDivision, selectedBranchId } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    const role = user?.role || 'member';

    const handleDivisionChange = async (division) => {
        changeActiveDivision(division);
        if (division === 'fitpass') {
            navigate('/superadmin/dashboard');
        } else {
            try {
                // Fetch or automatically initialize the H4 gym context
                const { data } = await API.get('/superadmin/h4-gym');
                if (data) {
                    const h4GymId = data._id || data.id;
                    changeSelectedGym(h4GymId);
                    navigate('/dashboard');
                    window.location.reload();
                } else {
                    navigate('/superadmin/gyms');
                }
            } catch (err) {
                console.error('Failed to get or create H4 gym:', err);
                navigate('/superadmin/gyms');
            }
        }
    };

    let groups = [];
    if (role === 'superadmin') {
        const hasSelectedGym = !!selectedGymId;
        if (activeDivision === 'fitpass') {
            groups = [
                {
                    label: 'Global Overview',
                    items: [
                        { name: 'Dashboard', path: '/superadmin/dashboard', icon: LayoutDashboard },
                    ]
                },
                {
                    label: 'Management for Fit Pass',
                    items: [
                        { name: 'Partner Gyms', path: '/superadmin/gyms', icon: Building2 },
                        { name: 'Fit-Prime Plans', path: '/superadmin/plans', icon: Package },
                        { name: 'FitPass Reports', path: '/superadmin/fitpass-analytics', icon: Zap },
                    ]
                },
                {
                    label: 'System',
                    items: [
                        { name: 'Audit Logs', path: '/audit', icon: History },
                    ]
                }
            ];
        } else {
            // H4 division
            if (hasSelectedGym) {
                const suffix = !selectedBranchId ? ' of all branches' : '';
                
                const gymMgmtItems = [
                    { name: `Gym Dashboard${suffix}`, path: '/dashboard', icon: LayoutDashboard },
                    { name: `Gym Profile${suffix}`, path: '/profile', icon: Image },
                    { name: `Members${suffix}`, path: '/members', icon: Users },
                    { name: `Leads${suffix}`, path: '/leads', icon: Target },
                    { name: `Plans${suffix}`, path: '/plans', icon: Package },
                    { name: `Classes${suffix}`, path: '/classes', icon: Dumbbell },
                    { name: `Assessments${suffix}`, path: '/body-assessments', icon: LineChart },
                    { name: `Equipments${suffix}`, path: '/equipments', icon: Wrench },
                    { name: `Staff${suffix}`, path: '/staff', icon: ShieldCheck },
                ];

                // H4 has overall branch management, H5 (sub-branch) does not
                if (!selectedBranchId) {
                    gymMgmtItems.push({ name: 'Branches', path: '/branches', icon: Building2 });
                }

                groups = [
                    {
                        label: 'Gym Management',
                        items: gymMgmtItems
                    },
                    {
                        label: 'Gym Ops & Finance',
                        items: [
                            { name: `Payments${suffix}`, path: '/payments', icon: IndianRupee },
                            { name: `Expenses${suffix}`, path: '/expenses', icon: IndianRupee },
                            { name: `Pending Dues${suffix}`, path: '/dues', icon: Clock },
                            { name: `Attendance${suffix}`, path: '/attendance', icon: UserCheck },
                            { name: `Trainer Attendance${suffix}`, path: '/trainer-attendance', icon: CalendarCheck },
                            { name: `Payroll${suffix}`, path: '/payroll', icon: Banknote },
                        ]
                    },
                    {
                        label: 'Gym System & Reports',
                        items: [
                            { name: `Reports${suffix}`, path: '/reports', icon: FileText },
                            { name: `Freeze System${suffix}`, path: '/freeze', icon: Snowflake },
                            { name: `Analytics${suffix}`, path: '/analytics', icon: LineChart },
                            { name: `FitPass Reports${suffix}`, path: '/fitpass-analytics', icon: Zap },
                        ]
                    }
                ];
            } else {
                groups = [
                    {
                        label: 'H4 Gym Management',
                        items: [
                            { name: 'Select Partner Gym', path: '/superadmin/gyms', icon: Building2 },
                        ]
                    }
                ];
            }
        }
    } else {
        groups = NAV_GROUPS[role] || NAV_GROUPS.member;
    }

    const isActive = (path) => location.pathname === path;

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">G</div>
                {!collapsed && <span className="sidebar-logo-text">GYM CRM PRO</span>}
            </div>

            {role === 'superadmin' && (
                <div className="sidebar-division-switcher" style={{ padding: '0 0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <button
                            onClick={() => handleDivisionChange('fitpass')}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '0.5rem 0.25rem',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                borderRadius: 'var(--radius-sm)',
                                textTransform: 'uppercase',
                                color: activeDivision === 'fitpass' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                                background: activeDivision === 'fitpass' ? 'var(--primary)' : 'transparent',
                                transition: 'var(--transition)',
                            }}
                            title="Management for Fit Pass"
                        >
                            <Zap size={13} />
                            {!collapsed && <span>FitPass</span>}
                        </button>
                        <button
                            onClick={() => handleDivisionChange('h4')}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '0.5rem 0.25rem',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                borderRadius: 'var(--radius-sm)',
                                textTransform: 'uppercase',
                                color: activeDivision === 'h4' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                                background: activeDivision === 'h4' ? 'var(--primary)' : 'transparent',
                                transition: 'var(--transition)',
                            }}
                            title="H4 Gym Management"
                        >
                            <Building2 size={13} />
                            {!collapsed && <span>H4</span>}
                        </button>
                    </div>
                </div>
            )}

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
