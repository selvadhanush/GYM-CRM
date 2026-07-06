import { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedGymId, setSelectedGymId] = useState(() => {
        return localStorage.getItem('selectedGymId') || '';
    });
    const [selectedBranchId, setSelectedBranchId] = useState(() => {
        return localStorage.getItem('selectedBranchId') || '';
    });
    const [activeDivision, setActiveDivision] = useState(() => {
        return localStorage.getItem('activeDivision') || 'fitpass';
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            let division = localStorage.getItem('activeDivision');
            if (parsedUser.role === 'h4_admin' || (parsedUser.gymName && parsedUser.gymName.toUpperCase() === 'H4') || parsedUser.gymId === '05a08fdf-7427-48a5-8b25-e18d5a5668cd') {
                division = 'h4';
            } else if (parsedUser.role === 'fitpass_admin') {
                division = 'fitpass';
            }
            if (division) {
                localStorage.setItem('activeDivision', division);
                setActiveDivision(division);
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await API.post('/auth/login', { email, password });
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            
            let division = localStorage.getItem('activeDivision') || 'fitpass';
            if (data.role === 'h4_admin' || (data.gymName && data.gymName.toUpperCase() === 'H4') || data.gymId === '05a08fdf-7427-48a5-8b25-e18d5a5668cd') {
                division = 'h4';
            } else if (data.role === 'fitpass_admin') {
                division = 'fitpass';
            }
            localStorage.setItem('activeDivision', division);
            setActiveDivision(division);

            if (data.gymId) {
                localStorage.setItem('selectedGymId', data.gymId);
                setSelectedGymId(data.gymId);
            } else {
                localStorage.removeItem('selectedGymId');
                setSelectedGymId('');
            }
            if (data.branchId) {
                localStorage.setItem('selectedBranchId', data.branchId);
                setSelectedBranchId(data.branchId);
            } else {
                localStorage.removeItem('selectedBranchId');
                setSelectedBranchId('');
            }
            return { success: true, user: data };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };
 
    const register = async (name, email, password, gymName) => {
        try {
            const { data } = await API.post('/auth/register', { name, email, password, gymName });
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            if (data.gymId) {
                localStorage.setItem('selectedGymId', data.gymId);
                setSelectedGymId(data.gymId);
            }
            if (data.branchId) {
                localStorage.setItem('selectedBranchId', data.branchId);
                setSelectedBranchId(data.branchId);
            } else {
                localStorage.removeItem('selectedBranchId');
                setSelectedBranchId('');
            }
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        setUser(null);
        setSelectedGymId('');
        setSelectedBranchId('');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('selectedGymId');
        localStorage.removeItem('selectedBranchId');
    };

    const changeSelectedGym = (gymId) => {
        setSelectedGymId(gymId);
        if (gymId) {
            localStorage.setItem('selectedGymId', gymId);
        } else {
            localStorage.removeItem('selectedGymId');
        }
    };

    const changeSelectedBranch = (branchId) => {
        setSelectedBranchId(branchId);
        if (branchId) {
            localStorage.setItem('selectedBranchId', branchId);
        } else {
            localStorage.removeItem('selectedBranchId');
        }
    };

    const changeActiveDivision = (division) => {
        setActiveDivision(division);
        localStorage.setItem('activeDivision', division);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login, 
            register, 
            logout, 
            selectedGymId, 
            changeSelectedGym, 
            selectedBranchId,
            changeSelectedBranch,
            activeDivision, 
            changeActiveDivision 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
