import { createContext, useContext } from "react";
import type { Ros } from "roslib";

/** Lifecycle of the underlying rosbridge WebSocket connection. */
export type RosConnectionStatus = "connecting" | "connected" | "closed" | "error";

export interface RosContextValue {
  /** The underlying roslib.js `Ros` connection handle. */
  ros: Ros;
  status: RosConnectionStatus;
  error: unknown;
}

export const RosContext = createContext<RosContextValue | null>(null);

/**
 * Access the shared `Ros` connection provided by the nearest `<RosProvider>`.
 * Throws if no provider is found, since every other hook in this library
 * depends on a live connection handle.
 */
export function useRosContext(): RosContextValue {
  const context = useContext(RosContext);
  if (!context) {
    throw new Error("roshooks: this hook must be used inside a <RosProvider>.");
  }
  return context;
}
