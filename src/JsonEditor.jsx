import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

const isObject = (val) => val !== null && typeof val === 'object' && !Array.isArray(val);
const isArray = (val) => Array.isArray(val);

export default function JsonEditor({ data, onChange, zohoItems = [], zohoAccounts = [], tdsTaxes = [], standardTaxes = [] }) {
    if (!data) return <div className="p-4 text-slate-500">No data available</div>;

    const handleChange = (keyPath, newValue) => {
        // Clone and update deep object
        const newData = JSON.parse(JSON.stringify(data));
        let target = newData;
        for (let i = 0; i < keyPath.length - 1; i++) {
            target = target[keyPath[i]];
        }
        target[keyPath[keyPath.length - 1]] = newValue;
        onChange(newData);
    };

    const renderValue = (value, path) => {
        if (isArray(value)) {
            return <ArrayEditor value={value} path={path} onChange={handleChange} zohoItems={zohoItems} zohoAccounts={zohoAccounts} tdsTaxes={tdsTaxes} standardTaxes={standardTaxes} />;
        } else if (isObject(value)) {
            return <ObjectEditor value={value} path={path} onChange={handleChange} zohoItems={zohoItems} zohoAccounts={zohoAccounts} tdsTaxes={tdsTaxes} standardTaxes={standardTaxes} />;
        } else {
            return <PrimitiveEditor value={value} path={path} onChange={handleChange} zohoItems={zohoItems} zohoAccounts={zohoAccounts} tdsTaxes={tdsTaxes} standardTaxes={standardTaxes} />;
        }
    };

    return (
        <div className="p-4">
            {renderValue(data, [])}
        </div>
    );
}

