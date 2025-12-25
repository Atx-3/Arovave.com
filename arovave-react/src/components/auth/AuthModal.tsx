import { useState, useRef, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context';
import { countries } from '../../data';

interface AuthModalProps {
    onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
    const { login } = useAuth();
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        country: 'United States',
        phone: ''
    });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (step > 1 && timer > 0) {
            const interval = setInterval(() => setTimer(t => t - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [step, timer]);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
        setTimer(30);
    };

    const handleEmailOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.join('').length !== 6) return;

        if (mode === 'signin') {
            // Sign in complete after email OTP
            login(formData);
            onClose();
        } else {
            // Sign up needs phone OTP too
            setStep(3);
            setOtp(['', '', '', '', '', '']);
            setTimer(30);
        }
    };

    const handlePhoneOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.join('').length !== 6) return;
        login(formData);
        onClose();
    };

    return (
        <div className="modal-overlay fixed inset-0" onClick={onClose}>
            <div className="bg-white p-10 rounded-[40px] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <button onClick={() => setStep(step - 1)} className="p-2 hover:bg-zinc-100 rounded-lg">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <h2 className="text-2xl font-black uppercase tracking-tighter">
                            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Indicator (signup only) */}
                {mode === 'signup' && (
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${s <= step ? 'bg-black' : 'bg-zinc-200'}`} />
                                {s < 3 && <div className="w-8 h-0.5 bg-zinc-200" />}
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 1: User Details */}
                {step === 1 && (
                    <form onSubmit={handleStep1} className="space-y-5">
                        {mode === 'signup' && (
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                    placeholder="John Smith"
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                placeholder="john@company.com"
                            />
                        </div>
                        {mode === 'signup' && (
                            <>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Country</label>
                                    <select
                                        value={formData.country}
                                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none bg-white"
                                    >
                                        {countries.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                            </>
                        )}
                        <button
                            type="submit"
                            className="w-full py-5 bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                            Continue
                        </button>
                        <p className="text-center text-sm text-zinc-500">
                            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                            <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="font-bold text-black">
                                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </form>
                )}

                {/* Step 2: Email OTP */}
                {step === 2 && (
                    <form onSubmit={handleEmailOtp} className="space-y-6">
                        <div className="text-center mb-6">
                            <h3 className="font-bold mb-2">Verify your email</h3>
                            <p className="text-sm text-zinc-500">We sent a 6-digit code to {formData.email}</p>
                        </div>
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { otpRefs.current[i] = el; }}
                                    type="text"
                                    value={digit}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    maxLength={1}
                                    className="otp-input"
                                />
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={otp.join('').length !== 6}
                            className="w-full py-5 bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-800 transition-colors disabled:bg-zinc-300"
                        >
                            Verify
                        </button>
                        <p className="text-center text-sm text-zinc-400">
                            {timer > 0 ? `Resend in ${timer}s` : <button type="button" onClick={() => setTimer(30)} className="text-black font-bold">Resend Code</button>}
                        </p>
                    </form>
                )}

                {/* Step 3: Phone OTP (signup only) */}
                {step === 3 && mode === 'signup' && (
                    <form onSubmit={handlePhoneOtp} className="space-y-6">
                        <div className="text-center mb-6">
                            <h3 className="font-bold mb-2">Verify your phone</h3>
                            <p className="text-sm text-zinc-500">We sent a 6-digit code to {formData.phone}</p>
                        </div>
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { otpRefs.current[i] = el; }}
                                    type="text"
                                    value={digit}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    maxLength={1}
                                    className="otp-input"
                                />
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={otp.join('').length !== 6}
                            className="w-full py-5 bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-800 transition-colors disabled:bg-zinc-300"
                        >
                            Complete Sign Up
                        </button>
                        <p className="text-center text-sm text-zinc-400">
                            {timer > 0 ? `Resend in ${timer}s` : <button type="button" onClick={() => setTimer(30)} className="text-black font-bold">Resend Code</button>}
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
