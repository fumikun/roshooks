import { useCallback, useEffect, useRef, useState } from "react";
import { Service } from "roslib";
import { useRosContext } from "../RosContext";

export interface UseServiceOptions {
  /** The service name, like '/add_two_ints'. */
  name: string;
  /** The service type, like 'rospy_tutorials/AddTwoInts'. */
  serviceType: string;
}

export interface UseServiceResult<TRequest, TResponse> {
  /** Calls the service and resolves with its response (or rejects with the error message). */
  callService: (request: TRequest, timeout?: number) => Promise<TResponse>;
  loading: boolean;
  /** The response from the most recent successful call. */
  result: TResponse | null;
  error: string | null;
  /** The underlying roslib.js `Service` instance, or `null` before it's created. */
  service: Service<TRequest, TResponse> | null;
}

/**
 * Wraps a ROS service client. Unlike `useTopic`, calls are imperative: invoke
 * `callService` whenever you need to, and `loading`/`result`/`error` reflect
 * the most recent call.
 */
export function useService<TRequest = unknown, TResponse = unknown>(
  options: UseServiceOptions,
): UseServiceResult<TRequest, TResponse> {
  const { ros } = useRosContext();
  const { name, serviceType } = options;

  const serviceRef = useRef<Service<TRequest, TResponse> | null>(null);
  const [service, setService] = useState<Service<TRequest, TResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentService = new Service<TRequest, TResponse>({ ros, name, serviceType });
    serviceRef.current = currentService;
    setService(currentService);
    setResult(null);
    setError(null);

    return () => {
      serviceRef.current = null;
      setService(null);
    };
  }, [ros, name, serviceType]);

  const callService = useCallback((request: TRequest, timeout?: number) => {
    return new Promise<TResponse>((resolve, reject) => {
      const currentService = serviceRef.current;
      if (!currentService) {
        reject(new Error("roshooks: service is not ready yet."));
        return;
      }
      setLoading(true);
      setError(null);
      currentService.callService(
        request,
        (response) => {
          setLoading(false);
          setResult(response);
          resolve(response);
        },
        (failure) => {
          setLoading(false);
          setError(failure);
          reject(new Error(failure));
        },
        timeout,
      );
    });
  }, []);

  return { callService, loading, result, error, service };
}
