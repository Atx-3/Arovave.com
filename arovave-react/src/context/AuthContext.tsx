import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
    currentUser: User | null;
    login: (user: User) => void;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        // Load user from localStorage on mount
        const savedUser = localStorage.getItem('arovaveUser');
        if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
        }
    }, []);

    const login = (user: User) => {
        const userWithDate = { ...user, joined: new Date().toISOString().split('T')[0] };
        setCurrentUser(userWithDate);
        localStorage.setItem('arovaveUser', JSON.stringify(userWithDate));
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('arovaveUser');
    };

    const updateProfile = (data: Partial<User>) => {
        if (currentUser) {
            const updated = { ...currentUser, ...data };
            setCurrentUser(updated);
            localStorage.setItem('arovaveUser', JSON.stringify(updated));
        }
    };

    return (
        <AuthContext.Provider value={{
            currentUser,
            login,
            logout,
            updateProfile,
            isAuthenticated: !!currentUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
