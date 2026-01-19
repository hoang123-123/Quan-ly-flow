import axios from 'axios';

// Biến môi trường lấy từ .env.local
const TOKEN_URL_DATAVERSE = import.meta.env.VITE_API_TOKEN_DATAVERSE || '';
const TOKEN_URL_FLOW = import.meta.env.VITE_API_TOKEN_FLOW || '';

const CACHE = {
    DATAVERSE: { token: null, expiry: 0, promise: null },
    FLOW: { token: null, expiry: 0, promise: null }
};

export const authService = {
    /**
     * Lấy Access Token dựa trên loại (DATAVERSE hoặc FLOW)
     * @param {string} type - 'DATAVERSE' | 'FLOW'
     */
    getAccessToken: async (type = 'FLOW') => {
        const url = type === 'DATAVERSE' ? TOKEN_URL_DATAVERSE : TOKEN_URL_FLOW;
        const cache = CACHE[type] || CACHE.FLOW;

        if (!url) {
            console.error(`❌ [AuthService] Missing config for ${type} Token`);
            return null;
        }

        const now = Date.now();

        // 1. Kiểm tra cache
        if (cache.token && now < (cache.expiry - 300000)) { // Refresh trước 5 phút
            return cache.token;
        }

        // 2. Nếu đang có một request lấy token đang chạy, trả về promise đó
        if (cache.promise) {
            return cache.promise;
        }

        // 3. Thực hiện lấy token mới và khóa lại (promise lock)
        cache.promise = (async () => {
            try {
                console.log(`🔑 [AuthService] Requesting NEW ${type} Token...`);
                // console.log(`URL: ${url}`); 
                const response = await axios.post(url);

                if (!response.data || !response.data.access_token) {
                    throw new Error('Invalid Token Response');
                }

                cache.token = response.data.access_token;
                cache.expiry = Date.now() + (response.data.expires_in * 1000);

                console.log(`✅ [AuthService] Got ${type} Token. Expires in ${Math.round(response.data.expires_in / 60)}m`);
                return cache.token;
            } catch (error) {
                console.error(`❌ [AuthService] Error fetching ${type} token:`, error.message);
                throw error;
            } finally {
                cache.promise = null;
            }
        })();

        return cache.promise;
    }
};
