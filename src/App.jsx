import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import FlowList from './components/FlowList';
import { FlowProvider } from './contexts/FlowContext';

function App() {
  const [activeView, setActiveView] = useState('flows');

  return (
    <FlowProvider>
      <div className="flex min-h-screen bg-[#020617] text-slate-200">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        <main className="flex-1 ml-72 p-6 pb-0 lg:p-8 lg:pb-0">
          <div className={activeView === 'overview' ? 'block' : 'hidden'}>
            <Overview />
          </div>

          <div className={activeView === 'flows' ? 'block' : 'hidden'}>
            <FlowList />
          </div>

          <div className={activeView === 'errors' ? 'block' : 'hidden'}>
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
              <h2 className="text-xl font-bold text-white mb-2">Tính năng Phân tích lỗi</h2>
              <p>Đang trong quá trình phát triển...</p>
            </div>
          </div>
        </main>
      </div>
    </FlowProvider>
  );
}

export default App;
