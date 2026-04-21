import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

const isObject = (val) => val !== null && typeof val === 'object' && !Array.isArray(val);
const isArray = (val) => Array.isArray(val);

export default function JsonEditor({ data, onChange, zohoItems = [] }) {
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
            return <ArrayEditor value={value} path={path} onChange={handleChange} zohoItems={zohoItems} />;
        } else if (isObject(value)) {
            return <ObjectEditor value={value} path={path} onChange={handleChange} zohoItems={zohoItems} />;
        } else {
            return <PrimitiveEditor value={value} path={path} onChange={handleChange} zohoItems={zohoItems} />;
        }
    };

    return (
        <div className="p-4">
            {renderValue(data, [])}
        </div>
    );
}

function ObjectEditor({ value, path, onChange, zohoItems }) {
    const [expanded, setExpanded] = useState(true);

    if (!value || Object.keys(value).length === 0) {
        return <span className="text-slate-400 italic font-mono text-sm">{'{ }'}</span>;
    }

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
                    {Object.entries(value).map(([key, val]) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-baseline">
                            <span className="text-sm font-medium text-slate-700 sm:w-1/3 sm:shrink-0 mb-1 sm:mb-0">
                                {key}
                            </span>
                            <div className="sm:w-2/3 break-words">
                                <JsonNode value={val} path={[...path, key]} onChange={onChange} zohoItems={zohoItems} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ArrayEditor({ value, path, onChange, zohoItems }) {
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

    const hasItemId = allKeys.includes('item_id');
    const bulkItemId = hasItemId && value.every(it => it.item_id === value[0]?.item_id)
        ? (value[0]?.item_id || "")
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

            {expanded && isArrayOfObjects && hasItemId && (
                <div className="mt-3 px-4 py-3 bg-indigo-50/80 border border-indigo-100 rounded-lg flex items-center space-x-3 w-max shadow-sm">
                    <span className="text-sm font-bold text-indigo-800">Apply ledger_id/item_id to all rows:</span>
                    <select
                        value={bulkItemId}
                        onChange={(e) => {
                            const val = e.target.value;
                            const newValArray = value.map(it => ({ ...it, item_id: val }));
                            onChange(path, newValArray);
                        }}
                        className="shadow-sm font-medium sm:text-sm rounded-md px-3 py-1.5 border border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500 bg-white min-w-[250px]"
                    >
                        <option value="">-- Multiple / Default (No Item) --</option>
                        {zohoItems.map(item => (
                            <option key={item.item_id} value={item.item_id}>
                                {item.name} {item.sku ? `(${item.sku})` : ''}
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
                                        {k === 'item_id' ? 'ledger_id / item_id' : k.replace(/_/g, ' ')}
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
                            <JsonNode value={item} path={[...path, index]} onChange={onChange} zohoItems={zohoItems} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function JsonNode({ value, path, onChange, zohoItems }) {
    if (isArray(value)) {
        return <ArrayEditor value={value} path={path} onChange={onChange} zohoItems={zohoItems} />;
    } else if (isObject(value)) {
        return <ObjectEditor value={value} path={path} onChange={onChange} zohoItems={zohoItems} />;
    } else {
        return <PrimitiveEditor value={value} path={path} onChange={onChange} zohoItems={zohoItems} />;
    }
}

function PrimitiveEditor({ value, path, onChange, zohoItems }) {
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

    if (keyName === 'item_id' && zohoItems && zohoItems.length > 0) {
        return (
            <select
                value={valOrEmpty}
                onChange={handleChange}
                className="block w-full shadow-sm sm:text-sm rounded-md px-3 py-2 border border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
            >
                <option value="">-- Default Item / No Item --</option>
                {zohoItems.map(item => (
                    <option key={item.item_id} value={item.item_id}>
                        {item.name} {item.sku ? `(${item.sku})` : ''}
                    </option>
                ))}
            </select>
        );
    }

    if (isBoolean) {
        return (
            <input
                type="checkbox"
                checked={valOrEmpty}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
            />
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
