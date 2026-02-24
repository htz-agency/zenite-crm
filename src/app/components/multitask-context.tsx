import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface MinimizedWindow {
  id: string;
  title: string;
  subtitle?: string;
  path: string;          // route to restore
  statusColor?: string;  // optional dot color
}

interface MultitaskContextValue {
  minimized: MinimizedWindow[];
  minimize: (win: MinimizedWindow) => void;
  restore: (id: string) => MinimizedWindow | undefined;
  close: (id: string) => void;
}

const MultitaskContext = createContext<MultitaskContextValue>({
  minimized: [],
  minimize: () => {},
  restore: () => undefined,
  close: () => {},
});

export function MultitaskProvider({ children }: { children: ReactNode }) {
  const [minimized, setMinimized] = useState<MinimizedWindow[]>([]);

  const minimize = useCallback((win: MinimizedWindow) => {
    setMinimized((prev) => {
      if (prev.some((m) => m.id === win.id)) return prev;
      return [...prev, win];
    });
  }, []);

  const restore = useCallback((id: string) => {
    let found: MinimizedWindow | undefined;
    setMinimized((prev) => {
      found = prev.find((m) => m.id === id);
      return prev.filter((m) => m.id !== id);
    });
    return found;
  }, []);

  const close = useCallback((id: string) => {
    setMinimized((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <MultitaskContext.Provider value={{ minimized, minimize, restore, close }}>
      {children}
    </MultitaskContext.Provider>
  );
}

export function useMultitask() {
  return useContext(MultitaskContext);
}
