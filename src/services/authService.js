import axios from 'axios';

// Chúng ta sẽ dùng URL thô từ ENV, nhưng vẫn qua Proxy để tránh CORS
const RAW_TOKEN_URL = import.meta.env.VITE_URL_GET_TOKEN || '';
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET || '';
const SCOPE = import.meta.env.VITE_SCOPE || 'https://service.flow.microsoft.com/.default';

export const authService = {
    getAccessToken: async () => {
        if (!RAW_TOKEN_URL || !CLIENT_ID || !CLIENT_SECRET) {
            console.error('Lỗi: Thiếu cấu hình Environment Variables cho Token API.');
            throw new Error('Missing Auth Config');
        }
        try {
            // Nếu là môi trường phát triển (DEV), dùng Proxy để tránh CORS
            // Nếu là môi trường Production (GitHub Pages), dùng URL trực tiếp (Yêu cầu API phải hỗ trợ CORS)
            const isDev = import.meta.env.DEV;
            const tokenPath = isDev
                ? RAW_TOKEN_URL.replace('https://login.microsoftonline.com', '/ms-login')
                : RAW_TOKEN_URL;

            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', CLIENT_ID);
            params.append('client_secret', CLIENT_SECRET);
            params.append('scope', SCOPE);

            const response = await axios.post(tokenPath, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return response.data.access_token;
        } catch (error) {
            console.error('Lỗi khi lấy Access Token:', error.response?.data || error.message);
            throw error;
        }
    }
};
