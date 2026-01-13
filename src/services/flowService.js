import axios from 'axios';
import { authService } from './authService';

const URL_LIST_FLOWS = import.meta.env.VITE_URL_LIST_FLOWS || '';
const URL_GET_HISTORY = import.meta.env.VITE_URL_GET_HISTORY || '';
const URL_GET_METADATA = import.meta.env.VITE_URL_GET_METADATA || '';

export const flowService = {
    /**
     * Lấy danh sách flows
     */
    getFlows: async () => {
        if (!URL_LIST_FLOWS) {
            console.warn('Cảnh báo: VITE_URL_LIST_FLOWS chưa được cấu hình trong .env');
            return [];
        }
        try {
            const response = await axios.post(URL_LIST_FLOWS, {});
            const data = response.data;
            if (data && data.value) return data.value;
            if (Array.isArray(data)) return data;
            return [];
        } catch (error) {
            console.error('Lỗi khi lấy danh sách flows:', error);
            throw error;
        }
    },

    /**
     * Trích xuất environmentId và flowId từ đối tượng flow
     */
    parseFlowIds: (flow) => {
        // ID mẫu: /providers/Microsoft.ProcessSimple/environments/de210e4b-cd22-e605-91ca-8e841aad4b8e/workflows/024f8019-32e1-f7c1-1336-aef3c42d0ad4
        const flowIdRaw = flow.id || flow.name || '';
        const parts = flowIdRaw.split('/');
        const envIndex = parts.indexOf('environments');
        const flowIndex = parts.indexOf('workflows') !== -1 ? parts.indexOf('workflows') : parts.indexOf('flows');

        return {
            environmentId: parts[envIndex + 1] || 'de210e4b-cd22-e605-91ca-8e841aad4b8e',
            flowId: parts[flowIndex + 1] || flow.name
        };
    },

    /**
     * Tạo URL từ Template trong ENV
     */
    formatApiUrl: (template, envId, flowId) => {
        let url = template
            .replace('{environmentId}', envId)
            .replace('{flowId}', flowId);

        // Áp dụng Proxy
        return url.replace('https://api.flow.microsoft.com', '/flow-api');
    },

    /**
     * Lấy Metadata
     */
    getFlowMetadata: async (flow) => {
        try {
            if (!flow) return null;
            const { environmentId, flowId } = flowService.parseFlowIds(flow);
            const token = await authService.getAccessToken();

            const apiUrl = flowService.formatApiUrl(URL_GET_METADATA, environmentId, flowId);

            const response = await axios.get(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            return response.data;
        } catch (error) {
            console.error('Lỗi lấy metadata:', error.response?.data || error.message);
            return null;
        }
    },

    /**
     * Lấy lịch sử chạy
     */
    getFlowRuns: async (flow) => {
        try {
            if (!flow) return [];
            const { environmentId, flowId } = flowService.parseFlowIds(flow);
            const token = await authService.getAccessToken();

            const apiUrl = flowService.formatApiUrl(URL_GET_HISTORY, environmentId, flowId);

            const response = await axios.get(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            return response.data.value || [];
        } catch (error) {
            console.error('Lỗi lấy history:', error.response?.data || error.message);
            return [];
        }
    },

    analyzeRuns: (runs) => {
        if (!runs || !Array.isArray(runs) || runs.length === 0) {
            return { failureRate: '0.0', total: 0, failedCount: 0, commonErrors: [] };
        }
        const total = runs.length;
        const failedRuns = runs.filter(run => {
            const status = (run.properties?.status || run.status || '').toLowerCase();
            return status === 'failed';
        });
        const failureRate = ((failedRuns.length / total) * 100).toFixed(1);
        const errors = failedRuns.map(run => {
            const err = run.properties?.error || run.error;
            return err?.code || err?.message || 'Unknown Error';
        });
        const errorCounts = errors.reduce((acc, err) => {
            acc[err] = (acc[err] || 0) + 1;
            return acc;
        }, {});
        const sortedErrors = Object.entries(errorCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([code, count]) => ({ code, count }));

        return { failureRate, total, failedCount: failedRuns.length, commonErrors: sortedErrors };
    }
};
