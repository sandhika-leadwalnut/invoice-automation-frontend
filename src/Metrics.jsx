import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function Metrics() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [datePreset, setDatePreset] = useState('all');

    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        month: '',
        vendor_name: ''
    });

    // Indian digit grouping - 12,34,567 rather than 1,234,567.
    const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const inrShort = (n) => {
        const v = Number(n || 0);
        if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
        if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
        if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
        return `₹${v}`;
    };

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            let finalStart = '';
            let finalEnd = '';

            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (datePreset === 'today') {
                finalStart = todayStart.toISOString();
                const todayEnd = new Date(todayStart);
                todayEnd.setHours(23, 59, 59, 999);
                finalEnd = todayEnd.toISOString();
            } else if (datePreset === 'last7days') {
                const sevenDaysAgo = new Date(todayStart);
                sevenDaysAgo.setDate(todayStart.getDate() - 7);
                finalStart = sevenDaysAgo.toISOString();
                const todayEnd = new Date(todayStart);
                todayEnd.setHours(23, 59, 59, 999);
                finalEnd = todayEnd.toISOString();
            } else if (datePreset === 'lastmonth') {
                const thirtyDaysAgo = new Date(todayStart);
                thirtyDaysAgo.setDate(todayStart.getDate() - 30);
                finalStart = thirtyDaysAgo.toISOString();
                const todayEnd = new Date(todayStart);
                todayEnd.setHours(23, 59, 59, 999);
                finalEnd = todayEnd.toISOString();
            } else if (datePreset === 'thismonth') {
                finalStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                // Day 0 of next month is the last day of this one.
                finalEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
            } else if (datePreset === 'prevmonth') {
                finalStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
                finalEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
            } else if (datePreset === 'month') {
                if (filters.month) {
                    const [y, m] = filters.month.split('-').map(Number);
                    finalStart = new Date(y, m - 1, 1).toISOString();
                    finalEnd = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
                }
            } else if (datePreset === 'custom') {
                if (filters.start_date) finalStart = new Date(filters.start_date).toISOString();
                if (filters.end_date) {
                    const endData = new Date(filters.end_date);
                    endData.setHours(23, 59, 59, 999);
                    finalEnd = endData.toISOString();
                }
            }

            if (finalStart) params.append('start_date', finalStart);
            if (finalEnd) params.append('end_date', finalEnd);

            if (filters.vendor_name) params.append('vendor_name', filters.vendor_name);

            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/verification/metrics?${params.toString()}`);
            setMetrics(response.data);
        } catch (error) {
            console.error('Error fetching metrics', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, datePreset]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    if (loading && !metrics) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const COLORS = {
        pending: '#f59e0b',
        accepted: '#10b981',
        edited: '#3b82f6',
        rejected: '#ef4444'
    };

    const statusData = metrics ? Object.entries(metrics.status_distribution).map(([name, value]) => ({
        name, value
    })) : [];

    return (
        <div className="space-y-6">
            {/* Filters Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Metrics Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
                        <select
                            value={datePreset}
                            onChange={(e) => setDatePreset(e.target.value)}
                            className="w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="last7days">Last 7 Days</option>
                            <option value="lastmonth">Last 30 Days</option>
                            <option value="thismonth">This Month</option>
                            <option value="prevmonth">Last Month</option>
                            <option value="month">Pick a Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {datePreset === 'month' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                            <input
                                type="month"
                                name="month"
                                value={filters.month}
                                onChange={handleFilterChange}
                                className="w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    )}

                    {datePreset === 'custom' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={filters.start_date}
                                    onChange={handleFilterChange}
                                    className="w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={filters.end_date}
                                    onChange={handleFilterChange}
                                    className="w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="col-span-2 hidden md:block"></div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
                        <input
                            type="text"
                            name="vendor_name"
                            placeholder="Filter by vendor..."
                            value={filters.vendor_name}
                            onChange={handleFilterChange}
                            className="w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <button
                            onClick={() => {
                                setDatePreset('all');
                                setFilters({ start_date: '', end_date: '', month: '', vendor_name: '' });
                            }}
                            className="w-full bg-slate-100 text-slate-700 py-2 px-4 rounded-md hover:bg-slate-200 transition-colors h-[38px]"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Summary Cards */}
                    <div className="flex flex-col gap-6 md:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center justify-center flex-1">
                            <h3 className="text-lg font-medium text-slate-500 mb-2 text-center">Received by Mail</h3>
                            <p className="text-5xl font-bold text-emerald-600">{metrics.total_email_invoices || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center justify-center flex-1">
                            <h3 className="text-lg font-medium text-slate-500 mb-2 text-center">Total Processed</h3>
                            <p className="text-5xl font-bold text-indigo-600">{metrics.total}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center justify-center flex-1">
                            <h3 className="text-lg font-medium text-slate-500 mb-2 text-center">Pushed to Zoho</h3>
                            <p className="text-5xl font-bold text-sky-500">{metrics.total_zoho_pushed || 0}</p>
                        </div>
                        {/* Without this, a blocked duplicate is indistinguishable from an
                            invoice that failed to extract - and those need opposite responses. */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center justify-center flex-1">
                            <h3 className="text-lg font-medium text-slate-500 mb-2 text-center">Duplicates Blocked</h3>
                            <p className="text-5xl font-bold text-amber-500">{metrics.total_duplicates_blocked || 0}</p>
                            <p className="mt-2 text-xs text-slate-400 text-center">Never reached the queue</p>
                        </div>
                    </div>

                    {/* Status Pie Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 md:col-span-3">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">Invoice Processing Status</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Payments. Filtered on the date money went out, not when the
                        invoice was ingested - those are often different months. */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 md:col-span-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
                            <h3 className="text-lg font-medium text-slate-800">Payments</h3>
                            <span className="text-xs font-medium text-slate-400">
                                By payment date, not invoice date
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col justify-center rounded-lg border border-emerald-100 bg-emerald-50/60 p-6">
                                <h4 className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Total Paid</h4>
                                <p className="mt-2 text-4xl font-bold text-emerald-700 break-words">
                                    {inr(metrics.total_paid)}
                                </p>
                                <p className="mt-2 text-sm text-emerald-800/70">
                                    across {metrics.paid_count || 0} invoice{metrics.paid_count === 1 ? '' : 's'}
                                </p>
                                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                                    Invoice value including GST. TDS is deducted at payment and
                                    isn&apos;t tracked here, so the cash that actually left the
                                    bank is lower than this.
                                </p>
                                {metrics.paid_without_amount > 0 && (
                                    <p className="mt-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                        {metrics.paid_without_amount} paid invoice
                                        {metrics.paid_without_amount === 1 ? '' : 's'} have no
                                        recoverable amount and count as zero
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <h4 className="text-sm font-medium text-slate-600 mb-3">Paid the most</h4>
                                {metrics.paid_by_vendor && metrics.paid_by_vendor.length > 0 ? (
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={metrics.paid_by_vendor}
                                                layout="vertical"
                                                margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis
                                                    type="number"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={inrShort}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="vendor"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={150}
                                                    tick={{ fontSize: 12 }}
                                                    tickFormatter={(v) => v && v.length > 22 ? `${v.substring(0, 22)}...` : v}
                                                />
                                                <RechartsTooltip
                                                    cursor={{ fill: 'transparent' }}
                                                    formatter={(value, name, item) => [
                                                        `${inr(value)} · ${item?.payload?.count ?? 0} invoice(s)`,
                                                        'Paid'
                                                    ]}
                                                />
                                                <Bar dataKey="total" fill="#059669" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-80 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 text-center px-6">
                                        <p className="text-sm font-medium text-slate-600">Nothing marked paid yet</p>
                                        <p className="mt-1 text-sm text-slate-400 max-w-sm">
                                            Select accepted invoices on the dashboard and use
                                            Mark&nbsp;as&nbsp;Paid. Totals and this chart fill in from there.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Vendor Bar Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 md:col-span-4">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">Top Vendors by Volume</h3>
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={metrics.vendors.slice(0, 10)}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="vendor"
                                        axisLine={false}
                                        tickLine={false}
                                        angle={-45}
                                        textAnchor="end"
                                        interval={0}
                                        height={80}
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => value && value.length > 25 ? `${value.substring(0, 25)}...` : value}
                                    />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Timeline Line Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 md:col-span-4">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">Processed Invoices over Time</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={metrics.timeline}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <RechartsTooltip />
                                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
