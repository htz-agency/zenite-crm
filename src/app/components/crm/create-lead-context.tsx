import { createContext, useContext, useState, useRef, useCallback } from "react";

interface CreateLeadContextValue {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
  /** Leads page registers its refresh callback here */
  registerOnCreated: (cb: (lead: any) => void) => void;
  /** Called by the modal after successful creation */
  notifyCreated: (lead: any) => void;
}

const CreateLeadContext = createContext<CreateLeadContextValue | null>(null);

export function CreateLeadProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const onCreatedRef = useRef<((lead: any) => void) | null>(null);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const registerOnCreated = useCallback((cb: (lead: any) => void) => {
    onCreatedRef.current = cb;
  }, []);

  const notifyCreated = useCallback((lead: any) => {
    onCreatedRef.current?.(lead);
  }, []);

  return (
    <CreateLeadContext.Provider value={{ open, openModal, closeModal, registerOnCreated, notifyCreated }}>
      {children}
    </CreateLeadContext.Provider>
  );
}

export function useCreateLead() {
  const ctx = useContext(CreateLeadContext);
  if (!ctx) throw new Error("useCreateLead must be used inside CreateLeadProvider");
  return ctx;
}
