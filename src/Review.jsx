import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import JsonEditor from './JsonEditor';
import { Check, Edit, X, ArrowLeft, FileText } from 'lucide-react';

export default function Review() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [editedData, setEditedData] = useState(null);
    const [zohoItems, setZohoItems] = useState([]);
    const [tdsTaxes, setTdsTaxes] = useState([]);
    const [standardTaxes, setStandardTaxes] = useState([]);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectRemark, setRejectRemark] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveNotification, setSaveNotification] = useState(false);

    useEffect(() => {
        fetchInvoiceData();
    }, [id]);

    const fetchInvoiceData = async () => {
        try {
            const [invoiceRes, itemsRes, tdsRes, taxesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/verification/invoice/${id}`),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/items`),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/tds-taxes`),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/taxes`)
            ]);
            setInvoice(invoiceRes.data);
            setZohoItems(itemsRes.data);
            setTdsTaxes(tdsRes.data);
            setStandardTaxes(taxesRes.data);

            // Initialize edited data with the fetched data
            const sourceData = invoiceRes.data.edited_data || invoiceRes.data.invoice_data;
            const initialData = sourceData ? JSON.parse(JSON.stringify(sourceData)) : {};
            
            // Calculate tax_type and default tax_id based on invoice level taxes
            let defaultTaxId = "";
            let taxType = "";
            if (initialData.igst > 0) {
                 const igstTax = taxesRes.data.find(t => t.tax_name === "IGST18" || t.tax_name === "IGST 18%");
                 if (igstTax) defaultTaxId = igstTax.tax_id;
                 taxType = "IGST (18%)";
            } else if (initialData.cgst > 0 || initialData.sgst > 0) {
                 const gstTax = taxesRes.data.find(t => t.tax_name === "GST18" || t.tax_name === "GST 18%");
                 if (gstTax) defaultTaxId = gstTax.tax_id;
                 taxType = "GST (18%)";
            }
            initialData.tax_type = taxType;

            // Map items_table to line_items if line_items is empty
            if (initialData.items_table && Array.isArray(initialData.items_table) && initialData.items_table.length > 0) {
                if (!initialData.line_items || (Array.isArray(initialData.line_items) && initialData.line_items.length === 0)) {
                    initialData.line_items = initialData.items_table;
                    delete initialData.items_table;
                }
            }

            // Ensure tds_tax_id exists
            if (initialData && initialData.tds_tax_id === undefined) {
                initialData.tds_tax_id = "";
            }
            // Ensure item_id exists in line_items so it's editable
            if (initialData.line_items && Array.isArray(initialData.line_items)) {
                initialData.line_items = initialData.line_items.map(item => ({
                    ...item,
                    item_id: item.item_id || "",
                    tax_id: item.tax_id || defaultTaxId || ""
                }));
            }
            setEditedData(initialData);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch invoice data.');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action, additionalData = {}) => {
        try {
            setLoading(true);
            const payload = { action, ...additionalData };

            let finalData = editedData;
            if (finalData && finalData.line_items && Array.isArray(finalData.line_items)) {
                finalData = { ...finalData };
                finalData.line_items = finalData.line_items.map(item => {
                    if (item.item_id) {
                        const zohoItem = zohoItems.find(z => z.item_id === item.item_id);
                        if (zohoItem && zohoItem.hsn_or_sac) {
                            return { ...item, hsn_sac: zohoItem.hsn_or_sac };
                        }
                    }
                    return item;
                });
            }

            if (action === 'edit' || action === 'accept') {
                payload.data = finalData;
            }

            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/verification/invoice/${id}/action`, payload);
            
            if (action === 'edit') {
                setSaveNotification(true);
                setTimeout(() => setSaveNotification(false), 3000);
                setLoading(false);
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            alert('Error performing action: ' + (err.response?.data?.detail || err.message));
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

    if (error) {
        return <div className="text-red-500 font-bold text-center mt-10">{error}</div>;
    }

    if (!invoice) return null;

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8 relative">
            {saveNotification && (
                <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-md shadow-lg flex items-center z-50 transition-all duration-300">
                    <Check className="w-5 h-5 mr-2" />
                    <span className="font-medium">Changes saved successfully!</span>
                </div>
            )}
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
                <div>
                    <button onClick={() => navigate('/')} className="mb-4 text-indigo-600 hover:text-indigo-900 flex items-center text-sm font-medium">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                    </button>
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Review Invoice: {id}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">Status: {invoice.status}</p>
                </div>
                <div className="flex space-x-3">
                    {invoice.pdf_url && (
                        <a
                            href={`${import.meta.env.VITE_BACKEND_URL}${invoice.pdf_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition"
                        >
                            <FileText className="mr-2 h-4 w-4 text-indigo-600" /> View PDF
                        </a>
                    )}
                    {invoice.status !== 'accepted' && invoice.status !== 'rejected' && (
                        <>
                            <button
                                onClick={() => setShowRejectModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 shadow-sm transition"
                            >
                                <X className="mr-2 h-4 w-4" /> Reject
                            </button>
                            <button
                                onClick={() => handleAction('edit')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
                            >
                                <Edit className="mr-2 h-4 w-4" /> Save Changes
                            </button>
                            <button
                                onClick={() => handleAction('accept')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm transition"
                            >
                                <Check className="mr-2 h-4 w-4" /> Accept & Send
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="border-t border-slate-200">
                <JsonEditor
                    data={editedData}
                    onChange={setEditedData}
                    zohoItems={zohoItems}
                    tdsTaxes={tdsTaxes}
                    standardTaxes={standardTaxes}
                />
            </div>

            {showRejectModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75" onClick={() => setShowRejectModal(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-10">
                            <div>
                                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                                    <h3 className="text-lg font-medium leading-6 text-slate-900">Reject Invoice</h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-slate-500">Please provide a reason for rejecting this invoice. This is mandatory.</p>
                                        <textarea
                                            className="w-full mt-3 p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            rows="3"
                                            placeholder="Enter rejection remark..."
                                            value={rejectRemark}
                                            onChange={(e) => setRejectRemark(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    disabled={!rejectRemark.trim()}
                                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        handleAction('reject', { remark: rejectRemark.trim() });
                                    }}
                                >
                                    Confirm Reject
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => setShowRejectModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
