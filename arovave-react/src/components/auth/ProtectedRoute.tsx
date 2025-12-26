import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'superadmin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, isAdmin, isSuperAdmin, currentUser } = useAuth();
    const location = useLocation();

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    // Not authenticated - redirect to home
    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Check role requirements
    if (requiredRole === 'superadmin' && !isSuperAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6">
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Access Denied</h1>
                <p className="text-zinc-500 mb-8">You need Super Admin privileges to access this page.</p>
                <a href="/" className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm uppercase tracking-widest">
                    Go Home
                </a>
            </div>
        );
    }

    if (requiredRole === 'admin' && !isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6">
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Access Denied</h1>
                <p className="text-zinc-500 mb-8">You need Admin privileges to access this page.</p>
                <a href="/" className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm uppercase tracking-widest">
                    Go Home
                </a>
            </div>
        );
    }

    return <>{children}</>;
}
