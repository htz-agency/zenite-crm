import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface MinimizedWindow {
  id: string;
  title: string;
  subtitle?: string;
  path: string;          // route to restore
  statusColor?: string;  // optional dot color
  type?: "page" | "dialer"; // "page" (default) navigates on restore; "dialer" reopens dialer in-place
  icon?: string;         // optional icon identifier for the taskbar chip
}

interface MultitaskContextValue {
  minimized: MinimizedWindow[];
  minimize: (win: MinimizedWindow) => void;
  restore: (id: string) => MinimizedWindow | undefined;
  close: (id: string) => void;
  /** Global dialer state — when true the DialerPanel is visible */
  dialerOpen: boolean;
  setDialerOpen: (open: boolean) => void;
}

const MultitaskContext = createContext<MultitaskContextValue>({
  minimized: [],
  minimize: () => {},
  restore: () => undefined,
  close: () => {},
  dialerOpen: false,
  setDialerOpen: () => {},
});

export function MultitaskProvider({ children }: { children: ReactNode }) {
  const [minimized, setMinimized] = useState<MinimizedWindow[]>([]);
  const [dialerOpen, setDialerOpen] = useState(false);

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
    <MultitaskContext.Provider value={{ minimized, minimize, restore, close, dialerOpen, setDialerOpen }}>
      {children}
    </MultitaskContext.Provider>
  );
}

export function useMultitask() {
  return useContext(MultitaskContext);
}
