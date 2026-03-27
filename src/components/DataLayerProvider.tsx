"use client";

import { createContext, useContext, useEffect, useCallback, type ReactNode } from "react";

interface DataLayerContextType {
  pushEvent: (event: Record<string, unknown>) => void;
}

const DataLayerContext = createContext<DataLayerContextType>({ pushEvent: () => {} });

export function useDataLayer() {
  return useContext(DataLayerContext);
}

interface DataLayerProviderProps {
  children: ReactNode;
  initialEvents?: Record<string, unknown>[];
}

export function DataLayerProvider({ children, initialEvents }: DataLayerProviderProps) {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];

    if (initialEvents) {
      for (const event of initialEvents) {
        window.dataLayer.push(event);
      }
    }
  }, [initialEvents]);

  const pushEvent = useCallback((event: Record<string, unknown>) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
  }, []);

  return (
    <DataLayerContext.Provider value={{ pushEvent }}>
      {children}
    </DataLayerContext.Provider>
  );
}

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}
