import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary Component - Bắt lỗi JavaScript và hiển thị fallback UI
 * Ngăn không cho toàn bộ app crash khi có lỗi runtime
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state để render fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log lỗi ra console (có thể gửi lên logging service)
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-2xl p-8 text-center">
                        {/* Icon */}
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Đã xảy ra lỗi
                        </h1>
                        <p className="text-slate-400 mb-6">
                            Ứng dụng gặp sự cố không mong muốn. Vui lòng thử tải lại trang.
                        </p>

                        {/* Error Details (DEV only) */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 p-4 bg-slate-950 rounded-xl text-left overflow-auto max-h-32">
                                <p className="text-xs text-red-400 font-mono break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                            >
                                Thử lại
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tải lại trang
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
