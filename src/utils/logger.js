/**
 * Logger Utility - Chỉ log trong Development mode
 * Production sẽ không hiển thị debug logs
 */

const isDev = import.meta.env.DEV;

export const logger = {
    /**
     * Debug log - Chỉ hiển thị trong DEV
     */
    debug: (...args) => {
        if (isDev) console.log(...args);
    },

    /**
     * Info log - Chỉ hiển thị trong DEV
     */
    info: (...args) => {
        if (isDev) console.info(...args);
    },

    /**
     * Warning log - Chỉ hiển thị trong DEV
     */
    warn: (...args) => {
        if (isDev) console.warn(...args);
    },

    /**
     * Error log - Luôn hiển thị (cần thiết cho debugging production)
     */
    error: (...args) => {
        console.error(...args);
    }
};

export default logger;
