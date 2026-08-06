# useRos

Reads the shared ROS connection and its live status from the nearest [`RosProvider`](/api/ros-provider).

```tsx
import { useRos } from "roshooks";

const { ros, status, isConnected, error } = useRos();
```

## Returns

| Field | Type | Description |
| --- | --- | --- |
| `ros` | `Ros` | The underlying roslib.js connection handle. Use it for low-level APIs not covered by a Hook (`getTopics`, `getServices`, `getParams`, ...). |
| `status` | `"connecting" \| "connected" \| "closed" \| "error"` | The connection's current state. |
| `isConnected` | `boolean` | Shorthand for `status === "connected"`. |
| `error` | `unknown` | The most recent connection error, or `null`. |

## Example

```tsx
function ConnectionBadge() {
  const { status } = useRos();
  return <span>{status}</span>;
}
```

See [Connection Status](/guide/connection-status) for a full breakdown of the state machine.

::: warning
Throws if there's no `RosProvider` above the calling component in the tree.
:::
