import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, ChevronRight, Filter } from 'lucide-react';

export default function Dashboard() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/verification/invoices/pending`);
            setInvoices(response.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredInvoices = () => {
        if (dateFilter === 'all') return invoices;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return invoices.filter(invoice => {
            if (!invoice.created_at) return false;
            const invoiceDate = new Date(invoice.created_at);
            const invoiceDay = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), invoiceDate.getDate());

            if (dateFilter === 'today') {
                return invoiceDay.getTime() === today.getTime();
            }
            if (dateFilter === 'last7days') {
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);
                return invoiceDay >= sevenDaysAgo;
            }
            if (dateFilter === 'lastmonth') {
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                return invoiceDay >= thirtyDaysAgo;
            }
            if (dateFilter === 'custom') {
                if (customStartDate) {
                    const start = new Date(customStartDate);
                    if (invoiceDay < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
                }
                if (customEndDate) {
                    const end = new Date(customEndDate);
                    if (invoiceDay > new Date(end.getFullYear(), end.getMonth(), end.getDate())) return false;
                }
                return true;
            }
            return true;
        });
    };

    const filteredInvoices = getFilteredInvoices();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-6 border-b border-slate-100 bg-white sm:px-8 flex justify-between items-center">
                <div>
                    <h3 className="text-xl leading-6 font-bold text-slate-900 tracking-tight">Pending Invoices</h3>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500 font-medium">
                        Review and verify these newly ingested invoices before syncing to Zoho Books.
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="text-sm border-slate-200 rounded-lg text-slate-700 py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="last7days">Last 7 Days</option>
                            <option value="lastmonth">Last 30 Days</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        {dateFilter === 'custom' && (
                            <div className="flex items-center space-x-2 ml-2">
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="text-sm border border-slate-300 rounded-lg text-slate-700 py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                />
                                <span className="text-slate-400 text-sm">to</span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="text-sm border border-slate-300 rounded-lg text-slate-700 py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                />
                            </div>
                        )}
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold text-sm">
                        {filteredInvoices.length} Pending
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Identifier</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email Arrival Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Alerts</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                                            <span className="text-3xl">🎉</span>
                                        </div>
                                        <p className="text-lg font-medium text-slate-900">You're all caught up!</p>
                                        <p className="text-sm text-slate-500">No pending invoices match your filter.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredInvoices.map((invoice, index) => {
                                const vendorName = invoice.invoice_data?.vendor_name;
                                const invoiceNumber = invoice.invoice_data?.invoice_number || invoice._id.substring(invoice._id.length - 8).toUpperCase();
                                const vendorExists = invoice.vendor_exists;
                                const showMissingVendorWarning = !vendorName || vendorExists === false;
                                const dateObj = invoice.created_at ? new Date(invoice.created_at) : null;

                                return (
                                    <tr
                                        key={invoice._id}
                                        onClick={() => navigate(`/review/${invoice._id}`)}
                                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-400 font-medium">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                                                {invoiceNumber}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1 font-mono">
                                                ID: {invoice._id.substring(0, 8)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {dateObj ? (
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <Clock size={14} className="mr-2 text-slate-400" />
                                                    {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {vendorName ? (
                                                <span className="text-sm font-medium text-slate-900">{vendorName}</span>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Unknown</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {showMissingVendorWarning ? (
                                                <div className="flex items-center text-rose-600 bg-rose-50 px-3 py-1 rounded-full w-max border border-rose-100">
                                                    <AlertCircle size={14} className="mr-1.5" />
                                                    <span className="text-xs font-bold">Unregistered Vendor</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right">
                                            <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors inline-block" />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
