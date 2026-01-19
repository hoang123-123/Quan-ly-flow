import axios from 'axios';

// Biến môi trường lấy từ .env.local
const RAW_TOKEN_URL = import.meta.env.VITE_URL_GET_TOKEN || '';



let cachedToken = null;
let tokenExpiry = 0;
let tokenRequestPromise = null;

export const authService = {
    getAccessToken: async () => {
        const now = Date.now();

        // 1. Kiểm tra cache
        if (cachedToken && now < (tokenExpiry - 300000)) {
            return cachedToken;
        }

        // 2. Nếu đang có một request lấy token đang chạy, trả về promise đó
        if (tokenRequestPromise) {

            return tokenRequestPromise;
        }

        if (!RAW_TOKEN_URL) {
            console.error('Lỗi: Thiếu cấu hình Environment Variables cho Token API.');
            throw new Error('Missing Auth Config');
        }

        // 3. Thực hiện lấy token mới và khóa lại (promise lock)
        tokenRequestPromise = (async () => {
            try {

                const response = await axios.post(RAW_TOKEN_URL);

                cachedToken = response.data.access_token;
                tokenExpiry = Date.now() + (response.data.expires_in * 1000);


                return cachedToken;
            } catch (error) {
                console.error('❌ Lỗi khi lấy Access Token:', error.response?.data || error.message);
                throw error;
            } finally {
                // Giải phóng khóa sau khi xong
                tokenRequestPromise = null;
            }
        })();

        return tokenRequestPromise;
    }
};
