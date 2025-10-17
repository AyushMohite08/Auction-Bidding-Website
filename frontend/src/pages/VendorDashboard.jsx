// src/pages/VendorDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Eye, Trash2, TrendingUp, DollarSign, Package, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import CountdownTimer from '../components/CountdownTimer';

// Helper component to display each auction card
const AuctionCard = ({ auction, onDelete, isPast = false }) => {
    const displayPrice = auction.locked_price || auction.current_bid || auction.min_bid;
    const priceLabel = isPast 
        ? (auction.status === 'sold' ? 'Sold For' : 'Final Price')
        : 'Current Price';
    
    return (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden flex flex-col ${isPast ? 'opacity-75' : ''}`}>
            <img src={`http://localhost:3000${auction.image_url}`} alt={auction.item_name} className="w-full h-48 object-cover"/>
            <div className="p-4 flex-grow">
                <h3 className="text-lg font-bold truncate">{auction.item_name}</h3>
                <p className="text-gray-600 text-sm mt-1 flex items-center">
                    Status: <span className={`font-semibold capitalize ml-1 ${
                        auction.status === 'sold' ? 'text-green-600' :
                        auction.status === 'active' || auction.status === 'approved' ? 'text-blue-600' :
                        auction.status === 'pending' ? 'text-yellow-600' :
                        auction.status === 'rejected' ? 'text-red-600' :
                        'text-gray-600'
                    }`}>{auction.status}</span>
                    {auction.locked_price && <span className="text-xs ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Locked</span>}
                </p>
                {!isPast && (auction.status === 'active' || auction.status === 'approved') && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <CountdownTimer endTime={auction.end_time} />
                    </div>
                )}
                {isPast && (
                    <>
                        {auction.status === 'sold' && auction.winner_name && (
                            <p className="text-sm text-green-600 mt-2 font-semibold">
                                🏆 Sold to: <strong>{auction.winner_name}</strong>
                            </p>
                        )}
                        {auction.status === 'expired' && (
                            <p className="text-sm text-gray-500 mt-2">⏰ Expired (No winner)</p>
                        )}
                        {auction.status === 'rejected' && (
                            <p className="text-sm text-red-500 mt-2">❌ Rejected by Admin</p>
                        )}
                    </>
                )}
                <p className="text-gray-800 font-bold mt-2">{priceLabel}: ${parseFloat(displayPrice).toFixed(2)}</p>
                {!isPast && auction.current_bid && (
                    <p className="text-xs text-gray-500">Bids placed</p>
                )}
            </div>
            <div className="p-4 border-t flex space-x-2">
                <Link to={`/auction/${auction.id}`} className="flex-1 flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                    <Eye className="h-4 w-4 mr-2" /> View
                </Link>
                {!isPast && (auction.status === 'pending' || auction.status === 'rejected') && (
                    <button onClick={() => onDelete(auction.id)} className="flex-1 flex items-center justify-center bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </button>
                )}
            </div>
        </div>
    );
};

const VendorDashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allAuctions, setAllAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        itemName: '', description: '', minBid: '', itemImage: null, startTime: '', endTime: ''
    });

    const { liveAuctions, pastAuctions } = useMemo(() => {
        const live = allAuctions.filter(a => a.status === 'pending' || a.status === 'active' || a.status === 'approved');
        const past = allAuctions.filter(a => a.status === 'sold' || a.status === 'expired' || a.status === 'rejected');
        return { liveAuctions: live, pastAuctions: past };
    }, [allAuctions]);

    const statistics = useMemo(() => {
        const totalAuctions = allAuctions.length;
        const activeAuctions = allAuctions.filter(a => a.status === 'active' || a.status === 'approved').length;
        const pendingAuctions = allAuctions.filter(a => a.status === 'pending').length;
        const soldAuctions = allAuctions.filter(a => a.status === 'sold').length;
        const totalRevenue = allAuctions
            .filter(a => a.status === 'sold')
            .reduce((sum, a) => sum + parseFloat(a.locked_price || a.current_bid || 0), 0);
        
        return { totalAuctions, activeAuctions, pendingAuctions, soldAuctions, totalRevenue };
    }, [allAuctions]);

    const fetchVendorAuctions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/vendor/auctions`);
            setAllAuctions(response.data);
        } catch (err) { setError('Failed to fetch your auctions.'); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchVendorAuctions(); }, [fetchVendorAuctions]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => setFormData({ ...formData, itemImage: e.target.files[0] });

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!formData.itemImage || !formData.startTime || !formData.endTime) {
            setError('Please fill all fields, including start/end times and an image.'); return;
        }
        const submissionData = new FormData();
        Object.keys(formData).forEach(key => submissionData.append(key, formData[key]));
        submissionData.append('vendorId', user.id);
        try {
            await apiClient.post('/vendor/upload', submissionData);
            setIsModalOpen(false);
            fetchVendorAuctions(); // Refetch all auctions to show the new one
        } catch (err) { setError(err.response?.data?.message || 'Failed to create auction.'); }
    };

    const handleDelete = async (auctionId) => {
        if (window.confirm("Are you sure? This action cannot be undone.")) {
            try {
                await apiClient.delete(`/vendor/auctions/${auctionId}`);
                setAllAuctions(prev => prev.filter(auction => auction.id !== auctionId));
                alert("Auction deleted successfully.");
            } catch (err) {
                alert(err.response?.data?.message || "Failed to delete auction.");
            }
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">My Auctions</h1>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                    <Plus className="h-5 w-5 mr-2" /> Create New Auction
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Auctions</p>
                            <p className="text-2xl font-bold text-gray-800">{statistics.totalAuctions}</p>
                        </div>
                        <Package className="h-10 w-10 text-blue-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-gray-800">{statistics.activeAuctions}</p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-green-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-800">{statistics.pendingAuctions}</p>
                        </div>
                        <Clock className="h-10 w-10 text-yellow-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Sold</p>
                            <p className="text-2xl font-bold text-gray-800">{statistics.soldAuctions}</p>
                        </div>
                        <Package className="h-10 w-10 text-purple-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-600">${statistics.totalRevenue.toFixed(2)}</p>
                        </div>
                        <DollarSign className="h-10 w-10 text-green-600 opacity-50" />
                    </div>
                </div>
            </div>

            {loading && <p className="text-center py-10">Loading...</p>}
            {error && <p className="text-center py-10 text-red-500">{error}</p>}

            {!loading && !error && (
                <>
                    <h2 className="text-2xl font-bold text-gray-700 mt-8 mb-4">Active & Pending Auctions</h2>
                    {liveAuctions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{liveAuctions.map(auction => <AuctionCard key={auction.id} auction={auction} onDelete={handleDelete} />)}</div>
                    ) : <p className="text-gray-500">You have no active or pending auctions.</p>}

                    <h2 className="text-2xl font-bold text-gray-700 mt-12 mb-4">Past Auctions</h2>
                    {pastAuctions.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{pastAuctions.map(auction => <AuctionCard key={auction.id} auction={auction} onDelete={handleDelete} isPast />)}</div>
                    ) : <p className="text-gray-500">You have no past auctions.</p>}
                </>
            )}

            {isModalOpen && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                     <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
                         <h2 className="text-2xl font-bold mb-4">New Auction Item</h2>
                         {error && <p className="text-red-500 mb-4">{error}</p>}
                         <form onSubmit={handleFormSubmit} className="space-y-4">
                             <input type="text" name="itemName" placeholder="Item Name" onChange={handleInputChange} required className="w-full px-3 py-2 border rounded"/>
                             <textarea name="description" placeholder="Description" onChange={handleInputChange} required className="w-full px-3 py-2 border rounded"></textarea>
                             <input type="number" name="minBid" placeholder="Minimum Bid ($)" onChange={handleInputChange} required className="w-full px-3 py-2 border rounded"/>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                    <input type="datetime-local" name="startTime" onChange={handleInputChange} required className="mt-1 w-full px-3 py-2 border rounded"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                                    <input type="datetime-local" name="endTime" onChange={handleInputChange} required className="mt-1 w-full px-3 py-2 border rounded"/>
                                </div>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700">Item Image</label>
                                 <input type="file" name="itemImage" onChange={handleFileChange} required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                             </div>
                             <div className="flex justify-end space-x-4 pt-2">
                                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                                 <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Submit for Approval</button>
                             </div>
                         </form>
                     </motion.div>
                 </motion.div>
            )}
        </div>
    );
};

export default VendorDashboard;