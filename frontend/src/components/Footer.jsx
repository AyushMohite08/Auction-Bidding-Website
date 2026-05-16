// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Gavel } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-300">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div>
                        <div className="flex items-center mb-4">
                            <Gavel className="h-8 w-8 text-blue-500 mr-2" />
                            <h3 className="text-2xl font-bold text-white">AuctionHub</h3>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Your trusted platform for online auctions. Discover unique items and great deals every day.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="hover:text-blue-500 transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="hover:text-blue-500 transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="hover:text-blue-500 transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="hover:text-blue-500 transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold text-lg mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="hover:text-blue-500 transition-colors">Home</Link>
                            </li>
                            <li>
                                <Link to="/about" className="hover:text-blue-500 transition-colors">About Us</Link>
                            </li>
                            <li>
                                <Link to="/customer-dashboard" className="hover:text-blue-500 transition-colors">Browse Auctions</Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-blue-500 transition-colors">Contact Us</Link>
                            </li>
                            <li>
                                <Link to="/register" className="hover:text-blue-500 transition-colors">Sign Up</Link>
                            </li>
                        </ul>
                    </div>

                    {/* For Sellers */}
                    <div>
                        <h4 className="text-white font-semibold text-lg mb-4">For Sellers</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/vendor-dashboard" className="hover:text-blue-500 transition-colors">Vendor Dashboard</Link>
                            </li>
                            <li>
                                <Link to="/register" className="hover:text-blue-500 transition-colors">Become a Seller</Link>
                            </li>
                            <li>
                                <a href="#faq" className="hover:text-blue-500 transition-colors">How It Works</a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-blue-500 transition-colors">Seller Guidelines</a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-blue-500 transition-colors">Success Stories</a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-white font-semibold text-lg mb-4">Contact Us</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <MapPin className="h-5 w-5 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                                <span className="text-gray-400">123 Auction Street, Business District, NY 10001</span>
                            </li>
                            <li className="flex items-center">
                                <Phone className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" />
                                <a href="tel:+1234567890" className="text-gray-400 hover:text-blue-500 transition-colors">
                                    +1 (234) 567-890
                                </a>
                            </li>
                            <li className="flex items-center">
                                <Mail className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" />
                                <a href="mailto:support@auctionhub.com" className="text-gray-400 hover:text-blue-500 transition-colors">
                                    support@auctionhub.com
                                </a>
                            </li>
                        </ul>
                        <div className="mt-4">
                            <p className="text-sm text-gray-400">
                                <strong className="text-white">Business Hours:</strong><br />
                                Mon - Fri: 9:00 AM - 6:00 PM<br />
                                Sat - Sun: 10:00 AM - 4:00 PM
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 text-sm mb-4 md:mb-0">
                            &copy; {currentYear} AuctionHub. All rights reserved.
                        </p>
                        <div className="flex space-x-6 text-sm">
                            <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors">Privacy Policy</a>
                            <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors">Terms of Service</a>
                            <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
