// src/pages/AboutUs.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Gavel, Users, Shield, TrendingUp, Clock, Award } from 'lucide-react';
import Footer from '../components/Footer';

const AboutUs = () => {
    const features = [
        {
            icon: <Gavel className="h-8 w-8" />,
            title: "Live Auctions",
            description: "Real-time bidding system with instant updates and notifications."
        },
        {
            icon: <Shield className="h-8 w-8" />,
            title: "Secure Platform",
            description: "Advanced security measures to protect your transactions and data."
        },
        {
            icon: <Users className="h-8 w-8" />,
            title: "Trusted Community",
            description: "Join thousands of verified buyers and sellers worldwide."
        },
        {
            icon: <Clock className="h-8 w-8" />,
            title: "24/7 Support",
            description: "Round-the-clock customer service to assist you anytime."
        }
    ];

    const stats = [
        { label: "Active Users", value: "10,000+", icon: <Users className="h-6 w-6" /> },
        { label: "Daily Auctions", value: "5,000+", icon: <Gavel className="h-6 w-6" /> },
        { label: "Success Rate", value: "98%", icon: <Award className="h-6 w-6" /> },
        { label: "Years Active", value: "5+", icon: <TrendingUp className="h-6 w-6" /> }
    ];

    const howItWorks = [
        {
            step: "1",
            title: "Sign Up",
            description: "Create your free account as a buyer or seller in minutes.",
            color: "from-blue-500 to-blue-600"
        },
        {
            step: "2",
            title: "Browse or List",
            description: "Explore live auctions or create your own listings with ease.",
            color: "from-indigo-500 to-indigo-600"
        },
        {
            step: "3",
            title: "Bid & Win",
            description: "Place bids in real-time and win amazing items at great prices.",
            color: "from-purple-500 to-purple-600"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">About AuctionHub</h1>
                        <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
                            Connecting buyers and sellers through transparent, exciting, and secure online auctions.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-2xl shadow-lg p-8 md:p-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
                            Our Mission
                        </h2>
                        <p className="text-lg text-gray-700 leading-relaxed mb-4">
                            At AuctionHub, we believe that everyone deserves access to a fair, transparent, and exciting marketplace. 
                            Our mission is to revolutionize online auctions by providing a platform where buyers discover unique items 
                            at competitive prices, and sellers reach a global audience with ease.
                        </p>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            Founded in 2019, we've grown from a small startup to a trusted platform serving thousands of users daily. 
                            Our commitment to innovation, security, and customer satisfaction drives everything we do.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
                        Our Impact
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-xl transition-shadow"
                            >
                                <div className="flex justify-center text-blue-600 mb-3">
                                    {stat.icon}
                                </div>
                                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                                <p className="text-gray-600">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
                        How It Works
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {howItWorks.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="relative"
                            >
                                <div className={`bg-gradient-to-br ${item.color} rounded-2xl p-8 text-white h-full`}>
                                    <div className="text-6xl font-bold opacity-20 mb-4">{item.step}</div>
                                    <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                                    <p className="text-white/90">{item.description}</p>
                                </div>
                                {index < howItWorks.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300"></div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
                        Why Choose AuctionHub?
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all hover:-translate-y-1"
                            >
                                <div className="text-blue-600 mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
                        Our Core Values
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Transparency</h3>
                            <p className="text-gray-600">
                                Every bid, every transaction is visible and fair. No hidden fees, no surprises.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="h-8 w-8 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Community</h3>
                            <p className="text-gray-600">
                                Building a trusted network of buyers and sellers who support each other.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Innovation</h3>
                            <p className="text-gray-600">
                                Constantly improving our platform with cutting-edge features and technology.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
                        <p className="text-xl mb-8 opacity-90">
                            Join thousands of satisfied users and start your auction journey today!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/register"
                                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
                            >
                                Sign Up Now
                            </a>
                            <a
                                href="/contact"
                                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block"
                            >
                                Contact Us
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default AboutUs;
