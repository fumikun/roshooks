import { useCallback, useEffect, useRef, useState } from "react";
import { Param } from "roslib";
import { useRosContext } from "../RosContext";

export interface UseParamOptions {
  /** Fetch the current value automatically on mount and whenever `name` changes. Defaults to `true`. */
  autoFetch?: boolean;
}

export interface UseParamResult<T> {
  value: T | null;
  loading: boolean;
  error: string | null;
  /** Re-fetches the value from the ROS parameter server. */
  refresh: () => Promise<T>;
  /** Sets the value on the ROS parameter server. */
  setValue: (value: T) => Promise<void>;
  /** Deletes the parameter on the ROS parameter server. */
  deleteValue: () => Promise<void>;
}

/**
 * Reads and writes a single value on the ROS parameter server, like
 * `max_vel_x`. Fetches the current value on mount by default.
 */
export function useParam<T = unknown>(name: string, options: UseParamOptions = {}): UseParamResult<T> {
  const { ros } = useRosContext();
  const { autoFetch = true } = options;

  const paramRef = useRef<Param<T> | null>(null);
  const [value, setValueState] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    paramRef.current = new Param<T>({ ros, name });
    setValueState(null);
    setError(null);
  }, [ros, name]);

  const refresh = useCallback(() => {
    return new Promise<T>((resolve, reject) => {
      const param = paramRef.current;
      if (!param) {
        reject(new Error("roshooks: param is not ready yet."));
        return;
      }
      setLoading(true);
      setError(null);
      param.get(
        (nextValue) => {
          setLoading(false);
          setValueState(nextValue);
          resolve(nextValue);
        },
        (failure) => {
          setLoading(false);
          setError(failure);
          reject(new Error(failure));
        },
      );
    });
  }, []);

  useEffect(() => {
    if (!autoFetch) return;
    refresh().catch(() => {
      // Surfaced via the `error` field; swallow here to avoid an unhandled rejection.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, ros, name]);

  const setValue = useCallback((nextValue: T) => {
    return new Promise<void>((resolve, reject) => {
      const param = paramRef.current;
      if (!param) {
        reject(new Error("roshooks: param is not ready yet."));
        return;
      }
      setLoading(true);
      setError(null);
      param.set(
        nextValue,
        () => {
          setLoading(false);
          setValueState(nextValue);
          resolve();
        },
        (failure) => {
          setLoading(false);
          setError(failure);
          reject(new Error(failure));
        },
      );
    });
  }, []);

  const deleteValue = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      const param = paramRef.current;
      if (!param) {
        reject(new Error("roshooks: param is not ready yet."));
        return;
      }
      setLoading(true);
      setError(null);
      param.delete(
        () => {
          setLoading(false);
          setValueState(null);
          resolve();
        },
        (failure) => {
          setLoading(false);
          setError(failure);
          reject(new Error(failure));
        },
      );
    });
  }, []);

  return { value, loading, error, refresh, setValue, deleteValue };
}
