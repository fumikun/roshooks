# Connection Status

[`useRos`](/api/use-ros) returns the status of the connection owned by `RosProvider`.

```ts
type RosConnectionStatus = "connecting" | "connected" | "closed" | "error";

const { ros, status, isConnected, error } = useRos();
```

| Field | Description |
| --- | --- |
| `ros` | The underlying roslib.js `Ros` instance. Use it for low-level APIs (`getTopics`, etc.) not covered by a Hook. |
| `status` | The connection's current state. |
| `isConnected` | Shorthand for `status === "connected"`. |
| `error` | The payload of the most recent `error` event (`null` if none occurred). |

## State transitions

```
connecting → connected → closed
    │            │
    └──── error ─┘
```

- On mount, with `autoConnect` (default `true`), `status` starts at `"connecting"`.
- Once the rosbridge server accepts the connection, it becomes `"connected"`.
- If the server disconnects, it becomes `"closed"`. Topics/services created with `reconnect_on_close` re-subscribe/re-advertise automatically, but roshooks does not automatically reconnect the `Ros` connection itself.
- WebSocket-level errors (e.g. connection refused) set `status` to `"error"` and populate `error` with the event.

## Example: a status badge

```tsx
function ConnectionBadge() {
  const { status } = useRos();

  const color = {
    connecting: "gray",
    connected: "green",
    closed: "orange",
    error: "red",
  }[status];

  return <span style={{ color }}>{status}</span>;
}
```

## Reconnecting with a new URL

Changing the `url` prop on `RosProvider` closes the existing connection and reconnects to the new URL.

```tsx
const [url, setUrl] = useState("ws://localhost:9090");

<RosProvider url={url}>
  <App />
</RosProvider>;
```

If `autoConnect={false}`, roshooks won't connect automatically. Grab `ros` from [`useRos`](/api/use-ros) and call `ros.connect(url)` whenever you're ready (it returns a `Promise<void>`).
