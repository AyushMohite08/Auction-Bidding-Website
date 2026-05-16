// src/components/CountdownTimer.jsx
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CountdownTimer = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const end = new Date(endTime);
            const now = new Date();
            const difference = end - now;

            if (difference <= 0) {
                setIsExpired(true);
                setTimeLeft('Expired');
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [endTime]);

    return (
        <div className={`flex items-center ${isExpired ? 'text-red-500' : 'text-gray-600'}`}>
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{timeLeft}</span>
        </div>
    );
};

export default CountdownTimer;
