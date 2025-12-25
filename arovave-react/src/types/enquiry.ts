import type { User } from './user';

export interface EnquiryProduct {
    id: number;
    name: string;
    qty?: string;
}

export interface Enquiry {
    id: number;
    user: User;
    products: EnquiryProduct[];
    date: string;
    status: 'pending' | 'contacted' | 'completed' | 'cancelled';
}
