import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { flowService } from '../services/flowService';

const FlowContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useFlowContext = () => {
    const context = useContext(FlowContext);
    if (!context) {
        throw new Error("useFlowContext must be used within a FlowProvider");
    }
    return context;
};

export const FlowProvider = ({ children }) => {
    const [flows, setFlows] = useState([]);
    const [runsMap, setRunsMap] = useState({}); // Map: flowId -> runs[]
    const [overviewStats, setOverviewStats] = useState({
        totalFlows: 0,
        totalRuns: 0,
        failedRuns: 0,
        successfulRuns: 0,
        runsByDate: {},
        topFlows: [],
        recentFailures: []
    });
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [syncedFlowIds, setSyncedFlowIds] = useState(new Set());
    const [daysRange, setDaysRange] = useState(1); // Mặc định 1 ngày
    const [lastUpdated, setLastUpdated] = useState(null);
    const [unsharedFlows, setUnsharedFlows] = useState([]); // Flows bị lỗi permission

    const isMounted = useRef(true);

    const initData = useCallback(async () => {
        setIsScanning(true);
        try {
            // 1. Fetch Flows List immediately
            console.log("🚀 [FlowContext] Fetching flows list...");
            const fetchedFlows = await flowService.getFlows();

            if (!isMounted.current) return;

            // Loại bỏ flow trùng lặp theo ID/name để tránh lỗi key
            const uniqueFlows = Array.from(new Map(fetchedFlows.map(f => [f.name || f.id, f])).values());

            setFlows(uniqueFlows);
            setOverviewStats(prev => ({ ...prev, totalFlows: uniqueFlows.length }));

            // 2. Start Background Batch Fetching (Chỉ lấy history cho Flow đang bật)
            const activeFlows = uniqueFlows.filter(flow =>
                flow.properties?.state === 'Started' ||
                flow.state === 'Started' ||
                flow.status === 'Active'
            );

            console.log(`🚀 [FlowContext] Starting background runs fetch (Active: ${activeFlows.length}/${fetchedFlows.length}, Range: ${daysRange} days)...`);

            const totalToProcess = activeFlows.length;

            if (totalToProcess === 0) {
                setIsScanning(false);
                setLoadingProgress(100);
                return;
            }

            await flowService.fetchAllFlowsRunsBatched(activeFlows, (processedCount, partialStats, hasError, batchRunsMap, batchUnsharedFlows) => {
                if (!isMounted.current) return;

                // Update Progress (Dựa trên số lượng flow active)
                const progress = Math.round((processedCount / totalToProcess) * 100);
                setLoadingProgress(progress);

                // Update Global Stats
                setOverviewStats(prev => ({
                    ...prev,
                    ...partialStats
                }));

                // Update Runs Map (Cache for FlowList)
                if (batchRunsMap) {
                    const newIds = Object.keys(batchRunsMap);
                    setSyncedFlowIds(prev => {
                        const next = new Set(prev);
                        newIds.forEach(id => next.add(id));
                        return next;
                    });

                    setRunsMap(prev => ({
                        ...prev,
                        ...batchRunsMap
                    }));
                }

                // Update Unshared Flows (Flows bị lỗi permission)
                if (batchUnsharedFlows && batchUnsharedFlows.length > 0) {
                    setUnsharedFlows(prev => [...prev, ...batchUnsharedFlows]);
                }

                if (hasError) {
                    console.warn("⚠️ [FlowContext] Batch fetch stopped due to Auth Error.");
                }
            }, daysRange);

            setLastUpdated(new Date());

        } catch (error) {
            console.error("❌ [FlowContext] Initialization failed:", error);
        } finally {
            if (isMounted.current) setIsScanning(false);
        }
    }, [daysRange]);

    const refreshData = useCallback((keepFlows = false) => {
        // Hủy các tiến trình đang chạy nếu có
        flowService.stopScanning();

        setOverviewStats(prev => ({
            totalFlows: keepFlows ? prev.totalFlows : 0,
            totalRuns: 0,
            failedRuns: 0,
            successfulRuns: 0,
            runsByDate: {},
            topFlows: [],
            recentFailures: []
        }));
        setLoadingProgress(0);
        setSyncedFlowIds(new Set());
        setLastUpdated(null);
        setUnsharedFlows([]);

        // Xóa cache history để tải mới theo số ngày mới
        flowService.clearRunsCache();

        initData();
    }, [initData]);

    useEffect(() => {
        isMounted.current = true;
        initData();
        return () => { isMounted.current = false; };
    }, [initData]);

    // Tự động fetch lại khi daysRange thay đổi
    useEffect(() => {
        if (flows.length > 0) {
            refreshData(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [daysRange]);


    const stopScanning = () => {
        flowService.stopScanning();
    };

    return (
        <FlowContext.Provider value={{
            flows,
            runsMap,
            overviewStats,
            loadingProgress,
            isScanning,
            syncedFlowIds,
            daysRange,
            setDaysRange,
            lastUpdated,
            unsharedFlows,
            setUnsharedFlows,
            refreshData,
            stopScanning
        }}>
            {children}
        </FlowContext.Provider>
    );
};
