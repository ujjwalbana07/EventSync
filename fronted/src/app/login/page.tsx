"use client";
import React, { useState, Suspense } from "react";
import { api } from "../../utils/api";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
    const searchParams = useSearchParams();
    const initialMode = searchParams.get('mode');

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const router = useRouter();

    const handleForgotPassword = async () => {
        if (!forgotEmail) return alert("Please enter an email");
        try {
            const res = await api.post(`/auth/forgot-password?email=${encodeURIComponent(forgotEmail)}`, {});
            if (res.ok) {
                alert("Reset link sent to your email.");
                setShowForgotModal(false);
            } else {
                alert("Failed to send reset link.");
            }
        } catch (e) {
            alert("Error sending request.");
        }
    };

    const [isSignup, setIsSignup] = useState(initialMode === "signup");
    const [name, setName] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            const res = await api.post("/auth/register", {
                email,
                password,
                name,
                role: "student" // Default logic
            });

            if (res.ok) {
                const data = await res.json();
                alert(data.message || "Account created. Please check your email.");
                setIsSignup(false);
            } else {
                const data = await res.json();
                alert(data.detail || "Signup failed");
            }
        } catch (e) {
            console.error(e);
            alert("Error signing up");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Use URLSearchParams for x-www-form-urlencoded content type
        const params = new URLSearchParams();
        params.append("username", email.trim());
        params.append("password", password.trim());

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params,
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("role", data.role);
                localStorage.setItem("name", data.name);

                const role = data.role;

                if (role === 'admin') router.push('/dashboard');
                else if (role === 'judge') router.push('/dashboard');
                else if (role === 'faculty') router.push('/dashboard');
                else if (role === 'recruiter') router.push('/dashboard');
                else router.push('/dashboard');
            } else {
                const data = await res.json();
                console.error("Login failed:", data);
                alert(data.detail || "Login failed");
            }
        } catch (err) {
            console.error("Login Error:", err);
            alert("Error logging in");
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
            <div className="z-10 max-w-md w-full bg-white p-8 rounded-xl shadow-lg font-sans text-gray-900">
                <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">{isSignup ? "Create Account" : "Welcome Back"}</h1>

                {/* Tab Toggle */}
                <div className="flex w-full mb-6 bg-gray-100 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => setIsSignup(false)}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition duration-200 ${!isSignup ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsSignup(true)}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition duration-200 ${isSignup ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={isSignup ? handleSignup : handleLogin} className="flex flex-col gap-4">
                    {isSignup && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="p-2 border rounded text-black"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        className="p-2 border rounded text-black"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="p-2 border rounded text-black"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {isSignup && (
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            className="p-2 border rounded text-black"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    )}

                    {!isSignup && (
                        <div className="flex justify-end">
                            <button type="button" onClick={() => setShowForgotModal(true)} className="text-sm text-blue-500 hover:underline">
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    <button type="submit" className="p-2 bg-blue-500 text-white rounded">
                        {isSignup ? "Create Account" : "Login"}
                    </button>

                </form>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-black">
                        <h2 className="text-xl font-bold mb-4">Reset Password</h2>
                        <p className="mb-4 text-sm text-gray-600">Enter your email to receive a reset link.</p>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full p-2 border rounded mb-4"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowForgotModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                            <button onClick={handleForgotPassword} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Send Link</button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
