// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Package } from 'lucide-react';
import apiClient from '../api/apiClient';
import { formatDateTime } from '../utils/dateFormatter';

const AdminDashboard = () => {
    const [allAuctions, setAllAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllAuctions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Corrected: Fetch all auctions from the public endpoint
            const response = await apiClient.get('/auctions');
            setAllAuctions(response.data);
        } catch (err) {
            console.error('Error fetching auctions:', err);
            setError('Failed to load auctions from the API.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllAuctions();
    }, [fetchAllAuctions]);

    const handleStatusUpdate = async (auctionId, newStatus) => {
        const action = newStatus === 'approved' ? 'approve' : 'reject';
        if (!window.confirm(`Are you sure you want to ${action} this auction?`)) return;

        try {
            // Corrected: Use the PATCH endpoint we built
            await apiClient.patch(`/admin/auctions/${auctionId}/status`, { newStatus });
            alert(`Auction has been ${newStatus}.`);
            fetchAllAuctions(); // Refresh the list
        } catch (err) {
            alert(`Failed to ${action} auction: ${err.response?.data?.message || err.message}`);
        }
    };

    const pendingAuctions = useMemo(() => 
        allAuctions.filter(auction => auction.status === 'pending')
    , [allAuctions]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <motion.h1 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-8"
            >
                Admin Dashboard
            </motion.h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p>{error}</p>
                </div>
            )}
            
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <Package className="h-6 w-6 mr-3 text-yellow-600"/>
                        Pending Auction Approvals ({pendingAuctions.length})
                    </h2>
                    {loading ? (
                        <p className="text-center py-8 text-gray-500">Loading pending auctions...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Bid</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pendingAuctions.length > 0 ? pendingAuctions.map((auction) => (
                                        <tr key={auction.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{auction.item_name}</td>
                                            <td className="px-6 py-4 text-gray-900">${parseFloat(auction.min_bid).toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(auction.end_time)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end space-x-4">
                                                    <button onClick={() => handleStatusUpdate(auction.id, 'approved')} className="text-green-600 hover:text-green-900" title="Approve"><CheckCircle className="h-5 w-5" /></button>
                                                    <button onClick={() => handleStatusUpdate(auction.id, 'rejected')} className="text-red-600 hover:text-red-900" title="Reject"><XCircle className="h-5 w-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="text-center py-8 text-gray-500">No auctions are currently pending approval.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;