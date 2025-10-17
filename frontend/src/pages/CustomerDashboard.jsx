// src/pages/CustomerDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Search, Trophy, History, TrendingUp, Target, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import CountdownTimer from '../components/CountdownTimer';
import { formatDate, formatDateTime } from '../utils/dateFormatter';

const AuctionCard = ({ auction, isPast = false }) => {
    const displayPrice = auction.locked_price || auction.current_bid || auction.min_bid;
    const priceLabel = isPast 
        ? (auction.status === 'sold' ? 'Sold For' : 'Final Bid')
        : (auction.current_bid ? 'Current Bid' : 'Starting Bid');
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`bg-white rounded-lg shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow ${isPast ? 'opacity-75' : ''}`}
        >
            <div className="relative">
                <img src={`http://localhost:3000${auction.image_url}`} alt={auction.item_name} className="w-full h-56 object-cover"/>
                {!isPast && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
                        <CountdownTimer endTime={auction.end_time} />
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{auction.item_name}</h3>
                <p className="text-gray-600 flex-grow text-sm mb-4 line-clamp-2">{auction.description}</p>
                {isPast && (
                    <>
                        {auction.status === 'sold' && auction.winner_name && (
                            <p className="text-sm font-semibold text-green-600 mb-2 flex items-center">
                                <span className="mr-1">🏆</span> Won by: {auction.winner_name}
                            </p>
                        )}
                        {auction.status === 'expired' && (
                            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                                <span className="mr-1">⏰</span> Expired (No bids)
                            </p>
                        )}
                    </>
                )}
                <div className="mt-auto">
                    <p className="text-xs text-gray-500 mb-1">{priceLabel}</p>
                    <div className="flex justify-between items-center font-bold text-lg mb-3">
                        <span className="text-green-600">${parseFloat(displayPrice).toFixed(2)}</span>
                    </div>
                    <Link to={`/auction/${auction.id}`} className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        <Eye className="h-4 w-4 mr-2" />
                        {isPast ? 'View Details' : 'View & Bid'}
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

const CustomerDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('live'); // 'live', 'past', 'myBids', 'myWins'
    const [searchTerm, setSearchTerm] = useState('');
    const [allAuctions, setAllAuctions] = useState([]);
    const [bidHistory, setBidHistory] = useState([]);
    const [myWins, setMyWins] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAuctions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/auctions');
            setAllAuctions(response.data);
        } catch (err) {
            setError("Failed to load auctions.");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCustomerData = useCallback(async () => {
        // Wait for auth to finish loading
        if (authLoading) {
            console.log('⏳ Auth still loading, waiting...');
            return;
        }
        
        if (!user) {
            console.log('❌ No user found in fetchCustomerData');
            return;
        }
        
        console.log('👤 User object:', JSON.stringify(user, null, 2));
        console.log('🆔 User ID:', user.id);
        
        if (!user.id) {
            console.error('❌ User ID is missing from user object');
            console.error('Available user properties:', Object.keys(user));
            return;
        }
        
        try {
            console.log(`🚀 Fetching customer data for user ID: ${user.id}`);
            
            // Fetch bid history
            console.log('📊 Fetching bid history...');
            const bidHistoryResponse = await apiClient.get(`/customer/${user.id}/bid-history`);
            console.log('✅ Bid history response:', bidHistoryResponse.data);
            setBidHistory(bidHistoryResponse.data || []);

            // Fetch wins
            console.log('🏆 Fetching wins...');
            const winsResponse = await apiClient.get(`/customer/${user.id}/wins`);
            console.log('✅ Wins response:', winsResponse.data);
            setMyWins(winsResponse.data || []);

            // Fetch statistics
            console.log('📈 Fetching stats...');
            const statsResponse = await apiClient.get(`/customer/${user.id}/stats`);
            console.log('✅ Stats response:', statsResponse.data);
            setStats(statsResponse.data);
            
            console.log('🎉 All customer data loaded successfully!');
        } catch (err) {
            console.error("❌ Failed to load customer data:", err);
            console.error("❌ Error response:", err.response?.data);
            console.error("❌ Error status:", err.response?.status);
            console.error("❌ Full error:", err);
        }
    }, [user, authLoading]);

    useEffect(() => { 
        fetchAuctions(); 
        fetchCustomerData();
    }, [fetchAuctions, fetchCustomerData]);

    const { liveAuctions, pastAuctions } = useMemo(() => {
        const filtered = allAuctions.filter(a => 
            a.item_name.toLowerCase().includes(searchTerm.toLowerCase()) && a.status !== 'pending'
        );
        const live = filtered.filter(a => a.status === 'active' || a.status === 'approved');
        const past = filtered.filter(a => a.status === 'sold' || a.status === 'expired' || a.status === 'rejected');
        return { liveAuctions: live, pastAuctions: past };
    }, [allAuctions, searchTerm]);

    const filteredBidHistory = useMemo(() => {
        return bidHistory.filter(bid =>
            bid.item_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [bidHistory, searchTerm]);

    const filteredWins = useMemo(() => {
        return myWins.filter(win =>
            win.item_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [myWins, searchTerm]);

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Customer Dashboard</h1>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Target className="h-8 w-8 opacity-80" />
                        </div>
                        <p className="text-2xl font-bold">{stats.total_auctions_participated}</p>
                        <p className="text-sm opacity-90">Auctions Joined</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-4 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="h-8 w-8 opacity-80" />
                        </div>
                        <p className="text-2xl font-bold">{stats.total_bids_placed}</p>
                        <p className="text-sm opacity-90">Total Bids</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Trophy className="h-8 w-8 opacity-80" />
                        </div>
                        <p className="text-2xl font-bold">{stats.total_wins}</p>
                        <p className="text-sm opacity-90">Auctions Won</p>
                    </motion.div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('live')}
                    className={`px-6 py-3 font-semibold transition-all ${
                        activeTab === 'live'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-blue-600'
                    }`}
                >
                    Live Auctions
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`px-6 py-3 font-semibold transition-all ${
                        activeTab === 'past'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-blue-600'
                    }`}
                >
                    Past Auctions
                </button>
                <button
                    onClick={() => setActiveTab('myBids')}
                    className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
                        activeTab === 'myBids'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-blue-600'
                    }`}
                >
                    <History className="h-4 w-4" />
                    My Bid History
                </button>
                <button
                    onClick={() => setActiveTab('myWins')}
                    className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
                        activeTab === 'myWins'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-blue-600'
                    }`}
                >
                    <Trophy className="h-4 w-4" />
                    My Wins
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Search for items..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"/>
            </div>

            {loading && <p className="text-center py-10">Loading...</p>}
            {error && <p className="text-center py-10 text-red-500">{error}</p>}
            
            {!loading && !error && (
                <>
                    {/* Live Auctions Tab */}
                    {activeTab === 'live' && (
                        <>
                            <h2 className="text-2xl font-bold text-gray-700 mb-4">Live Auctions</h2>
                            {liveAuctions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {liveAuctions.map((auction) => <AuctionCard key={auction.id} auction={auction} />)}
                                </div>
                            ) : <p className="text-gray-500">No live auctions match your search.</p>}
                        </>
                    )}

                    {/* Past Auctions Tab */}
                    {activeTab === 'past' && (
                        <>
                            <h2 className="text-2xl font-bold text-gray-700 mb-4">Past Auctions</h2>
                            {pastAuctions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {pastAuctions.map((auction) => <AuctionCard key={auction.id} auction={auction} isPast />)}
                                </div>
                            ) : <p className="text-gray-500">No past auctions match your search.</p>}
                        </>
                    )}

                    {/* My Bid History Tab */}
                    {activeTab === 'myBids' && (
                        <>
                            <h2 className="text-2xl font-bold text-gray-700 mb-4">My Bid History</h2>
                            {filteredBidHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredBidHistory.map((bid) => (
                                        <motion.div
                                            key={bid.bid_id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
                                                bid.is_highest_bid ? 'border-2 border-green-500' : ''
                                            }`}
                                        >
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <img 
                                                    src={`http://localhost:3000${bid.image_url}`} 
                                                    alt={bid.item_name}
                                                    className="w-full md:w-32 h-32 object-cover rounded-lg"
                                                />
                                                <div className="flex-grow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900">{bid.item_name}</h3>
                                                            <p className="text-sm text-gray-600">Vendor: {bid.vendor_name}</p>
                                                        </div>
                                                        {bid.is_highest_bid && bid.status === 'active' && (
                                                            <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                                                                🏆 Highest Bid
                                                            </span>
                                                        )}
                                                        {bid.winner_user_id === user?.id && bid.status === 'sold' && (
                                                            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                                                                ✨ You Won!
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Your Bid</p>
                                                            <p className="text-lg font-bold text-blue-600">${parseFloat(bid.bid_amount).toFixed(2)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Highest Bid</p>
                                                            <p className="text-lg font-bold text-green-600">${parseFloat(bid.highest_bid).toFixed(2)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Status</p>
                                                            <p className={`text-sm font-semibold ${
                                                                bid.status === 'sold' ? 'text-red-600' :
                                                                bid.status === 'active' ? 'text-green-600' :
                                                                'text-gray-600'
                                                            }`}>
                                                                {bid.status === 'sold' ? 'Ended' : 
                                                                 bid.status === 'active' ? 'Active' : 
                                                                 bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Bid Time</p>
                                                            <p className="text-sm font-semibold text-gray-700">
                                                                {formatDateTime(bid.bid_time)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4">
                                                        <Link 
                                                            to={`/auction/${bid.auction_id}`}
                                                            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View Auction Details
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No bid history found.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* My Wins Tab */}
                    {activeTab === 'myWins' && (
                        <>
                            <h2 className="text-2xl font-bold text-gray-700 mb-4">My Wins 🏆</h2>
                            {filteredWins.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredWins.map((win) => (
                                        <motion.div
                                            key={win.auction_id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-gradient-to-r from-yellow-50 to-white rounded-lg shadow-md p-6 border-2 border-yellow-400 hover:shadow-lg transition-shadow"
                                        >
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <img 
                                                    src={`http://localhost:3000${win.image_url}`} 
                                                    alt={win.item_name}
                                                    className="w-full md:w-32 h-32 object-cover rounded-lg"
                                                />
                                                <div className="flex-grow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                                                <Trophy className="h-5 w-5 text-yellow-500" />
                                                                {win.item_name}
                                                            </h3>
                                                            <p className="text-sm text-gray-600">Vendor: {win.vendor_name}</p>
                                                            <p className="text-xs text-gray-500">Contact: {win.vendor_email}</p>
                                                        </div>
                                                        <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                            WON
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm mb-4">{win.description}</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Winning Price</p>
                                                            <p className="text-xl font-bold text-green-600">
                                                                ${parseFloat(win.locked_price || win.current_bid).toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">My Winning Bid</p>
                                                            <p className="text-lg font-bold text-blue-600">
                                                                ${parseFloat(win.my_winning_bid).toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Won On</p>
                                                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                {formatDate(win.end_time)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex gap-4">
                                                        <Link 
                                                            to={`/auction/${win.auction_id}`}
                                                            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View Details
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">You haven't won any auctions yet.</p>
                                    <p className="text-sm text-gray-400 mt-2">Keep bidding to win amazing items!</p>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default CustomerDashboard;