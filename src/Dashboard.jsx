import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { AlertCircle, Clock, ChevronRight, Filter, FileText, Trash2 } from 'lucide-react';

const STATUS_TABS = [
    { key: 'all', label: 'All', dot: 'bg-slate-400' },
    { key: 'pending', label: 'Pending', dot: 'bg-yellow-400' },
    { key: 'edited', label: 'Edited', dot: 'bg-blue-400' },
    { key: 'accepted', label: 'Accepted', dot: 'bg-green-400' },
    { key: 'rejected', label: 'Rejected', dot: 'bg-red-400' },
];

const STATUS_ORDER = { pending: 1, edited: 2, accepted: 3, rejected: 4 };

export default function Dashboard() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/verification/invoices/all`);
            setInvoices(response.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this invoice?")) return;

        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/verification/invoice/${id}`);
            setInvoices(prev => prev.filter(inv => inv._id !== id));
        } catch (error) {
            console.error('Error deleting invoice:', error);
            alert('Failed to delete invoice.');
        }
    };

    const getDateFilteredInvoices = () => {
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

    const dateFilteredInvoices = getDateFilteredInvoices();

    const statusCounts = dateFilteredInvoices.reduce((acc, invoice) => {
        const key = invoice.status || 'pending';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    statusCounts.all = dateFilteredInvoices.length;

    const filteredInvoices = [...dateFilteredInvoices]
        .filter(invoice => statusFilter === 'all' || invoice.status === statusFilter)
        .sort((a, b) => {
            const orderA = STATUS_ORDER[a.status] || 5;
            const orderB = STATUS_ORDER[b.status] || 5;
            if (orderA !== orderB) return orderA - orderB;

            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'accepted':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'edited':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    if (loading) {
        return (
            <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-200">
                <div className="px-6 py-6 border-b border-slate-100 sm:px-8">
                    <div className="h-6 w-40 rounded bg-slate-200 animate-pulse" />
                    <div className="mt-3 h-4 w-72 rounded bg-slate-100 animate-pulse" />
                </div>
                <div className="divide-y divide-slate-100">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="px-6 py-5 sm:px-8 flex items-center gap-6">
                            <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
                            <div className="h-4 w-28 rounded bg-slate-100 animate-pulse" />
                            <div className="h-4 w-32 rounded bg-slate-100 animate-pulse hidden sm:block" />
                            <div className="h-6 w-20 rounded-full bg-slate-100 animate-pulse ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-6 border-b border-slate-100 bg-white sm:px-8">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-xl leading-6 font-bold text-slate-900 tracking-tight">Invoices</h3>
                        <p className="mt-2 max-w-2xl text-sm text-slate-500 font-medium">
                            Review and verify these newly ingested invoices or track their processing status.
                        </p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap">
                        {filteredInvoices.length} of {dateFilteredInvoices.length} shown
                    </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
                        {STATUS_TABS.map(tab => {
                            const isActive = statusFilter === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={clsx(
                                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                                        isActive
                                            ? 'bg-white text-indigo-700 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                    )}
                                >
                                    <span className={clsx('h-1.5 w-1.5 rounded-full', tab.dot)} />
                                    {tab.label}
                                    <span
                                        className={clsx(
                                            'rounded-full px-1.5 text-xs font-bold',
                                            isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/70 text-slate-500'
                                        )}
                                    >
                                        {statusCounts[tab.key] || 0}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Filter size={16} className="text-slate-400 shrink-0" />
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
                            <div className="flex items-center gap-2">
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
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice</th>
                            <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Arrived</th>
                            <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                            <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="sticky right-0 bg-slate-50 px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                                            <span className="text-3xl">🎉</span>
                                        </div>
                                        <p className="text-lg font-medium text-slate-900">You're all caught up!</p>
                                        <p className="text-sm text-slate-500">No invoices match your filters.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredInvoices.map((invoice) => {
                                const vendorName = invoice.vendor_name || invoice.invoice_data?.vendor_name;
                                const invoiceNumber = invoice.invoice_data?.invoice_number || invoice._id.substring(invoice._id.length - 8).toUpperCase();
                                const vendorExists = invoice.vendor_exists;
                                const showMissingVendorWarning = !vendorName || vendorExists === false;
                                const dateObj = invoice.created_at ? new Date(invoice.created_at) : null;
                                const hasRejectRemark = invoice.status === 'rejected' && invoice.remark;

                                return (
                                    <tr
                                        key={invoice._id}
                                        onClick={() => navigate(`/review/${invoice._id}`)}
                                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                                                {invoiceNumber}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1 font-mono">
                                                ID: {invoice._id.substring(0, 8)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {dateObj ? (
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <Clock size={14} className="mr-2 text-slate-400" />
                                                    {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {vendorName ? (
                                                <span className="text-sm font-medium text-slate-900">{vendorName}</span>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Unknown</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1.5">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusStyle(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                                {hasRejectRemark && (
                                                    <div className="flex items-center text-red-600 bg-red-50 px-2.5 py-1 rounded-full w-max max-w-[220px] border border-red-100" title={invoice.remark}>
                                                        <AlertCircle size={12} className="mr-1 flex-shrink-0" />
                                                        <span className="text-xs font-bold truncate">{invoice.remark}</span>
                                                    </div>
                                                )}
                                                {showMissingVendorWarning && (
                                                    <div className="flex items-center text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full w-max border border-rose-100">
                                                        <AlertCircle size={12} className="mr-1" />
                                                        <span className="text-xs font-bold">Unregistered Vendor</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="sticky right-0 bg-white group-hover:bg-slate-50 px-4 py-4 whitespace-nowrap text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)] transition-colors">
                                            <div className="flex items-center justify-end gap-1">
                                                {invoice.pdf_url && (
                                                    <a
                                                        href={`${import.meta.env.VITE_BACKEND_URL}${invoice.pdf_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="View Original PDF"
                                                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                    >
                                                        <FileText size={16} />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={(e) => handleDelete(e, invoice._id)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Delete Invoice"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors ml-1" />
                                            </div>
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
