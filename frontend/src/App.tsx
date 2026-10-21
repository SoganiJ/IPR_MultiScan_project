import React from 'react';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { NewAnalysisPage } from './pages/NewAnalysisPage';
import { ImageProcessingPage } from './pages/ImageProcessingPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { UncertaintyPage } from './pages/UncertaintyPage';
import { FaithfulnessAuditPage } from './pages/FaithfulnessAuditPage';
import { BenchmarkResultsPage } from './pages/BenchmarkResultsPage';
import { SystemArchitecturePage } from './pages/SystemArchitecturePage';
import { AboutPage } from './pages/AboutPage';

import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, error, clearError, notification, setNotification } = useAnalysis();

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1117] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300">
      <Header />

      {/* Global Alerts / Notifications */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-rose-400 hover:text-rose-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-lg ${
              notification.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Tabs */}
      <main className="flex-1">
        {activeTab === 'overview' && <OverviewPage />}
        {activeTab === 'new-analysis' && <NewAnalysisPage />}
        {activeTab === 'processing' && <ImageProcessingPage />}
        {activeTab === 'explainability' && <ExplainabilityPage />}
        {activeTab === 'uncertainty' && <UncertaintyPage />}
        {activeTab === 'audit' && <FaithfulnessAuditPage />}
        {activeTab === 'benchmark' && <BenchmarkResultsPage />}
        {activeTab === 'architecture' && <SystemArchitecturePage />}
        {activeTab === 'about' && <AboutPage />}
      </main>

      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AnalysisProvider>
      <MainContent />
    </AnalysisProvider>
  );
};

export default App;
