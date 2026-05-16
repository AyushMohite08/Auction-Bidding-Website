// src/pages/Contact.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import Footer from '../components/Footer';
import Toast from '../components/Toast';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [toast, setToast] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            setToast({ type: 'error', message: 'Please fill in all fields' });
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setToast({ type: 'error', message: 'Please enter a valid email address' });
            return;
        }

        // Simulate form submission
        console.log('Form submitted:', formData);
        setToast({ type: 'success', message: 'Message sent successfully! We\'ll get back to you soon.' });
        
        // Reset form
        setFormData({
            name: '',
            email: '',
            subject: '',
            message: ''
        });
    };

    const contactInfo = [
        {
            icon: <MapPin className="h-6 w-6" />,
            title: "Visit Us",
            details: ["123 Auction Street", "Business District", "New York, NY 10001"],
            color: "bg-blue-500"
        },
        {
            icon: <Phone className="h-6 w-6" />,
            title: "Call Us",
            details: ["+1 (234) 567-890", "+1 (234) 567-891"],
            link: "tel:+1234567890",
            color: "bg-indigo-500"
        },
        {
            icon: <Mail className="h-6 w-6" />,
            title: "Email Us",
            details: ["support@auctionhub.com", "info@auctionhub.com"],
            link: "mailto:support@auctionhub.com",
            color: "bg-purple-500"
        },
        {
            icon: <Clock className="h-6 w-6" />,
            title: "Business Hours",
            details: ["Mon - Fri: 9:00 AM - 6:00 PM", "Sat - Sun: 10:00 AM - 4:00 PM"],
            color: "bg-pink-500"
        }
    ];

    const socialLinks = [
        { icon: <Facebook className="h-5 w-5" />, name: "Facebook", link: "#", color: "hover:bg-blue-600" },
        { icon: <Twitter className="h-5 w-5" />, name: "Twitter", link: "#", color: "hover:bg-sky-500" },
        { icon: <Instagram className="h-5 w-5" />, name: "Instagram", link: "#", color: "hover:bg-pink-600" },
        { icon: <Linkedin className="h-5 w-5" />, name: "LinkedIn", link: "#", color: "hover:bg-blue-700" }
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
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">Get In Touch</h1>
                        <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-20 relative z-10 mb-16">
                        {contactInfo.map((info, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                            >
                                <div className={`${info.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4`}>
                                    {info.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">{info.title}</h3>
                                {info.details.map((detail, i) => (
                                    <p key={i} className="text-gray-600 text-sm">
                                        {info.link ? (
                                            <a href={info.link} className="hover:text-blue-600 transition-colors">
                                                {detail}
                                            </a>
                                        ) : (
                                            detail
                                        )}
                                    </p>
                                ))}
                            </motion.div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Subject *
                                        </label>
                                        <input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="How can we help you?"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Message *
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows="6"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                            placeholder="Tell us what's on your mind..."
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                    >
                                        <Send className="h-5 w-5" />
                                        Send Message
                                    </button>
                                </form>
                            </div>
                        </motion.div>

                        {/* Map and Social */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            {/* Map Placeholder */}
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Location</h3>
                                <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                                        <p className="text-gray-600 font-medium">Map View</p>
                                        <p className="text-sm text-gray-500 mt-2">123 Auction Street, NY 10001</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 mt-4 text-sm">
                                    Visit our office during business hours. We're conveniently located in the heart of the business district with ample parking available.
                                </p>
                            </div>

                            {/* Social Media */}
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect With Us</h3>
                                <p className="text-gray-600 mb-6">
                                    Follow us on social media for the latest updates, featured auctions, and community news.
                                </p>
                                <div className="flex gap-4">
                                    {socialLinks.map((social, index) => (
                                        <a
                                            key={index}
                                            href={social.link}
                                            className={`w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 ${social.color} hover:text-white transition-all`}
                                            title={social.name}
                                        >
                                            {social.icon}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* FAQ Link */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
                                <h3 className="text-2xl font-bold mb-4">Need Quick Answers?</h3>
                                <p className="mb-6 opacity-90">
                                    Check out our FAQ section for answers to common questions about bidding, selling, and platform features.
                                </p>
                                <a
                                    href="/#faq"
                                    className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                                >
                                    View FAQ
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            <Footer />
        </div>
    );
};

export default Contact;
