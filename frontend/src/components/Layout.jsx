import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';

const Layout = ({ children }) => {
    const { mobileOpen, closeMobile } = useSidebar();
    const [isDark, setIsDark] = useState(() => {
        return localStorage.getItem('gymcrm-theme') === 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('gymcrm-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    return (
        <div className="app-container">
            <Sidebar />
            <div
                className={`mobile-overlay ${mobileOpen ? 'active' : ''}`}
                onClick={closeMobile}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <AppHeader
                    isDark={isDark}
                    onThemeToggle={() => setIsDark(d => !d)}
                />
                <main className="main-content fade-in">
                    <div className="page-content">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

const LayoutWithProvider = ({ children }) => (
    <SidebarProvider>
        <Layout>{children}</Layout>
    </SidebarProvider>
);

export default LayoutWithProvider;

