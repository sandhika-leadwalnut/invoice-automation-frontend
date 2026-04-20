import React, { useState } from 'react';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username === import.meta.env.VITE_USERNAME && password === import.meta.env.VITE_PASSWORD) {
            onLogin();
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                        Sign in to Invoice Review
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded font-medium">{error}</div>}
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label className="sr-only">Username</label>
                            <input
                                type="text"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="sr-only">Password</label>
                            <input
                                type="password"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
