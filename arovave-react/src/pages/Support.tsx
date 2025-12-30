import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Send, Clock, CheckCircle, AlertCircle, Loader2, Plus, ChevronRight } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context';
import { supabase } from '../lib/supabase';

type SupportTicket = {
    id: string;
    problem_type: string;
    subject: string;
    status: string;
    created_at: string;
    updated_at: string;
};

type SupportMessage = {
    id: string;
    ticket_id: string;
    sender_type: 'user' | 'admin';
    sender_name: string;
    message: string;
    created_at: string;
};

const problemTypes = [
    { id: 'account', label: 'Account Issues' },
    { id: 'order', label: 'Order & Shipping' },
    { id: 'product', label: 'Product Questions' },
    { id: 'technical', label: 'Technical Problems' },
    { id: 'other', label: 'Other' }
];

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
    open: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Open' },
    in_progress: { color: 'bg-blue-100 text-blue-700', icon: Loader2, label: 'In Progress' },
    resolved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Resolved' },
    closed: { color: 'bg-zinc-100 text-zinc-600', icon: AlertCircle, label: 'Closed' }
};

export function Support() {
    const { isAuthenticated, currentUser, supabaseUser } = useAuth();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [sending, setSending] = useState(false);

    // New ticket form
    const [newTicket, setNewTicket] = useState({
        problem_type: '',
        subject: '',
        message: ''
    });

    // Reply message
    const [replyMessage, setReplyMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (isAuthenticated) {
            loadTickets();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (selectedTicket) {
            loadMessages(selectedTicket.id);
        }
    }, [selectedTicket]);

    const loadTickets = async () => {
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setTickets(data);
            }
        } catch (err) {
            console.error('Error loading tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (ticketId: string) => {
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setMessages(data);
            }
        } catch (err) {
            console.error('Error loading messages:', err);
        }
    };

    const handleCreateTicket = async () => {
        if (!newTicket.problem_type || !newTicket.subject || !newTicket.message) return;

        setSending(true);
        try {
            // Create ticket
            const { data: ticketData, error: ticketError } = await supabase
                .from('support_tickets')
                .insert({
                    user_id: supabaseUser?.id,
                    user_email: currentUser?.email || supabaseUser?.email,
                    user_name: currentUser?.name || supabaseUser?.user_metadata?.name || 'User',
                    problem_type: newTicket.problem_type,
                    subject: newTicket.subject,
                    status: 'open'
                })
                .select()
                .single();

            if (ticketError) throw ticketError;

            // Create initial message
            if (ticketData) {
                await supabase.from('support_messages').insert({
                    ticket_id: ticketData.id,
                    sender_type: 'user',
                    sender_name: currentUser?.name || supabaseUser?.user_metadata?.name || 'User',
                    message: newTicket.message
                });
            }

            // Reset and refresh
            setNewTicket({ problem_type: '', subject: '', message: '' });
            setShowNewTicket(false);
            await loadTickets();
            if (ticketData) {
                setSelectedTicket(ticketData);
            }
        } catch (err) {
            console.error('Error creating ticket:', err);
            alert('Failed to create ticket. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim() || !selectedTicket) return;

        setSending(true);
        try {
            await supabase.from('support_messages').insert({
                ticket_id: selectedTicket.id,
                sender_type: 'user',
                sender_name: currentUser?.name || supabaseUser?.user_metadata?.name || 'User',
                message: replyMessage
            });

            // Update ticket timestamp
            await supabase
                .from('support_tickets')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', selectedTicket.id);

            setReplyMessage('');
            await loadMessages(selectedTicket.id);
        } catch (err) {
            console.error('Error sending reply:', err);
        } finally {
            setSending(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="page-enter max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">Help & Support</h1>
                <div className="bg-zinc-50 rounded-3xl p-16 text-center">
                    <p className="text-zinc-400 text-lg mb-6">Please sign in to access support.</p>
                    <Link
                        to="/auth"
                        className="inline-block px-8 py-4 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white">
            {/* Hero */}
            <div className="bg-black text-white py-12">
                <div className="max-w-5xl mx-auto px-6">
                    <Link to="/profile" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile
                    </Link>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center">
                            <MessageCircle className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight">Help & Support</h1>
                            <p className="text-zinc-400">We're here to help you</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* New Ticket Button */}
                {!showNewTicket && !selectedTicket && (
                    <button
                        onClick={() => setShowNewTicket(true)}
                        className="w-full mb-8 flex items-center justify-center gap-3 p-6 bg-black text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Support Ticket
                    </button>
                )}

                {/* New Ticket Form */}
                {showNewTicket && (
                    <div className="bg-white border-2 border-zinc-100 rounded-3xl p-4 md:p-8 mb-6 md:mb-8">
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">New Support Ticket</h2>
                            <button onClick={() => setShowNewTicket(false)} className="text-zinc-400 hover:text-black p-1">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 md:space-y-6">
                            <div>
                                <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">Problem Type *</label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {problemTypes.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setNewTicket(prev => ({ ...prev, problem_type: type.id }))}
                                            className={`px-2 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-colors ${newTicket.problem_type === type.id
                                                ? 'bg-black text-white'
                                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">Subject *</label>
                                <input
                                    type="text"
                                    value={newTicket.subject}
                                    onChange={e => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                                    placeholder="Brief description of your issue"
                                    className="w-full px-3 md:px-4 py-2.5 md:py-3 border-2 border-zinc-200 rounded-xl font-semibold text-sm focus:border-black focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">Describe Your Issue *</label>
                                <textarea
                                    value={newTicket.message}
                                    onChange={e => setNewTicket(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Please provide details about your problem..."
                                    rows={4}
                                    className="w-full px-3 md:px-4 py-2.5 md:py-3 border-2 border-zinc-200 rounded-xl font-semibold text-sm focus:border-black focus:outline-none resize-none"
                                />
                            </div>

                            <button
                                onClick={handleCreateTicket}
                                disabled={sending || !newTicket.problem_type || !newTicket.subject || !newTicket.message}
                                className="w-full flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-black text-white font-bold text-xs md:text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                {sending ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Send className="w-4 h-4 md:w-5 md:h-5" />}
                                {sending ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Ticket Detail / Chat View */}
                {selectedTicket && (
                    <div className="bg-white border-2 border-zinc-100 rounded-3xl overflow-hidden mb-8">
                        {/* Ticket Header */}
                        <div className="p-4 md:p-6 border-b border-zinc-100">
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="text-sm text-zinc-400 hover:text-black mb-4 flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Tickets
                            </button>
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg md:text-xl font-black mb-1 break-words">{selectedTicket.subject}</h2>
                                    <p className="text-xs md:text-sm text-zinc-400 break-words">
                                        {problemTypes.find(t => t.id === selectedTicket.problem_type)?.label} • Created {new Date(selectedTicket.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`self-start px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase whitespace-nowrap ${statusConfig[selectedTicket.status]?.color}`}>
                                    {statusConfig[selectedTicket.status]?.label}
                                </span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            ref={chatContainerRef}
                            onWheel={(e) => {
                                e.stopPropagation();
                                const container = chatContainerRef.current;
                                if (container) {
                                    container.scrollTop += e.deltaY;
                                }
                            }}
                            className="p-4 md:p-6 h-[50vh] md:h-[60vh] max-h-[500px] min-h-[200px] overflow-y-scroll overscroll-contain space-y-3 md:space-y-4 bg-zinc-50"
                        >
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-3 md:p-4 ${msg.sender_type === 'user'
                                        ? 'bg-black text-white'
                                        : 'bg-white border-2 border-zinc-200'
                                        }`}>
                                        <p className={`text-[10px] md:text-xs font-bold mb-1 truncate ${msg.sender_type === 'user' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                            {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="leading-relaxed whitespace-pre-wrap break-words text-sm md:text-base">{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && (
                                <p className="text-center text-zinc-400 py-8">No messages yet.</p>
                            )}
                        </div>

                        {/* Reply Input */}
                        {selectedTicket.status !== 'closed' && (
                            <div className="p-3 md:p-4 border-t border-zinc-100 flex gap-2 md:gap-3">
                                <input
                                    type="text"
                                    value={replyMessage}
                                    onChange={e => setReplyMessage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                                    placeholder="Type your message..."
                                    className="flex-1 min-w-0 px-3 md:px-4 py-2.5 md:py-3 border-2 border-zinc-200 rounded-xl font-semibold text-sm focus:border-black focus:outline-none"
                                />
                                <button
                                    onClick={handleSendReply}
                                    disabled={sending || !replyMessage.trim()}
                                    className="px-4 md:px-6 py-2.5 md:py-3 bg-black text-white rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 flex-shrink-0"
                                >
                                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Tickets List */}
                {!showNewTicket && !selectedTicket && (
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight mb-4">Your Tickets</h2>
                        {loading ? (
                            <div className="text-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-400" />
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="bg-zinc-50 rounded-3xl p-12 text-center">
                                <MessageCircle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                                <p className="text-zinc-400">No support tickets yet.</p>
                                <p className="text-sm text-zinc-400 mt-2">Create one if you need help!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tickets.map(ticket => {
                                    const StatusIcon = statusConfig[ticket.status]?.icon || Clock;
                                    return (
                                        <button
                                            key={ticket.id}
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="w-full flex items-center justify-between p-5 bg-white border-2 border-zinc-100 rounded-2xl hover:border-black transition-colors text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusConfig[ticket.status]?.color}`}>
                                                    <StatusIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold">{ticket.subject}</h3>
                                                    <p className="text-sm text-zinc-400">
                                                        {problemTypes.find(t => t.id === ticket.problem_type)?.label} • {new Date(ticket.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-black transition-colors" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
