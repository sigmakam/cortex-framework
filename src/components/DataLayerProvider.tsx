"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface DataLayerContextType {
  pushEvent: (event: Record<string, unknown>) => void;
}

const DataLayerContext = createContext<DataLayerContextType>({
  pushEvent: () => {},
});

export function useDataLayer() {
  return useContext(DataLayerContext);
}

interface DataLayerProviderProps {
  children: ReactNode;
  initialEvents?: Record<string, unknown>[];
  debugMode?: boolean;
}

export function DataLayerProvider({
  children,
  initialEvents,
  debugMode,
}: DataLayerProviderProps) {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];

    if (initialEvents) {
      for (const event of initialEvents) {
        window.dataLayer.push(event);
      }
    }
  }, [initialEvents]);

  const pushEvent = useCallback(
    (event: Record<string, unknown>) => {
      window.dataLayer = window.dataLayer || [];

      // Debug logging in dev mode
      if (debugMode || process.env.NODE_ENV === "development") {
        // Allow ecommerce: null clearing without warning
        const isEcommerceClear =
          "ecommerce" in event && event.ecommerce === null;
        if (!isEcommerceClear && !event.event) {
          console.warn("[Cortex DataLayer] Push without event field:", event);
        }
        console.log(
          "%c[dataLayer.push]",
          "color: #6366F1; font-weight: bold",
          JSON.stringify(event, null, 2),
        );
      }

      window.dataLayer.push(event);
    },
    [debugMode],
  );

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
