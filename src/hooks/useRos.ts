import type { Ros } from "roslib";
import { useRosContext, type RosConnectionStatus } from "../RosContext";

export interface UseRosResult {
  /** The underlying roslib.js `Ros` connection handle. */
  ros: Ros;
  status: RosConnectionStatus;
  isConnected: boolean;
  error: unknown;
}

/** Read the shared ROS connection and its live status from the nearest `<RosProvider>`. */
export function useRos(): UseRosResult {
  const { ros, status, error } = useRosContext();
  return { ros, status, isConnected: status === "connected", error };
}
