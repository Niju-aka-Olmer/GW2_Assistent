import { useState, useCallback, useEffect } from 'react';

interface AnalysisEntry {
  id: string;
  name: string;
  type: 'build' | 'inventory' | 'bank';
  analysis: string;
  time: string;
  timestamp: number;
}

const STORAGE_KEY = 'gw2_analysis_history';
const MAX_HISTORY = 3;

function loadHistory(): AnalysisEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveToStorage(entries: AnalysisEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins}м назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ч назад`;
  const days = Math.floor(hours / 24);
  return `${days}д назад`;
}

export function useAnalysisHistory() {
  const [history, setHistory] = useState<AnalysisEntry[]>(loadHistory);

  useEffect(() => {
    saveToStorage(history);
  }, [history]);

  const saveAnalysis = useCallback((entry: Omit<AnalysisEntry, 'id' | 'time' | 'timestamp'>) => {
    setHistory(prev => {
      const newEntry: AnalysisEntry = {
        ...entry,
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        time: formatTime(Date.now()),
        timestamp: Date.now(),
      };
      const updated = [newEntry, ...prev].slice(0, MAX_HISTORY);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, saveAnalysis, clearHistory };
}
