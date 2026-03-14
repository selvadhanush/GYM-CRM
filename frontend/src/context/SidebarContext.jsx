import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext({ collapsed: false, mobileOpen: false });
export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggle = () => setCollapsed(c => !c);
    const toggleMobile = () => setMobileOpen(m => !m);
    const closeMobile = () => setMobileOpen(false);

    return (
        <SidebarContext.Provider value={{ collapsed, toggle, mobileOpen, toggleMobile, closeMobile }}>
            {children}
        </SidebarContext.Provider>
    );
};

