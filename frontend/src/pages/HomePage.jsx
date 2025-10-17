// src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Gavel, Shield, Zap, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../api/apiClient';
import CountdownTimer from '../components/CountdownTimer';
import Footer from '../components/Footer';

const HomePage = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openFaq, setOpenFaq] = useState(null);

    const fetchAuctions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/auctions');
            const now = new Date();
            const liveAuctions = response.data.filter(auction => 
                (auction.status === 'active' || auction.status === 'approved') && 
                new Date(auction.end_time) > now
            );
            setAuctions(liveAuctions.slice(0, 6)); // Show only 6 featured auctions
        } catch (err) {
            setError('Failed to load auctions.');
            console.error('Error fetching homepage auctions:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAuctions();
    }, [fetchAuctions]);

    const features = [
        {
            icon: <Gavel className="h-12 w-12 text-blue-600" />,
            title: "Live Bidding",
            description: "Participate in real-time auctions with instant bid updates and notifications"
        },
        {
            icon: <Shield className="h-12 w-12 text-green-600" />,
            title: "Secure Transactions",
            description: "Your data and transactions are protected with enterprise-grade security"
        },
        {
            icon: <Zap className="h-12 w-12 text-yellow-600" />,
            title: "Instant Notifications",
            description: "Get real-time alerts when you're outbid or when auctions are ending"
        },
        {
            icon: <TrendingUp className="h-12 w-12 text-purple-600" />,
            title: "Track Your Bids",
            description: "Monitor all your active and past bids from a centralized dashboard"
        }
    ];

    const faqs = [
        {
            question: "How do I start bidding?",
            answer: "Simply register for an account, browse available auctions, and click 'Place Bid' on any item you're interested in. Make sure your bid is higher than the current bid!"
        },
        {
            question: "How do I know if I've won an auction?",
            answer: "When an auction ends, the highest bidder automatically wins. You'll see the item in your 'Past Auctions' section with your name as the winner. Vendors may also choose to lock the auction early."
        },
        {
            question: "Can I sell items on this platform?",
            answer: "Yes! Register as a vendor, create your auction listing with images and details, and submit it for admin approval. Once approved, your auction will go live."
        },
        {
            question: "What happens if no one bids on my auction?",
            answer: "If an auction expires without any bids, it will be marked as 'expired' and won't count toward revenue. You can create a new auction with adjusted pricing."
        },
        {
            question: "How does the countdown timer work?",
            answer: "Each auction has a set end time. The countdown shows how much time is left. When it reaches zero, bidding automatically closes and the highest bidder wins."
        },
        {
            question: "Can vendors end an auction early?",
            answer: "Yes! Vendors can 'lock' an active auction at any time, which immediately sells the item to the highest bidder at that moment."
        }
    ];

    return (
        <div className="bg-white">
            {/* Hero Section - Enhanced */}
            <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute transform rotate-45 -top-40 -right-40 w-80 h-80 bg-white rounded-full"></div>
                    <div className="absolute transform -rotate-45 -bottom-40 -left-40 w-96 h-96 bg-white rounded-full"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
                            Discover Amazing
                            <span className="block text-yellow-400">Auction Deals</span>
                        </h1>
                        <p className="text-xl sm:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                            Join thousands of buyers and sellers in the most trusted online auction platform
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/register" className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg">
                                Start Bidding Now
                            </Link>
                            <Link to="/login" className="bg-white/10 backdrop-blur-sm border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/20 transition-all">
                                Sign In
                            </Link>
                        </div>
                        <div className="mt-12 flex justify-center gap-8 sm:gap-12 text-sm sm:text-base">
                            <div className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                    <Users className="h-5 w-5 mr-2" />
                                    <span className="text-2xl font-bold">10K+</span>
                                </div>
                                <p className="text-blue-200">Active Users</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                    <Gavel className="h-5 w-5 mr-2" />
                                    <span className="text-2xl font-bold">5K+</span>
                                </div>
                                <p className="text-blue-200">Auctions Daily</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                    <TrendingUp className="h-5 w-5 mr-2" />
                                    <span className="text-2xl font-bold">98%</span>
                                </div>
                                <p className="text-blue-200">Success Rate</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
                        <p className="text-xl text-gray-600">Everything you need for successful online auctions</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                            >
                                <div className="mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Featured Auctions Section */}
            <div className="max-w-7xl mx-auto py-20 px-4">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Live Auctions</h2>
                    <p className="text-xl text-gray-600">Don't miss out on these amazing deals</p>
                </div>
                {loading && <p className="text-center py-10 text-gray-500">Loading auctions...</p>}
                {error && <p className="text-center py-10 text-red-500">{error}</p>}
                {!loading && !error && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                            {auctions.map((auction, index) => (
                                <motion.div
                                    key={auction.id}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                                >
                                    <div className="relative">
                                        <img src={`http://localhost:3000${auction.image_url}`} alt={auction.item_name} className="w-full h-56 object-cover"/>
                                        <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                            <span className="animate-pulse">●</span> LIVE
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{auction.item_name}</h3>
                                        <p className="text-gray-600 mb-4 h-12 overflow-hidden line-clamp-2">{auction.description}</p>
                                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm text-gray-500">{auction.current_bid ? 'Current Bid' : 'Starting Bid'}</span>
                                                <CountdownTimer endTime={auction.end_time} />
                                            </div>
                                            <div className="flex items-center text-green-600">
                                                <DollarSign className="h-6 w-6 mr-1"/>
                                                <span className="text-2xl font-bold">
                                                    {auction.current_bid ? parseFloat(auction.current_bid).toFixed(2) : parseFloat(auction.min_bid).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                        <Link to={`/auction/${auction.id}`} className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                            Place Bid Now
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        {auctions.length > 0 && (
                            <div className="text-center">
                                <Link to="/customer-dashboard" className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                                    View All Auctions →
                                </Link>
                            </div>
                        )}
                        {auctions.length === 0 && (
                            <div className="text-center py-12">
                                <Gavel className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-xl text-gray-500">No live auctions at the moment.</p>
                                <p className="text-gray-400 mt-2">Check back soon for exciting new items!</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* FAQ Section */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-20">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                        <p className="text-xl text-gray-600">Everything you need to know about our platform</p>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-lg shadow-md overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-semibold text-gray-900 text-lg">{faq.question}</span>
                                    {openFaq === index ? (
                                        <ChevronUp className="h-5 w-5 text-blue-600" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                                {openFaq === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="px-6 pb-4"
                                    >
                                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-4">Ready to Start Your Auction Journey?</h2>
                    <p className="text-xl text-blue-100 mb-8">Join our community today and discover amazing deals!</p>
                    <Link to="/register" className="inline-block bg-yellow-400 text-gray-900 px-10 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg">
                        Create Free Account
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default HomePage;