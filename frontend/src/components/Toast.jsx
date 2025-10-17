// src/components/Toast.jsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-600" />,
        error: <XCircle className="h-5 w-5 text-red-600" />,
        warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        info: <Info className="h-5 w-5 text-blue-600" />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200',
        info: 'bg-blue-50 border-blue-200'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-4 left-1/2 transform z-50 ${bgColors[type]} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md`}
        >
            <div className="flex items-center space-x-3">
                {icons[type]}
                <p className="text-gray-800 flex-1">{message}</p>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    ×
                </button>
            </div>
        </motion.div>
    );
};

export default Toast;
