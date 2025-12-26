export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    country: string;
    role: 'user' | 'admin' | 'superadmin';
    joined?: string;
}
