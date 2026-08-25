import { create } from 'zustand';
import api from '../lib/api';
import { subscribeToExecution } from '../lib/socket';

export const useExecutionStore = create((set, get) => ({
  executions: [],
  activeExecution: null,
  timelineLogs: [],
  isLoading: false,
  isExecuting: false,
  error: null,
  unsubscribeSocket: null,

  fetchExecutions: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/executions', { params: filters });
      set({ executions: res.data.executions || [], isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  startExecution: async (workflowId, inputPayload = {}) => {
    set({ isExecuting: true, error: null });
    try {
      const res = await api.post(`/workflows/${workflowId}/execute`, { inputPayload });
      const executionId = res.data.executionId;
      
      // Load execution details and attach socket stream
      await get().loadExecution(executionId);
      set({ isExecuting: false });
      return executionId;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Execution failed to start';
      set({ error: msg, isExecuting: false });
      throw err;
    }
  },

  loadExecution: async (executionId) => {
    // Clean up previous socket listener if any
    const prevUnsub = get().unsubscribeSocket;
    if (prevUnsub) prevUnsub();

    try {
      const [execRes, timelineRes] = await Promise.all([
        api.get(`/executions/${executionId}`),
        api.get(`/executions/${executionId}/timeline`),
      ]);

      const activeExecution = execRes.data.execution;
      const timelineLogs = timelineRes.data.timeline || [];

      set({ activeExecution, timelineLogs });

      // Subscribe to live Socket.IO events for this execution
      const unsub = subscribeToExecution(
        executionId,
        (logEvent) => {
          set((state) => {
            // Avoid duplicate log entries
            const exists = state.timelineLogs.some(
              (l) => (l.id && l.id === logEvent.id) || (l._id && l._id === logEvent.id)
            );
            if (exists) return state;
            return { timelineLogs: [...state.timelineLogs, logEvent] };
          });
        },
        (statusUpdate) => {
          set((state) => {
            if (!state.activeExecution) return state;
            return {
              activeExecution: {
                ...state.activeExecution,
                status: statusUpdate.status,
                duration: statusUpdate.duration || state.activeExecution.duration,
                error: statusUpdate.error || state.activeExecution.error,
              }
            };
          });
        },
        (progressUpdate) => {
          set((state) => {
            if (!state.activeExecution) return state;
            return {
              activeExecution: {
                ...state.activeExecution,
                currentNodeId: progressUpdate.nodeId,
                progressPercent: progressUpdate.progressPercent,
              }
            };
          });
        }
      );

      set({ unsubscribeSocket: unsub });
      return activeExecution;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message });
    }
  },

  pauseExecution: async (executionId) => {
    try {
      await api.post(`/executions/${executionId}/pause`);
      set((state) => ({
        activeExecution: state.activeExecution ? { ...state.activeExecution, status: 'PAUSED' } : null
      }));
    } catch (err) {
      set({ error: err.response?.data?.error || err.message });
    }
  },

  resumeExecution: async (executionId) => {
    try {
      await api.post(`/executions/${executionId}/resume`);
      set((state) => ({
        activeExecution: state.activeExecution ? { ...state.activeExecution, status: 'RUNNING' } : null
      }));
    } catch (err) {
      set({ error: err.response?.data?.error || err.message });
    }
  },

  cancelExecution: async (executionId) => {
    try {
      await api.post(`/executions/${executionId}/cancel`);
      set((state) => ({
        activeExecution: state.activeExecution ? { ...state.activeExecution, status: 'CANCELLED' } : null
      }));
    } catch (err) {
      set({ error: err.response?.data?.error || err.message });
    }
  },

  retryExecution: async (executionId) => {
    try {
      const res = await api.post(`/executions/${executionId}/retry`);
      const newExecId = res.data.executionId;
      await get().loadExecution(newExecId);
      return newExecId;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message });
    }
  },

  clearActiveExecution: () => {
    const unsub = get().unsubscribeSocket;
    if (unsub) unsub();
    set({ activeExecution: null, timelineLogs: [], unsubscribeSocket: null });
  },
}));
