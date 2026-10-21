import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AnalysisResponse,
  AuditResult,
  PreprocessingSettings,
  CounterfactualSettings,
} from '../types/api';
import { api } from '../services/api';

export type TabKey =
  | 'overview'
  | 'new-analysis'
  | 'processing'
  | 'explainability'
  | 'uncertainty'
  | 'audit'
  | 'benchmark'
  | 'architecture'
  | 'about';

interface AnalysisContextType {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  currentAnalysis: AnalysisResponse | null;
  selectedCandidateId: number;
  setSelectedCandidateId: (id: number) => void;
  auditResult: AuditResult | null;
  analysesList: any[];
  loading: boolean;
  loadingMessage: string;
  error: string | null;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  setNotification: (notif: { type: 'success' | 'error' | 'info'; message: string } | null) => void;
  clearError: () => void;
  refreshHistory: () => Promise<void>;
  loadAnalysis: (id: string) => Promise<void>;
  loadDemoCase: (caseId: string) => Promise<void>;
  executeAnalysis: (
    file: File,
    prep?: Partial<PreprocessingSettings>,
    cf?: Partial<CounterfactualSettings>
  ) => Promise<AnalysisResponse | null>;
  executeAudit: (candidateId?: number, numSteps?: number) => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResponse | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number>(0);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [analysesList, setAnalysesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const clearError = () => setError(null);

  const refreshHistory = async () => {
    try {
      const data = await api.listAnalyses();
      setAnalysesList(data.analyses || []);
    } catch (err: any) {
      console.warn('Could not load analysis list:', err.message);
    }
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  const loadAnalysis = async (id: string) => {
    setLoading(true);
    setLoadingMessage(`Loading analysis ${id}...`);
    setError(null);
    try {
      const res = await api.getAnalysis(id);
      setCurrentAnalysis(res);
      setAuditResult(res.audit_result || null);
      if (res.candidates && res.candidates.length > 0) {
        setSelectedCandidateId(res.candidates[0].id);
      }
      setNotification({ type: 'success', message: `Loaded analysis ${id}` });
    } catch (err: any) {
      setError(err.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const loadDemoCase = async (caseId: string) => {
    setLoading(true);
    setLoadingMessage(`Loading sample case ${caseId}...`);
    setError(null);
    try {
      // Fetch the image as blob from demo endpoint
      const imgRes = await fetch(api.getDemoImageUrl(caseId));
      if (!imgRes.ok) throw new Error(`Could not fetch demo image for ${caseId}`);
      const blob = await imgRes.blob();
      const file = new File([blob], `${caseId}.png`, { type: 'image/png' });

      // Run real analysis through API
      setLoadingMessage(`Processing ${caseId} through multi-scale pipeline...`);
      const result = await api.analyze(file);
      setCurrentAnalysis(result);
      setAuditResult(result.audit_result || null);
      if (result.candidates && result.candidates.length > 0) {
        setSelectedCandidateId(result.candidates[0].id);
      }
      await refreshHistory();
      setNotification({
        type: 'success',
        message: `Successfully loaded and processed sample case ${caseId}!`,
      });
      setActiveTab('processing');
    } catch (err: any) {
      setError(err.message || 'Failed to load demo case');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const executeAnalysis = async (
    file: File,
    prep?: Partial<PreprocessingSettings>,
    cf?: Partial<CounterfactualSettings>
  ): Promise<AnalysisResponse | null> => {
    setLoading(true);
    setLoadingMessage('Executing multi-scale wavelet decomposition & candidate detection...');
    setError(null);
    try {
      const result = await api.analyze(file, prep, cf);
      setCurrentAnalysis(result);
      setAuditResult(result.audit_result || null);
      if (result.candidates && result.candidates.length > 0) {
        setSelectedCandidateId(result.candidates[0].id);
      }
      await refreshHistory();
      setNotification({
        type: 'success',
        message: `Analysis completed! Found ${result.candidates?.length || 0} candidate region(s).`,
      });
      setActiveTab('processing');
      return result;
    } catch (err: any) {
      setError(err.message || 'Analysis execution failed');
      return null;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const executeAudit = async (candidateId?: number, numSteps: number = 20) => {
    if (!currentAnalysis) {
      setError('No active analysis loaded to audit.');
      return;
    }

    const cid = candidateId !== undefined ? candidateId : selectedCandidateId;
    setLoading(true);
    setLoadingMessage(`Running pixel-perturbation faithfulness audit (${numSteps} steps)...`);
    setError(null);
    try {
      const result = await api.runAudit(currentAnalysis.analysis_id, cid, numSteps);
      setAuditResult(result);

      // Reload analysis to get updated safety status that incorporates AFS
      const updatedAnalysis = await api.getAnalysis(currentAnalysis.analysis_id);
      setCurrentAnalysis(updatedAnalysis);

      setNotification({
        type: 'success',
        message: `Faithfulness audit complete! AFS = ${result.afs.toFixed(4)}.`,
      });
    } catch (err: any) {
      setError(err.message || 'Faithfulness audit failed');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <AnalysisContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentAnalysis,
        selectedCandidateId,
        setSelectedCandidateId,
        auditResult,
        analysesList,
        loading,
        loadingMessage,
        error,
        notification,
        setNotification,
        clearError,
        refreshHistory,
        loadAnalysis,
        loadDemoCase,
        executeAnalysis,
        executeAudit,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};
