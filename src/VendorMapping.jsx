import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, AlertCircle, RefreshCw } from 'lucide-react';

// Read live from invoice_db.vendors rather than a CSV baked in at build time.
// The old file was a snapshot: every vendor added after it was written was
// invisible here until someone remembered to regenerate and redeploy it.
export default function VendorMapping() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchVendors = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/verification/vendors/mapped`
            );
            setVendors(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading vendors:', err);
            setError('Could not load vendors.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return vendors;
        return vendors.filter(v =>
            (v.vendor_name || '').toLowerCase().includes(q) ||
            (v.ledger_name || '').toLowerCase().includes(q) ||
            (v.gstin || '').toLowerCase().includes(q) ||
            (v.pan || '').toLowerCase().includes(q)
        );
    }, [vendors, searchTerm]);

    const incomplete = vendors.filter(v => !v.ledger_id || !v.has_bank_details).length;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Vendor Mapping</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {loading ? 'Loading…' : `${vendors.length} vendors`}
                        {!loading && incomplete > 0 && (
                            <span className="text-amber-700"> · {incomplete} need attention</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                            placeholder="Search name, ledger, GSTIN…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchVendors}
                        disabled={loading}
                        title="Reload from the database"
                        className="p-2 rounded-md border border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="px-6 py-4 bg-red-50 border-b border-red-100 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Vendor Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Account</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">GSTIN / PAN</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Credit</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Bank</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {loading && vendors.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-400">Loading vendors…</td></tr>
                        ) : (
                            filtered.map((vendor) => (
                                <tr key={vendor.vendor_id || vendor.vendor_name} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 border-r border-slate-100">
                                        {vendor.vendor_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {vendor.ledger_name ? (
                                            <span className="text-slate-600">{vendor.ledger_name}</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                                <AlertCircle size={12} /> No ledger
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-mono text-xs">
                                        {vendor.gstin || (vendor.pan ? `${vendor.pan} (PAN)` : '—')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                        {vendor.credit_days != null
                                            ? `${vendor.credit_days} days`
                                            : <span className="text-slate-400">5th / 20th</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {vendor.has_bank_details ? (
                                            <span className="text-emerald-700 text-xs font-semibold">On record</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                                <AlertCircle size={12} /> Missing
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                        {!loading && filtered.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <Search className="h-8 w-8 text-slate-300 mb-3" />
                                        <p className="text-slate-500 text-sm font-medium">
                                            {searchTerm ? `No vendors matching "${searchTerm}"` : 'No vendors yet'}
                                        </p>
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >
                                                Clear search
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
