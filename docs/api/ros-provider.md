# RosProvider

Creates and owns a single `roslib.Ros` connection and exposes it — along with its live status — to descendants via React context. Every other Hook in roshooks reads the connection from this provider, so it must wrap any part of the tree that uses them.

```tsx
import { RosProvider } from "roshooks";

<RosProvider url="ws://localhost:9090">
  <App />
</RosProvider>;
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | — | The rosbridge server URL, e.g. `"ws://localhost:9090"`. |
| `autoConnect` | `boolean` | `true` | Connect automatically on mount and whenever `url` changes. |
| `transportFactory` | `ITransportFactory` | roslib's default WebSocket transport | Overrides the transport used to connect — mainly useful for tests or WebRTC setups. See [Testing](/guide/testing). |
| `onConnection` | `() => void` | — | Called when the connection succeeds. |
| `onClose` | `() => void` | — | Called when the connection closes. |
| `onError` | `(error: unknown) => void` | — | Called on a connection error. |
| `children` | `ReactNode` | — | — |

## Behavior

- A single `Ros` instance is created once, on first render, and reused for the lifetime of the provider (changing unrelated props does not recreate it).
- When `autoConnect` is `true`, `ros.connect(url)` is called on mount and again whenever `url` changes; the previous connection is closed first.
- On unmount, the connection is closed and all internal event listeners are removed.
- Descendants read the connection and status with [`useRos`](/api/use-ros) (or the lower-level [`useRosContext`](#userosscontext)).

See [Connection Status](/guide/connection-status) for the full status state machine.

## useRosContext()

```ts
import { useRosContext } from "roshooks";

const { ros, status, error } = useRosContext();
```

The context hook that [`useRos`](/api/use-ros) and every other Hook build on. Throws if called outside of a `RosProvider`. Prefer `useRos` unless you specifically need the raw context value.
