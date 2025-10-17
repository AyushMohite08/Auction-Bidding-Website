// src/pages/AuctionDetails.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ArrowLeft, Lock, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import CountdownTimer from '../components/CountdownTimer';
import Toast from '../components/Toast';
import { formatDateTime } from '../utils/dateFormatter';

const AuctionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [auction, setAuction] = useState(null);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const fetchDetails = useCallback(async () => {
        // No need to set loading true here if we do it before the call
        try {
            const [auctionRes, bidsRes] = await Promise.all([
                apiClient.get(`/auctions/${id}`),
                apiClient.get(`/auctions/${id}/bids`)
            ]);
            setAuction(auctionRes.data);
            setBids(bidsRes.data);
            const startingBid = auctionRes.data.current_bid || auctionRes.data.min_bid;
            setBidAmount((parseFloat(startingBid) + 1).toFixed(2));
        } catch (err) {
            setError("Failed to load auction data.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleBidSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/customer/bid', {
                auctionId: id,
                userId: user.id,
                newBidAmount: parseFloat(bidAmount),
            });
            showToast('Bid placed successfully!', 'success');
            fetchDetails(); // Refresh to show the new bid
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to place bid.', 'error');
        }
    };

    const handleLockAuction = async () => {
        if (window.confirm("Are you sure? This will sell the item to the highest bidder.")) {
            try {
                await apiClient.post(`/vendor/auctions/${id}/lock`);
                showToast('Auction locked successfully!', 'success');
                fetchDetails(); // Refresh to show the new 'sold' status
            } catch (err) {
                showToast(err.response?.data?.message || "Failed to lock auction.", 'error');
            }
        }
    };

    if (loading) return <div className="text-center py-10">Loading...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
    if (!auction) return <div className="text-center py-10">Auction not found.</div>;

    const isOwner = user && user.id === auction.vendor_id;
    const currentTime = new Date();
    const endTime = new Date(auction.end_time);
    const isTimeExpired = endTime < currentTime;
    const isAuctionActive = !isTimeExpired && (auction.status === 'active' || auction.status === 'approved') && !auction.locked_price;
    const images = auction.image_url ? [`http://localhost:3000${auction.image_url}`] : [];
    const displayPrice = auction.locked_price || auction.current_bid || auction.min_bid;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>
            
            <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6">
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-lg overflow-hidden">
                        {images.length > 0 && <img src={images[0]} alt={auction.item_name} className="w-full h-96 object-cover"/>}
                        <div className="p-6">
                            <h1 className="text-3xl font-bold text-gray-900">{auction.item_name}</h1>
                            <p className="text-gray-600 mt-4">{auction.description}</p>
                        </div>
                    </motion.div>
                </div>
                <div className="space-y-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-lg p-6">
                        {isAuctionActive ? (
                            <>
                                <div className="text-center mb-4">
                                    <p className="text-gray-600">{auction.current_bid ? 'Current Bid' : 'Starting Bid'}</p>
                                    <p className="text-4xl font-bold text-green-600">${parseFloat(displayPrice).toFixed(2)}</p>
                                    <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-gray-500">
                                        <span>Ends in:</span>
                                        <CountdownTimer endTime={auction.end_time} />
                                    </div>
                                </div>
                                {isOwner ? (
                                    bids.length > 0 && <button onClick={handleLockAuction} className="w-full flex justify-center items-center bg-green-600 text-white py-3 rounded-md hover:bg-green-700"><Lock className="h-5 w-5 mr-2" /> Lock Bid & Sell Now</button>
                                ) : (
                                    <form onSubmit={handleBidSubmit} className="space-y-4">
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
                                                min={(parseFloat(auction.current_bid || auction.min_bid) + 0.01).toFixed(2)} step="0.01" required
                                                className="w-full pl-10 pr-4 py-3 border rounded-md" />
                                        </div>
                                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700">Place Bid</button>
                                    </form>
                                )}
                            </>
                        ) : (
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600 mb-2">
                                    {auction.status === 'sold' ? '🏆 Auction Completed' : '⏰ Auction Ended'}
                                </p>
                                {auction.status === 'sold' && auction.winner_name ? (
                                    <div className="mt-3 p-4 bg-green-50 rounded-lg">
                                        <p className="text-lg">Sold to <strong className="text-green-700">{auction.winner_name}</strong></p>
                                        <p className="text-2xl font-bold text-green-600 mt-2">${parseFloat(displayPrice).toFixed(2)}</p>
                                        {auction.locked_price && <p className="text-xs text-gray-500 mt-1">(Locked by vendor)</p>}
                                    </div>
                                ) : auction.status === 'expired' ? (
                                    <p className="text-gray-500 mt-2">No bids were placed on this auction.</p>
                                ) : (
                                    <p className="text-gray-500 mt-2">This auction is no longer active.</p>
                                )}
                            </div>
                        )}
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><Award className="h-5 w-5 mr-2 text-yellow-500" /> Bid History</h2>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {bids.length > 0 ? bids.map((bid, index) => (
                                <div key={index} className={`flex justify-between items-center p-3 rounded-lg ${index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{bid.bidder_name}</p>
                                        <p className="text-xs text-gray-500">{formatDateTime(bid.created_at)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800">${parseFloat(bid.bid_amount).toFixed(2)}</p>
                                        {index === 0 && <p className="text-xs text-green-600 font-semibold">Highest Bid</p>}
                                    </div>
                                </div>
                            )) : <p className="text-gray-500 text-center py-4">No bids have been placed yet.</p>}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AuctionDetails;