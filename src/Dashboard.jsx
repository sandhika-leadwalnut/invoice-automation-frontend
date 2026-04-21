import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, ChevronRight } from 'lucide-react';

export default function Dashboard() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
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
                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold text-sm">
                    {invoices.length} Pending
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
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                                            <span className="text-3xl">🎉</span>
                                        </div>
                                        <p className="text-lg font-medium text-slate-900">You're all caught up!</p>
                                        <p className="text-sm text-slate-500">No pending invoices require human review.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            invoices.map((invoice, index) => {
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
