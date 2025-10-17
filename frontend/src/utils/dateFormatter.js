// src/utils/dateFormatter.js

/**
 * Format date to DD/MM/YYYY format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
};

/**
 * Format date and time to DD/MM/YYYY HH:MM format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date-time string
 */
export const formatDateTime = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};
