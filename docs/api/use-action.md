# useAction

Wraps a ROS 2 action client (`roslib.Action`). Tracks the lifecycle of a single in-flight goal at a time — call `sendGoal` again to replace it.

```tsx
import { useAction } from "roshooks";

interface FibonacciGoal {
  order: number;
}
interface FibonacciFeedback {
  sequence: number[];
}
interface FibonacciResult {
  sequence: number[];
}

const { sendGoal, cancelGoal, state, feedback, result, error } = useAction<
  FibonacciGoal,
  FibonacciFeedback,
  FibonacciResult
>({
  name: "/fibonacci",
  actionType: "example_interfaces/Fibonacci",
});
```

## Options

| Option | Type | Description |
| --- | --- | --- |
| `name` | `string` | The action name, e.g. `"/fibonacci"`. |
| `actionType` | `string` | The action type, e.g. `"example_interfaces/Fibonacci"`. |

## Returns

| Field | Type | Description |
| --- | --- | --- |
| `sendGoal` | `(goal: TGoal) => void` | Sends a new goal, replacing any goal state tracked from a previous call. |
| `cancelGoal` | `() => void` | Cancels the goal currently in flight, if any. |
| `state` | `ActionState` | See below. |
| `feedback` | `TFeedback \| null` | The most recent feedback message. |
| `result` | `TResult \| null` | The result, once the goal has succeeded. |
| `error` | `string \| null` | The failure message, if the goal failed. |
| `action` | `Action<TGoal, TFeedback, TResult> \| null` | The underlying roslib.js `Action` client, or `null` before it's created. |

## `ActionState`

```ts
type ActionState = "idle" | "sending" | "active" | "succeeded" | "failed" | "canceled";
```

```
idle → sending → active → succeeded
                     │  └───────────→ failed
                     └─────────────→ canceled
```

- `idle` — no goal has been sent yet (or the action's `name`/`actionType` just changed).
- `sending` — `sendGoal` was just called; no feedback has arrived yet.
- `active` — at least one feedback message has been received.
- `succeeded` / `failed` / `canceled` — terminal states.

## Example

```tsx
function FibonacciDemo() {
  const { sendGoal, cancelGoal, state, feedback, result } = useAction<
    FibonacciGoal,
    FibonacciFeedback,
    FibonacciResult
  >({
    name: "/fibonacci",
    actionType: "example_interfaces/Fibonacci",
  });

  return (
    <div>
      <button onClick={() => sendGoal({ order: 10 })}>Send goal</button>
      <button onClick={cancelGoal} disabled={state !== "active" && state !== "sending"}>
        Cancel
      </button>
      <p>state: {state}</p>
      {feedback && <p>feedback: {feedback.sequence.join(", ")}</p>}
      {result && <p>result: {result.sequence.join(", ")}</p>}
    </div>
  );
}
```

::: warning
This Hook targets ROS 2's simplified `Action` API. If you're on ROS 1 with `actionlib`, use roslib.js's `ActionClient` / `Goal` classes directly via [`useRos`](/api/use-ros).
:::
