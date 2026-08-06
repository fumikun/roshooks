import { useCallback, useEffect, useRef, useState } from "react";
import { Action } from "roslib";
import { useRosContext } from "../RosContext";

export interface UseActionOptions {
  /** The action name, like '/fibonacci'. */
  name: string;
  /** The action type, like 'example_interfaces/Fibonacci'. */
  actionType: string;
}

export type ActionState = "idle" | "sending" | "active" | "succeeded" | "failed" | "canceled";

export interface UseActionResult<TGoal, TFeedback, TResult> {
  /** Sends a new goal, replacing any goal state tracked from a previous call. */
  sendGoal: (goal: TGoal) => void;
  /** Cancels the goal currently in flight, if any. */
  cancelGoal: () => void;
  state: ActionState;
  feedback: TFeedback | null;
  result: TResult | null;
  error: string | null;
  /** The underlying roslib.js `Action` client, or `null` before it's created. */
  action: Action<TGoal, TFeedback, TResult> | null;
}

/**
 * Wraps a ROS 2 action client. Tracks the lifecycle of a single in-flight
 * goal at a time — call `sendGoal` again to replace it.
 */
export function useAction<TGoal = unknown, TFeedback = unknown, TResult = unknown>(
  options: UseActionOptions,
): UseActionResult<TGoal, TFeedback, TResult> {
  const { ros } = useRosContext();
  const { name, actionType } = options;

  const actionRef = useRef<Action<TGoal, TFeedback, TResult> | null>(null);
  const goalIdRef = useRef<string | undefined>(undefined);
  const [action, setAction] = useState<Action<TGoal, TFeedback, TResult> | null>(null);
  const [state, setState] = useState<ActionState>("idle");
  const [feedback, setFeedback] = useState<TFeedback | null>(null);
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentAction = new Action<TGoal, TFeedback, TResult>({ ros, name, actionType });
    actionRef.current = currentAction;
    setAction(currentAction);
    setState("idle");
    setFeedback(null);
    setResult(null);
    setError(null);
    goalIdRef.current = undefined;

    return () => {
      if (goalIdRef.current) {
        currentAction.cancelGoal(goalIdRef.current);
      }
      actionRef.current = null;
      setAction(null);
    };
  }, [ros, name, actionType]);

  const sendGoal = useCallback((goal: TGoal) => {
    const currentAction = actionRef.current;
    if (!currentAction) return;

    setState("sending");
    setFeedback(null);
    setResult(null);
    setError(null);

    goalIdRef.current = currentAction.sendGoal(
      goal,
      (goalResult) => {
        setState("succeeded");
        setResult(goalResult);
      },
      (goalFeedback) => {
        setState("active");
        setFeedback(goalFeedback);
      },
      (failure) => {
        setState("failed");
        setError(failure);
      },
    );
  }, []);

  const cancelGoal = useCallback(() => {
    const currentAction = actionRef.current;
    if (currentAction && goalIdRef.current) {
      currentAction.cancelGoal(goalIdRef.current);
      setState("canceled");
    }
  }, []);

  return { sendGoal, cancelGoal, state, feedback, result, error, action };
}
