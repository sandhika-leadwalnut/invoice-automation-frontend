import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import rawCsv from '../vendor_mapping_list.csv?raw';

function parseCSVLine(str) {
    let arr = [];
    let quote = false;
    let col = 0;
    for (let c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c + 1];
        arr[col] = arr[col] || '';
        if (cc === '"' && quote && nc === '"') { arr[col] += cc; ++c; continue; }
        if (cc === '"') { quote = !quote; continue; }
        if (cc === ',' && !quote) { ++col; continue; }
        arr[col] += cc;
    }
    return arr.map(s => s.trim());
}

export default function VendorMapping() {
    const vendors = useMemo(() => {
        const lines = rawCsv.split('\n');
        const data = [];
        let lastVendorName = '';
        // Data starts after the first two rows (which are empty and headers)
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = parseCSVLine(line);
            if (cols.length >= 2) {
                const vendorName = cols[1] || lastVendorName;
                lastVendorName = vendorName;
                data.push({
                    vendorName: vendorName,
                    account: cols[2] || '',
                });
            }
        }
        return data;
    }, []);

    const [searchTerm, setSearchTerm] = useState('');

    const filtered = vendors.filter(v =>
        v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.account.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Vendor Mapping</h2>
                    <p className="text-sm text-slate-500 mt-1">List of all vendor mappings and their configurations.</p>
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                        placeholder="Search vendors or accounts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/2">
                                Vendor Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/2">
                                Account
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filtered.map((vendor, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-slate-900 border-r border-slate-100">
                                    {vendor.vendorName}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {vendor.account}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="2" className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <Search className="h-8 w-8 text-slate-300 mb-3" />
                                        <p className="text-slate-500 text-sm font-medium">No vendors found matching "{searchTerm}"</p>
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                        >
                                            Clear search
                                        </button>
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
