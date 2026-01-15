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
            console.log('⏳ Đang đợi Token từ request song song...');
            return tokenRequestPromise;
        }

        if (!RAW_TOKEN_URL) {
            console.error('Lỗi: Thiếu cấu hình Environment Variables cho Token API.');
            throw new Error('Missing Auth Config');
        }

        // 3. Thực hiện lấy token mới và khóa lại (promise lock)
        tokenRequestPromise = (async () => {
            try {
                console.log('🔑 Đang yêu cầu Token mới từ Proxy Server...');
                const response = await axios.post(RAW_TOKEN_URL);

                cachedToken = response.data.access_token;
                tokenExpiry = Date.now() + (response.data.expires_in * 1000);

                console.log('✅ Đã lấy Token thành công. Hết hạn sau:', Math.round(response.data.expires_in / 60), 'phút');
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
