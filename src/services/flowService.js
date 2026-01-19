import axios from 'axios';
import { authService } from './authService';

const URL_LIST_FLOWS = import.meta.env.VITE_URL_LIST_FLOWS || '';
const URL_GET_HISTORY = import.meta.env.VITE_URL_GET_HISTORY || '';
const URL_GET_METADATA = import.meta.env.VITE_URL_GET_METADATA || '';

// Bộ nhớ đệm (Cache) để tránh gọi API trùng lặp
const metadataCache = new Map();
const runsCache = new Map();
const flowsCache = {
    data: null,
    timestamp: 0,
    TTL: 30 * 60 * 1000 // 30 phút
};
const systemStatsCache = {
    data: null,
    timestamp: 0,
    TTL: 5 * 60 * 1000 // 5 phút
};
const ownerCache = new Map();
const ownerRequestPromises = new Map(); // Deduplication for concurrent requests

export const flowService = {
    /**
     * Lấy tên Owner của Flow (Tối ưu: Cache + Request Deduplication + Minimal Select)
     */
    getFlowOwner: async (flow) => {
        try {
            const userId = flow?.properties?.creator?.userId;
            if (!userId) return 'Unknown';

            // 1. Check Cache
            if (ownerCache.has(userId)) {
                return ownerCache.get(userId);
            }

            // 2. Check Deduplication Promise
            if (ownerRequestPromises.has(userId)) {
                return await ownerRequestPromises.get(userId);
            }

            // 3. Create new request
            const requestPromise = (async () => {
                try {
                    const token = await authService.getAccessToken();
                    const DATAVERSE_URL = import.meta.env.VITE_DATAVERSE_URL;

                    if (!DATAVERSE_URL) {
                        console.warn('Thiếu cấu hình VITE_DATAVERSE_URL');
                        return 'Unknown';
                    }

                    // Query tối ưu: Chỉ lấy cột crdfd_name
                    const url = `${DATAVERSE_URL}/api/data/v9.2/systemusers?$filter=azureactivedirectoryobjectid eq '${userId}'&$expand=crdfd_Employee2($select=crdfd_name)`;

                    const response = await axios.get(url, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                            'OData-MaxVersion': '4.0',
                            'OData-Version': '4.0'
                        }
                    });

                    let ownerName = 'Unknown';
                    if (response.data.value && response.data.value.length > 0) {
                        const user = response.data.value[0];
                        // Trích xuất tên từ crdfd_Employee2 nếu có, hoặc fallback
                        ownerName = user.crdfd_Employee2?.crdfd_name || user.fullname || 'Unknown';
                    }

                    ownerCache.set(userId, ownerName);
                    return ownerName;
                } catch (error) {
                    console.error(`Lỗi lấy Owner cho UserID ${userId}:`, error);
                    return 'Unknown';
                } finally {
                    ownerRequestPromises.delete(userId);
                }
            })();

            ownerRequestPromises.set(userId, requestPromise);
            return await requestPromise;

        } catch (e) {
            console.error(e);
            return 'Unknown';
        }
    },

    // Promise singleton để tránh gọi trùng lặp khi nhiều component cùng mount
    pendingFlowsPromise: null,
    isScanningAborted: false,
    scanAbortController: null,

    /**
     * Dừng quá trình quét dữ liệu nền
     */
    stopScanning: () => {
        console.warn('⏹️ Yêu cầu dừng quét dữ liệu từ người dùng...');
        flowService.isScanningAborted = true;
        if (flowService.scanAbortController) {
            flowService.scanAbortController.abort();
            flowService.scanAbortController = null;
        }
    },

    /**
     * Xóa cache lịch sử
     */
    clearRunsCache: () => {
        runsCache.clear();
        console.log('🗑️ Đã xóa cache lịch sử chạy');
    },

    /**
     * Lấy token (Proxy wrapper)
     */
    getAccessToken: async () => {
        return await authService.getAccessToken();
    },

    /**
     * Lấy danh sách flows (Có Cache & Request Deduplication)
     */
    getFlows: async (forceRefresh = false) => {
        // 1. Nếu đã có dữ liệu và không ép Refresh, trả về luôn (Hủy yêu cầu gọi mới)
        if (!forceRefresh && flowsCache.data) {
            console.log('♻️ Sử dụng danh sách Flows từ cache (Singleton)');
            return flowsCache.data;
        }

        // 2. Nếu đang trong quá trình chạy, trả về Promise hiện tại để dùng chung (Hủy yêu cầu chạy song song)
        if (flowService.pendingFlowsPromise) {
            console.log('⏳ Đang có một yêu cầu lấy flows đang chạy, dùng chung kết quả...');
            return await flowService.pendingFlowsPromise;
        }

        if (!URL_LIST_FLOWS) {
            console.warn('Cảnh báo: VITE_URL_LIST_FLOWS chưa được cấu hình');
            return [];
        }

        // 3. Chỉ khởi động khi chưa có dữ liệu hoặc yêu cầu Refresh
        flowService.pendingFlowsPromise = (async () => {
            try {
                console.log('🌐 Đang thực hiện gọi API lấy danh sách flows một lần duy nhất...');
                const response = await axios.post(URL_LIST_FLOWS, {});
                const data = response.data;
                let flows = [];
                if (data && data.value) flows = data.value;
                else if (Array.isArray(data)) flows = data;

                // Lưu vào cache để các lần gọi sau "bị hủy" và lấy từ đây
                flowsCache.data = flows;
                flowsCache.timestamp = Date.now();
                return flows;
            } catch (error) {
                console.error('❌ Lỗi khi lấy danh sách flows:', error);
                // Nếu lỗi thì cho phép lần sau gọi lại (xóa promise)
                throw error;
            } finally {
                flowService.pendingFlowsPromise = null;
            }
        })();

        return await flowService.pendingFlowsPromise;
    },

    /**
     * Trích xuất environmentId và flowId từ đối tượng flow
     */
    parseFlowIds: (flow) => {
        const DEFAULT_ENV_ID = import.meta.env.VITE_ENVIRONMENT_ID || 'de210e4b-cd22-e605-91ca-8e841aad4b8e';

        const flowIdRaw = flow.id || flow.name || '';
        const parts = flowIdRaw.split('/');
        const envIndex = parts.indexOf('environments');
        const flowIndex = parts.indexOf('workflows') !== -1 ? parts.indexOf('workflows') : parts.indexOf('flows');

        return {
            environmentId: (envIndex !== -1 && parts[envIndex + 1]) ? parts[envIndex + 1] : DEFAULT_ENV_ID,
            flowId: (flowIndex !== -1 && parts[flowIndex + 1]) ? parts[flowIndex + 1] : flowIdRaw
        };
    },

    /**
     * Tạo URL từ Template trong ENV
     */
    formatApiUrl: (template, envId, flowId) => {
        if (!template) return '';
        let url = template
            .replace('{environmentId}', envId)
            .replace('{flowId}', flowId);

        // Nếu là môi trường phát triển (DEV), dùng Proxy để tránh CORS
        if (import.meta.env.DEV) {
            return url.replace('https://api.flow.microsoft.com', '/flow-api');
        }
        // Môi trường Production (GitHub Pages) dùng URL trực tiếp
        return url;
    },

    /**
     * Lấy Metadata
     */
    getFlowMetadata: async (flow) => {
        try {
            if (!flow) return null;
            const { environmentId, flowId } = flowService.parseFlowIds(flow);

            // 1. Kiểm tra cache
            const cacheKey = `${environmentId}_${flowId}`;
            if (metadataCache.has(cacheKey)) {
                console.log(`♻️ Sử dụng Metadata từ cache cho flow: ${flowId}`);
                return metadataCache.get(cacheKey);
            }

            const token = await authService.getAccessToken();
            const apiUrl = flowService.formatApiUrl(URL_GET_METADATA, environmentId, flowId);

            console.log('🔍 Gọi API Metadata:');
            console.log('URL:', apiUrl);
            console.log('Token (50 ký tự đầu):', token?.substring(0, 50) + '...');

            const response = await axios.get(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // 2. Lưu vào cache
            metadataCache.set(cacheKey, response.data);
            console.log('✅ Metadata đã được lưu vào cache');
            return response.data;
        } catch (error) {
            console.error('❌ Lỗi lấy metadata:', error.response?.data || error.message);
            console.error('Status:', error.response?.status);
            console.error('Headers sent:', error.config?.headers);
            return null;
        }
    },

    /**
     * Lấy lịch sử chạy (Hỗ trợ phân trang nextLink)
     */
    getFlowRuns: async (flow, customUrl = null, accumulatedRuns = [], depth = 0, daysRange = 1) => {
        try {
            if (!flow || flowService.isScanningAborted) return accumulatedRuns;
            const { environmentId, flowId } = flowService.parseFlowIds(flow);
            const cacheKey = `${environmentId}_${flowId}`;

            if (depth === 0 && !customUrl && runsCache.has(cacheKey)) {
                return runsCache.get(cacheKey);
            }

            const token = await authService.getAccessToken();
            let apiUrl = customUrl || flowService.formatApiUrl(URL_GET_HISTORY, environmentId, flowId);

            // Xử lý Proxy cực kỳ linh hoạt cho nextLink (Hỗ trợ mọi domain vùng miền)
            if (import.meta.env.DEV && apiUrl.startsWith('https://')) {
                const providersIndex = apiUrl.indexOf('/providers/Microsoft.ProcessSimple');
                if (providersIndex !== -1) {
                    apiUrl = '/flow-api' + apiUrl.substring(providersIndex);
                }
            }

            if (!customUrl) {
                // Tính toán ngày bắt đầu theo múi giờ Việt Nam (UTC+7)
                const now = new Date();

                let targetDate;
                if (daysRange === 1) {
                    // "Hôm nay" theo giờ Việt Nam: 00:00:00 VN
                    const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
                    targetDate = new Date(`${dateStr}T00:00:00+07:00`);
                } else {
                    // Các khoảng khác: lùi lại N ngày từ hiện tại
                    targetDate = new Date(now.getTime() - daysRange * 24 * 60 * 60 * 1000);
                }

                const filterDate = targetDate.toISOString().split('.')[0] + 'Z';
                apiUrl += `&$filter=startTime ge ${filterDate}`;
                console.log(`📅 [Filter] daysRange=${daysRange} (VN Midnight) → API ge ${filterDate}`);
            }

            const response = await axios.get(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: flowService.scanAbortController?.signal
            });

            const currentRuns = response.data.value || [];
            const allRuns = [...accumulatedRuns, ...currentRuns];
            // Power Automate API có thể dùng 'nextLink' hoặc '@odata.nextLink'
            const nextLink = response.data['@odata.nextLink'] || response.data.nextLink;

            if (currentRuns.length > 0 || nextLink) {
                console.log(`📡 [API] ${flowId.substring(0, 6)}: Trang ${depth + 1} (+${currentRuns.length}) | Tổng: ${allRuns.length} | Có tiếp: ${!!nextLink}`);
            }

            if (!nextLink || depth >= 100) {
                if (depth === 0) runsCache.set(cacheKey, allRuns);
                return allRuns;
            }

            await new Promise(resolve => setTimeout(resolve, 150));
            const finalRuns = await flowService.getFlowRuns(flow, nextLink, allRuns, depth + 1, daysRange);

            if (depth === 0) runsCache.set(cacheKey, finalRuns);
            return finalRuns;
        } catch (error) {
            if (axios.isCancel(error)) return accumulatedRuns;

            const errData = error.response?.data?.error || error.response?.data || {};
            const errCode = errData.code;

            // Bỏ qua các Flow không có quyền truy cập (Connection thuộc người khác)
            if (errCode === 'ConnectionAuthorizationFailed' ||
                errCode === 'ConnectionNotAuthenticated' ||
                error.response?.status === 403) {
                console.warn(`⚠️ Bỏ qua flow [${flow?.name?.substring(0, 8)}...]: Không có quyền truy cập history (403).`);
                // Trả về marker đặc biệt để FlowContext biết flow này bị lỗi permission
                return { __permissionError: true, flow };
            }

            console.error(`❌ Lỗi History (Depth ${depth}):`, errData.message || error.message);
            if (error.response?.status === 401) throw error;
            return accumulatedRuns;
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
    },

    /**
     * Parse flow structure từ metadata
     */
    parseFlowStructure: (metadata) => {
        if (!metadata?.properties?.definition) {
            return { trigger: null, actions: [] };
        }

        const definition = metadata.properties.definition;

        // Parse trigger
        const triggers = definition.triggers || {};
        const triggerKey = Object.keys(triggers)[0];
        const trigger = triggerKey ? {
            name: triggerKey,
            type: triggers[triggerKey]?.type || 'Unknown'
        } : null;

        // Parse actions
        const actionsObj = definition.actions || {};
        const actions = Object.keys(actionsObj).map(key => ({
            name: key,
            type: actionsObj[key]?.type || 'Unknown'
        }));

        return { trigger, actions };
    },

    /**
     * Parse error details từ run
     */
    parseRunError: (run) => {
        if (!run?.properties) return null;

        const props = run.properties;
        const error = props.error;

        if (!error) return null;

        // Tìm action bị lỗi
        let failedAction = 'Unknown';

        // Cách 1: Từ error message
        if (error.message) {
            const match = error.message.match(/action ['"](.+?)['"]/i);
            if (match) failedAction = match[1];
        }

        // Cách 2: Từ outputs (nếu có)
        if (failedAction === 'Unknown' && props.outputs) {
            const outputs = props.outputs;
            for (const key in outputs) {
                if (outputs[key]?.statusCode >= 400 || outputs[key]?.error) {
                    failedAction = key;
                    break;
                }
            }
        }

        return {
            code: error.code || 'Unknown',
            message: error.message || 'No error message',
            action: failedAction
        };
    },

    /**
     * Đếm số lần chạy trong ngày hôm nay (Hỗ trợ nextLink + Rate Limit protection)
     */
    getTodayRunCount: async (flow, customUrl = null, accumulatedCount = 0, depth = 0) => {
        try {
            if (!flow) return 0;
            const { environmentId, flowId } = flowService.parseFlowIds(flow);
            const cacheKey = `${environmentId}_${flowId}`;

            // 1. Kiểm tra cache 30 ngày (nếu đã có thì tính trực tiếp từ đó)
            if (depth === 0 && runsCache.has(cacheKey)) {
                const allRuns = runsCache.get(cacheKey);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return allRuns.filter(run => new Date(run.properties?.startTime || run.startTime) >= today).length;
            }

            const token = await authService.getAccessToken();
            let apiUrl = customUrl || flowService.formatApiUrl(URL_GET_HISTORY, environmentId, flowId);

            if (!customUrl) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                apiUrl += `&$filter=startTime ge ${today.toISOString()}`;
            }

            const response = await axios.get(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const currentBatch = response.data.value || [];
            const newCount = accumulatedCount + currentBatch.length;
            const nextLink = response.data['@odata.nextLink'];

            // Nếu không còn link tiếp theo HOẶC đã quá sâu (giới hạn 250 runs để an toàn) HOẶC batch cuối không còn data hôm nay
            if (!nextLink || depth >= 4) {
                return newCount;
            }

            // Delay 300ms để tránh bị block do call quá nhanh
            await new Promise(resolve => setTimeout(resolve, 300));
            return await flowService.getTodayRunCount(flow, nextLink, newCount, depth + 1);
        } catch (error) {
            console.error('Lỗi đếm runs:', error.message);
            return accumulatedCount;
        }
    },

    /**
     * Lấy dữ liệu tổng quan hệ thống cho Dashboard
     */
    getSystemOverview: async (forceRefresh = false) => {
        const now = Date.now();
        if (!forceRefresh && systemStatsCache.data && (now - systemStatsCache.timestamp < systemStatsCache.TTL)) {
            return systemStatsCache.data;
        }

        try {
            const flows = await flowService.getFlows();
            const started = flows.filter(f => (f.properties?.state || f.state) === 'Started').length;
            const stopped = flows.length - started;

            // Tính toán sơ bộ Health Score (Tỷ lệ Active flows hoặc dựa trên lỗi gần đây)
            // Ở đây tạm dùng tỷ lệ active cho minh họa
            const healthScore = flows.length > 0 ? ((started / flows.length) * 100).toFixed(1) : 0;

            const stats = {
                totalFlows: flows.length,
                started,
                stopped,
                healthScore,
                environmentId: import.meta.env.VITE_ENVIRONMENT_ID || 'Unknown'
            };

            systemStatsCache.data = stats;
            systemStatsCache.timestamp = now;

            return stats;
        } catch (error) {
            console.error('Lỗi lấy tổng quan hệ thống:', error);
            return systemStatsCache.data || { totalFlows: 0, started: 0, stopped: 0, healthScore: 0 };
        }
    },
    /**
     * Lấy runs cho nhiều flow cùng lúc (Batching)
     * @param {Array} flows - Danh sách flows
     * @param {Function} onProgress - Callback update tiến độ (processedCount, totalStats)
     */
    fetchAllFlowsRunsBatched: async (flows, onProgress, daysRange = 1) => {
        const BATCH_SIZE = 5;
        flowService.isScanningAborted = false;
        flowService.scanAbortController = new AbortController();

        // Khởi tạo stats ban đầu
        let aggregatedStats = {
            totalRuns: 0,
            failedRuns: 0,
            successfulRuns: 0,
            runsByDate: {},
            topFlows: [],
            recentFailures: []
        };

        let authErrorDetected = false;

        for (let i = 0; i < flows.length; i += BATCH_SIZE) {
            if (authErrorDetected || flowService.isScanningAborted) break; // Stop loop immediately

            const batch = flows.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (flow) => {
                if (authErrorDetected || flowService.isScanningAborted) return [];
                try {
                    return await flowService.getFlowRuns(flow, null, [], 0, daysRange);
                } catch (err) {
                    // Check if error is 401 Unauthorized
                    if (err.response && err.response.status === 401) {
                        console.error('⛔ Auth Error (401) detected. Stopping batch fetch.');
                        authErrorDetected = true;
                    }
                    return [];
                }
            });

            const batchResults = await Promise.all(batchPromises);

            if (authErrorDetected) {
                if (onProgress) onProgress(flows.length, aggregatedStats, true); // true indicates error
                break;
            }

            // Thu thập các flow bị lỗi permission trong batch này
            const batchUnsharedFlows = [];

            // Xử lý kết quả batch
            batchResults.forEach((result, index) => {
                const flow = batch[index];

                // Kiểm tra nếu là marker lỗi permission
                if (result && result.__permissionError) {
                    const { environmentId, flowId } = flowService.parseFlowIds(result.flow);
                    batchUnsharedFlows.push({
                        id: flowId,
                        name: result.flow?.properties?.displayName || result.flow?.name || 'Unknown',
                        environmentId,
                        flowId
                    });
                    return;
                }

                const runs = result;
                if (!runs || !Array.isArray(runs) || runs.length === 0) return;

                // Lọc lại dữ liệu phía Client để đảm bảo tuyệt đối tính nhất quán với UI
                const now = new Date();
                let boundaryDate;
                if (daysRange === 1) {
                    const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
                    boundaryDate = new Date(`${dateStr}T00:00:00+07:00`);
                } else {
                    boundaryDate = new Date(now.getTime() - daysRange * 24 * 60 * 60 * 1000);
                }

                const effectiveRuns = runs.filter(r => {
                    const start = r.startTime || r.properties?.startTime;
                    return start && new Date(start) >= boundaryDate;
                });

                if (effectiveRuns.length === 0) return;

                // Cập nhật stats (Dùng effectiveRuns thay cho runs gốc)
                aggregatedStats.totalRuns += effectiveRuns.length;
                const failed = effectiveRuns.filter(r => (r.status || r.properties?.status) === 'Failed');
                aggregatedStats.failedRuns += failed.length;
                aggregatedStats.successfulRuns += effectiveRuns.length - failed.length;

                // Cập nhật Runs By Date
                effectiveRuns.forEach(run => {
                    const date = (run.startTime || run.properties?.startTime || '').split('T')[0];
                    if (date) {
                        if (!aggregatedStats.runsByDate[date]) aggregatedStats.runsByDate[date] = { passes: 0, fails: 0 };
                        if ((run.status || run.properties?.status) === 'Failed') aggregatedStats.runsByDate[date].fails++;
                        else aggregatedStats.runsByDate[date].passes++;
                    }
                });

                // Cập nhật Top Flows
                aggregatedStats.topFlows.push({
                    id: flow.id || flow.name,
                    name: flow.properties?.displayName || flow.name,
                    count: effectiveRuns.length
                });

                // Cập nhật Recent Failures
                failed.forEach(run => {
                    const { environmentId, flowId } = flowService.parseFlowIds(flow);
                    const runName = run.name; // ID ngắn của lần chạy
                    const fullRunId = run.id || `/providers/Microsoft.ProcessSimple/environments/${environmentId}/flows/${flowId}/runs/${runName}`;
                    const flowUrl = `https://make.powerautomate.com/environments/${environmentId}/flows/${flowId}/details`;
                    const runUrl = `https://make.powerautomate.com/environments/${environmentId}/flows/${flowId}/runs/${runName}`;

                    aggregatedStats.recentFailures.push({
                        flowName: flow.properties?.displayName || flow.name,
                        runId: fullRunId,
                        flowUrl: flowUrl,
                        runUrl: runUrl,
                        startTime: run.startTime || run.properties?.startTime,
                        status: 'Failed',
                        error: flowService.parseRunError(run),
                        type: flow.properties?.definitionSummary?.triggers?.[0]?.type || 'Automated'
                    });
                });
            });

            // Sort & Trim tạm thời để báo cáo progress
            aggregatedStats.topFlows.sort((a, b) => b.count - a.count);

            if (onProgress) {
                // Clone stats để tránh bị React "freeze" object gốc khi set vào state
                const statsClone = JSON.parse(JSON.stringify(aggregatedStats));

                // Gửi map của các flows đã xử lý trong batch này
                const batchRunsMap = {};
                batch.forEach((flow, idx) => {
                    const result = batchResults[idx];
                    // Chỉ thêm vào map nếu không phải là permission error marker
                    if (result && !result.__permissionError) {
                        batchRunsMap[flow.name] = result || [];
                    }
                });
                onProgress(i + batch.length, statsClone, authErrorDetected, batchRunsMap, batchUnsharedFlows);
            }

            // Delay 1s giữa các batch để tránh spam API
            if (i + BATCH_SIZE < flows.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Final processing
        aggregatedStats.topFlows = aggregatedStats.topFlows.slice(0, 5);
        aggregatedStats.recentFailures = aggregatedStats.recentFailures
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
            .slice(0, 20);

        return aggregatedStats;
    },

    /**
     * Helper tính tỷ lệ lỗi
     */
    calculateErrorRate: (stats) => {
        if (!stats || stats.totalRuns === 0) return 0;
        return ((stats.failedRuns / stats.totalRuns) * 100).toFixed(1);
    }
};
