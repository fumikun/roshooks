import { useEffect, useRef, useState, type ReactNode } from "react";
import { Ros, type ITransportFactory } from "roslib";
import { RosContext, type RosConnectionStatus } from "./RosContext";

export interface RosProviderProps {
  /** The rosbridge server URL, e.g. "ws://localhost:9090". */
  url: string;
  /** Connect automatically on mount and whenever `url` changes. Defaults to `true`. */
  autoConnect?: boolean;
  /** Overrides the default WebSocket transport (used by roslib's transport tests / RTC setups). */
  transportFactory?: ITransportFactory;
  onConnection?: () => void;
  onClose?: () => void;
  onError?: (error: unknown) => void;
  children?: ReactNode;
}

/**
 * Creates and owns a single `roslib.Ros` connection and exposes it (plus its
 * connection status) to descendants via context. All other hooks in this
 * library read the connection from this provider, so it must wrap any part
 * of the tree that uses them.
 */
export function RosProvider({
  url,
  autoConnect = true,
  transportFactory,
  onConnection,
  onClose,
  onError,
  children,
}: RosProviderProps) {
  const rosRef = useRef<Ros | null>(null);
  if (!rosRef.current) {
    rosRef.current = new Ros({ transportFactory });
  }
  const ros = rosRef.current;

  const [status, setStatus] = useState<RosConnectionStatus>("connecting");
  const [error, setError] = useState<unknown>(null);

  // Mount/unmount: wire up connection lifecycle events once for this Ros instance.
  useEffect(() => {
    const handleConnection = () => {
      setStatus("connected");
      setError(null);
      onConnection?.();
    };
    const handleClose = () => {
      setStatus("closed");
      onClose?.();
    };
    const handleError = (err: unknown) => {
      setStatus("error");
      setError(err);
      onError?.(err);
    };

    ros.on("connection", handleConnection);
    ros.on("close", handleClose);
    ros.on("error", handleError);

    return () => {
      ros.off("connection", handleConnection);
      ros.off("close", handleClose);
      ros.off("error", handleError);
      ros.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ros]);

  // Connect/reconnect whenever `url` or `autoConnect` change.
  useEffect(() => {
    if (!autoConnect) return;
    setStatus((current) => (current === "connected" ? current : "connecting"));
    ros.connect(url).catch((err) => {
      setStatus("error");
      setError(err);
      onError?.(err);
    });
    return () => {
      ros.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ros, url, autoConnect]);

  return <RosContext.Provider value={{ ros, status, error }}>{children}</RosContext.Provider>;
}
