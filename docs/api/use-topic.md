# useTopic

Subscribes to a ROS topic for the lifetime of the calling component and re-renders on every incoming message. Automatically resubscribes whenever the topic name/type or other subscription options change, and unsubscribes on unmount.

```tsx
import { useTopic } from "roshooks";

interface StringMsg {
  data: string;
}

const { message, topic } = useTopic<StringMsg>({
  name: "/chatter",
  messageType: "std_msgs/String",
});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — | The topic name, e.g. `"/chatter"`. |
| `messageType` | `string` | — | The message type, e.g. `"std_msgs/String"`. |
| `compression` | `string` | `"none"` | `"png"`, `"cbor"`, `"cbor-raw"`, or `"none"`. |
| `throttle_rate` | `number` | `0` | Minimum time (ms) between messages. |
| `queue_size` | `number` | `100` | The bridge-side publish queue size. |
| `latch` | `boolean` | `false` | Latch the topic when publishing. |
| `queue_length` | `number` | `0` | The bridge-side subscribe queue length. |
| `reconnect_on_close` | `boolean` | `true` | Automatically resubscribe on reconnection. |
| `enabled` | `boolean` | `true` | Set to `false` to skip subscribing (e.g. while waiting on other state). |

## Returns

| Field | Type | Description |
| --- | --- | --- |
| `message` | `TMessage \| null` | The latest message received, or `null` until the first one arrives (or when `enabled` is `false`). |
| `topic` | `Topic<TMessage> \| null` | The underlying roslib.js `Topic` instance, or `null` while not subscribed. |

## Example

```tsx
function ChatterLabel() {
  const { message } = useTopic<{ data: string }>({
    name: "/chatter",
    messageType: "std_msgs/String",
  });

  return <p>{message?.data ?? "(none)"}</p>;
}
```

## Conditionally subscribing

```tsx
const { message } = useTopic<StringMsg>({
  name: "/chatter",
  messageType: "std_msgs/String",
  enabled: isVisible,
});
```

See also [usePublisher](/api/use-publisher) for publishing to a topic, and [Global State with Jotai](/guide/jotai) if you want a single shared subscription across many components instead of one per call site.
