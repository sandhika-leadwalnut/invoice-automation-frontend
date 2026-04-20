import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './Dashboard';
import Review from './Review';
import Metrics from './Metrics';
import Login from './Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('authenticated') === 'true';
  });

  const handleLogin = () => {
    localStorage.setItem('authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoice Verification Panel</h1>
            <nav className="flex space-x-4">
              <Link to="/" className="text-slate-600 hover:text-indigo-600 font-medium">Dashboard</Link>
              <Link to="/metrics" className="text-slate-600 hover:text-indigo-600 font-medium">Metrics</Link>
              <button
                onClick={handleLogout}
                className="text-slate-600 hover:text-red-600 font-medium ml-4 transition-colors"
              >
                Logout
              </button>
            </nav>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/metrics" element={<Metrics />} />
              <Route path="/review/:id" element={<Review />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