function ObjectEditor({ value, path, onChange, zohoItems, zohoAccounts, tdsTaxes, standardTaxes }) {
    const [expanded, setExpanded] = useState(true);

    if (!value || Object.keys(value).length === 0) {
        return <span className="text-slate-400 italic font-mono text-sm">{'{ }'}</span>;
    }

    let entries = Object.entries(value);
    
    // Filter GST fields
    const isEmpty = (v) => v === null || v === undefined || v === "" || v === 0 || v === "0";
    const hasIgst = !isEmpty(value.igst);
    const hasCgst = !isEmpty(value.cgst);
    const hasSgst = !isEmpty(value.sgst);
    
    entries = entries.filter(([key, val]) => {
        if (['igst', 'cgst', 'sgst'].includes(key)) {
            if (isEmpty(val)) return false;
            
            if (key === 'igst' && (hasCgst || hasSgst)) return false;
            if ((key === 'cgst' || key === 'sgst') && hasIgst) return false;
        }
        return true;
    });

    return (
        <div className="ml-4 border-l-2 border-slate-200 pl-4 py-1">
            <div
                className="flex items-center cursor-pointer text-slate-500 hover:text-slate-800 -ml-8"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? <ChevronDown className="w-4 h-4 bg-white" /> : <ChevronRight className="w-4 h-4 bg-white" />}
                <span className="font-semibold text-xs uppercase tracking-wider ml-1">Object</span>
            </div>

            {expanded && (
                <div className="mt-2 space-y-3">
                    {entries.map(([key, val]) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-baseline">
                            <span className="text-sm font-medium text-slate-700 sm:w-1/3 sm:shrink-0 mb-1 sm:mb-0">
                                {key}
                            </span>
                            <div className="sm:w-2/3 break-words">
                                <JsonNode value={val} path={[...path, key]} onChange={onChange} zohoItems={zohoItems} zohoAccounts={zohoAccounts} tdsTaxes={tdsTaxes} standardTaxes={standardTaxes} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ArrayEditor({ value, path, onChange, zohoItems, zohoAccounts, tdsTaxes, standardTaxes }) {
    const [expanded, setExpanded] = useState(true);

    if (!value || value.length === 0) {
        return <span className="text-slate-400 italic font-mono text-sm">{'[ ]'}</span>;
    }

    const isArrayOfObjects = value.length > 0 && value.every(isObject);
    let allKeys = [];
    if (isArrayOfObjects) {
        const keySet = new Set();
        // Make sure item_id is first if it exists, for convenience
        value.forEach(item => {
            if ('item_id' in item) keySet.add('item_id');
            Object.keys(item).forEach(k => keySet.add(k));
        });
        allKeys = Array.from(keySet);
    }

    const hasAccountId = allKeys.includes('account_id');
    const bulkAccountId = hasAccountId && value.every(it => it.account_id === value[0]?.account_id)
        ? (value[0]?.account_id || "")
        : "";

    return (
        <div className="ml-4 border-l-2 border-indigo-200 pl-4 py-2 mt-2 mb-4">
            <div className="flex items-center space-x-4">
                <div
                    className="flex items-center cursor-pointer text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 py-1 px-2 rounded w-max"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? <ChevronDown className="w-4 h-4 bg-white rounded" /> : <ChevronRight className="w-4 h-4 bg-white rounded" />}
                    <span className="font-bold text-xs uppercase tracking-wider ml-2 shadow-sm">Array ({value.length})</span>
                </div>
            </div>



            {expanded && isArrayOfObjects && hasAccountId && (
                <div className="mt-3 px-4 py-3 bg-emerald-50/80 border border-emerald-100 rounded-lg flex items-center space-x-3 w-max shadow-sm max-w-full">
                    <span className="text-sm font-bold text-emerald-800 whitespace-nowrap">Apply Ledger to all rows:</span>
                    <select
                        value={bulkAccountId}
                        onChange={(e) => {
                            const val = e.target.value;
                            const newValArray = value.map(it => ({ ...it, account_id: val }));
                            onChange(path, newValArray);
                        }}
                        className="shadow-sm font-medium sm:text-sm rounded-md px-3 py-1.5 border border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 bg-white w-64 text-ellipsis overflow-hidden whitespace-nowrap"
                    >
                        <option value="">-- Multiple / Default (No Account) --</option>
                        {zohoAccounts.map(acc => (
                            <option key={acc.account_id} value={acc.account_id}>
                                {acc.account_name} {acc.account_type ? `(${acc.account_type})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {expanded && isArrayOfObjects && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 bg-white">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 w-12 bg-slate-100/50">#</th>
                                {allKeys.map(k => (
                                    <th key={k} className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 bg-slate-100/50 whitespace-nowrap">
                                        {k.replace(/_/g, ' ')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {value.map((item, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-slate-400 border-r border-slate-200 bg-slate-50/50 text-center">
                                        {rowIndex + 1}
                                    </td>
                                    {allKeys.map(k => (
                                        <td key={k} className="px-3 py-2 border-r border-slate-100 last:border-r-0 min-w-[200px] align-top bg-white">
                                            <JsonNode
                                                value={item[k] !== undefined ? item[k] : ""}
                                                path={[...path, rowIndex, k]}
                                                onChange={onChange}
                                                zohoItems={zohoItems}
                                                zohoAccounts={zohoAccounts}
                                                tdsTaxes={tdsTaxes}
                                                standardTaxes={standardTaxes}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {expanded && !isArrayOfObjects && (
                <div className="mt-2 space-y-4">
                    {value.map((item, index) => (
                        <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 mb-2 uppercase">Item {index}</div>
                            <JsonNode value={item} path={[...path, index]} onChange={onChange} zohoItems={zohoItems} zohoAccounts={zohoAccounts} tdsTaxes={tdsTaxes} standardTaxes={standardTaxes} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function JsonNode({ value, path, onChange, zohoItems, zohoAccounts, tdsTaxes, standardTaxes }) {
    if (isArray(value)) {
        return <ArrayEditor value={value} path={path} onChange={onChange} zohoItems={zohoItems} zohoAccounts={zohoAccounts} tdsTaxes={tdsTaxes} standardTaxes={standardTaxes} />;
    } else if (isObject(value)) {
        return <ObjectEditor value={value} path={path} onChange={onChange} zohoItems={zohoItems} zohoAccounts={zohoAccounts} tdsTaxes={tdsTaxes} standardTaxes={standardTaxes} />;
    } else {
        return <PrimitiveEditor value={value} path={path} onChange={onChange} zohoItems={zohoItems} zohoAccounts={zohoAccounts} tdsTaxes={tdsTaxes} standardTaxes={standardTaxes} />;
    }
}

function PrimitiveEditor({ value, path, onChange, zohoItems, zohoAccounts, tdsTaxes, standardTaxes }) {
    const isNumber = typeof value === 'number';
    const isBoolean = typeof value === 'boolean';
    const valOrEmpty = value === null || value === undefined ? "" : value;
    const keyName = path[path.length - 1];

    const handleChange = (e) => {
        let newVal = e.target.value;
        if (isNumber) newVal = Number(newVal);
        if (isBoolean) newVal = e.target.checked;
        onChange(path, newVal);
    };



    if (isBoolean) {
        return (
            <select
                value={valOrEmpty}
                onChange={(e) => onChange(e.target.value === 'true')}
                className="block w-full shadow-sm sm:text-sm rounded-md px-3 py-2 border border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
            >
                <option value="true">True</option>
                <option value="false">False</option>
            </select>
        );
    }



    if (keyName === 'account_id') {
        return (
            <select
                value={valOrEmpty}
                onChange={handleChange}
                className="block w-full max-w-[200px] shadow-sm sm:text-sm rounded-md px-3 py-2 border border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="">-- No Account --</option>
                {zohoAccounts && zohoAccounts.map((acc) => (
                    <option key={acc.account_id} value={acc.account_id}>
                        {acc.account_name} {acc.account_type ? `(${acc.account_type})` : ''}
                    </option>
                ))}
            </select>
        );
    }

    if (keyName === 'tds_tax_id') {
        return (
            <select
                value={valOrEmpty}
                onChange={handleChange}
                className="block w-full shadow-sm sm:text-sm rounded-md px-3 py-2 border border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
            >
                <option value="">-- No TDS --</option>
                {tdsTaxes && tdsTaxes.map((opt) => (
                    <option key={opt.tax_id} value={opt.tax_id}>
                        {opt.tax_name}
                    </option>
                ))}
            </select>
        );
    }

    if (keyName === 'tax_id') {
        return (
            <select
                value={valOrEmpty}
                onChange={handleChange}
                className="block w-full shadow-sm sm:text-sm rounded-md px-3 py-2 border border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
            >
                <option value="">-- No Tax / Default --</option>
                {standardTaxes && standardTaxes.map((opt) => (
                    <option key={opt.tax_id} value={opt.tax_id}>
                        {opt.tax_name} {opt.tax_percentage !== undefined ? `(${opt.tax_percentage}%)` : ''}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <input
            type={isNumber ? 'number' : 'text'}
            value={valOrEmpty}
            onChange={handleChange}
            className={`block w-full shadow-sm sm:text-sm rounded-md px-3 py-2 border ${valOrEmpty === '' ? 'border-dashed border-slate-300 placeholder-slate-400' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
            placeholder={valOrEmpty === '' ? 'null' : ''}
        />
    );
}
