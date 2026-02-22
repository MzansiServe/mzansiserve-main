import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from '../lib/api';
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpeg";

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please fill in both fields.');
            return;
        }

        setLoading(true);
        try {
            const result = await apiFetch('/api/auth/admin-login', {
                data: { email, password }
            });

            if (result.success && result.data?.token) {
                localStorage.setItem('adminToken', result.data.token);
                localStorage.setItem('adminUser', JSON.stringify(result.data.user));
                toast({ title: "Admin Authenticated", description: "Welcome to the Super Admin Dashboard." });
                navigate('/admin');
            } else {
                setError(result.message || 'Login failed.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during admin login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#eef2f6] flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white rounded-none p-10 shadow-2xl shadow-purple-100/50 border border-white/50 relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute -top-24 -right-24 h-64 w-64  bg-[#ede7f6]/40 blur-3xl animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64  bg-[#e3f2fd]/40 blur-3xl" />

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="mx-auto mb-6 flex h-16 w-auto items-center justify-center overflow-hidden rounded-xl">
                                <img src={logo} alt="MzansiServe" className="h-full w-auto object-contain" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#673ab7] mb-2 tracking-wide">Sign in</h2>
                            <p className="text-sm text-gray-500 font-medium tracking-wide">Enter your credentials to continue</p>
                            <div className="flex items-center justify-center gap-2 mt-6 mb-2">
                                <span className="text-sm font-bold text-gray-800 tracking-wide">Sign in with Email address</span>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="relative w-full group">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block px-4 pb-4 pt-5 w-full text-[15px] font-medium text-gray-900 bg-white  border border-gray-300 appearance-none focus:outline-none focus:ring-1 focus:ring-[#673ab7] focus:border-[#673ab7] peer transition-colors"
                                    placeholder=" "
                                    autoComplete="email"
                                    required
                                />
                                <label
                                    htmlFor="email"
                                    className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-[#673ab7] peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-[50%] peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3 cursor-text"
                                >
                                    Email Address / Username
                                </label>
                            </div>

                            <div className="relative w-full group">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block px-4 pb-4 pt-5 w-full text-[15px] font-medium text-gray-900 bg-white  border border-gray-300 appearance-none focus:outline-none focus:ring-1 focus:ring-[#673ab7] focus:border-[#673ab7] peer transition-colors"
                                    placeholder=" "
                                    autoComplete="current-password"
                                    required
                                />
                                <label
                                    htmlFor="password"
                                    className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-[#673ab7] peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-[50%] peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3 cursor-text"
                                >
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100  transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5 border-gray-500" strokeWidth={1.5} />}
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="remember" className="w-4 h-4 rounded-none border-gray-300 text-[#673ab7] focus:ring-[#673ab7]" />
                                    <label htmlFor="remember" className="text-sm text-gray-800 font-medium cursor-pointer">Keep me logged in</label>
                                </div>
                                <Link to="#" className="text-sm font-medium text-[#673ab7] hover:underline">Forgot Password?</Link>
                            </div>

                            {error && (
                                <div className="p-3  bg-rose-50 border border-rose-100 flex items-center gap-3 animate-in shake duration-500">
                                    <p className="text-sm font-medium text-rose-600">
                                        {typeof error === 'string' ? error : JSON.stringify(error)}
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12  bg-[#673ab7] hover:bg-[#5e35b1] text-white text-[15px] font-medium transition-all active:scale-[0.98] shadow-none"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white  animate-spin" />
                                        Signing in...
                                    </div>
                                ) : "Sign in"}
                            </Button>
                        </form>

                        <div className="mt-10 pt-8 border-t border-slate-50 flex flex-col items-center gap-4">
                            <Link
                                to="/login"
                                className="text-xs font-bold text-slate-400 hover:text-[#5e35b1] transition-colors flex items-center gap-2"
                            >
                                <Lock className="w-3 h-3" />
                                User Portal Standard Login
                            </Link>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">MzansiServe © 2026</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default AdminLogin;
