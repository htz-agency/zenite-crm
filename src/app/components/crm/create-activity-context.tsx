import { createContext, useContext, useState, useRef, useCallback } from "react";
import type { ActivityType } from "./create-activity-modal";

interface CreateActivityContextValue {
  open: boolean;
  openModal: (defaultType?: ActivityType) => void;
  closeModal: () => void;
  defaultType: ActivityType;
  /** Incremented each time an activity is created — pages watch this to refresh */
  refreshKey: number;
  bumpRefresh: () => void;
  /** Legacy: activity pages register their open-create callback here */
  registerOpenCreate: (cb: () => void) => void;
  unregisterOpenCreate: () => void;
  hasHandler: boolean;
}

const CreateActivityContext = createContext<CreateActivityContextValue | null>(null);

export function CreateActivityProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<ActivityType>("compromisso");
  const [refreshKey, setRefreshKey] = useState(0);
  const handlerRef = useRef<(() => void) | null>(null);
  const [hasHandler, setHasHandler] = useState(false);

  const openModal = useCallback((type?: ActivityType) => {
    if (type) setDefaultType(type);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const registerOpenCreate = useCallback((cb: () => void) => {
    handlerRef.current = cb;
    setHasHandler(true);
  }, []);

  const unregisterOpenCreate = useCallback(() => {
    handlerRef.current = null;
    setHasHandler(false);
  }, []);

  return (
    <CreateActivityContext.Provider
      value={{ open, openModal, closeModal, defaultType, refreshKey, bumpRefresh, registerOpenCreate, unregisterOpenCreate, hasHandler }}
    >
      {children}
    </CreateActivityContext.Provider>
  );
}

export function useCreateActivity() {
  const ctx = useContext(CreateActivityContext);
  if (!ctx) throw new Error("useCreateActivity must be used inside CreateActivityProvider");
  return ctx;
}
