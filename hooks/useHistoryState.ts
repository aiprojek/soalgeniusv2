import { useState, useCallback } from 'react';

type HistoryState<T> = {
  history: T[];
  currentIndex: number;
};

export const useHistoryState = <T>(
  initialState: T
): [
  T,
  (newState: T | ((prevState: T) => T)) => void,
  () => void,
  () => void,
  boolean,
  boolean
] => {
  const [state, setState] = useState<HistoryState<T>>({
    history: [initialState],
    currentIndex: 0,
  });

  const { history, currentIndex } = state;

  const setCurrentState = useCallback((newStateOrFn: T | ((prevState: T) => T)) => {
    setState(currentState => {
      const { history: currentHistory, currentIndex: currentIdx } = currentState;

      const newState = typeof newStateOrFn === 'function'
        ? (newStateOrFn as (prevState: T) => T)(currentHistory[currentIdx])
        : newStateOrFn;
        
      if (newState === currentHistory[currentIdx]) {
        return currentState;
      }

      const newHistory = currentHistory.slice(0, currentIdx + 1);
      newHistory.push(newState);

      return {
        history: newHistory,
        currentIndex: newHistory.length - 1,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(currentState => {
      if (currentState.currentIndex > 0) {
        return { ...currentState, currentIndex: currentState.currentIndex - 1 };
      }
      return currentState;
    });
  }, []);

  const redo = useCallback(() => {
    setState(currentState => {
      if (currentState.currentIndex < currentState.history.length - 1) {
        return { ...currentState, currentIndex: currentState.currentIndex + 1 };
      }
      return currentState;
    });
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return [history[currentIndex], setCurrentState, undo, redo, canUndo, canRedo];
};
