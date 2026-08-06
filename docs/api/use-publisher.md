# usePublisher

Advertises a ROS topic for the lifetime of the calling component and returns a stable `publish` function bound to it. Re-advertises whenever the topic name/type or other options change, and unadvertises on unmount.

```tsx
import { usePublisher } from "roshooks";

interface Twist {
  linear: { x: number; y: number; z: number };
  angular: { x: number; y: number; z: number };
}

const { publish } = usePublisher<Twist>({
  name: "/cmd_vel",
  messageType: "geometry_msgs/Twist",
});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — | The topic name, e.g. `"/cmd_vel"`. |
| `messageType` | `string` | — | The message type, e.g. `"geometry_msgs/Twist"`. |
| `throttle_rate` | `number` | `0` | Minimum time (ms) between messages. |
| `queue_size` | `number` | `100` | The bridge-side publish queue size. |
| `latch` | `boolean` | `false` | Latch the topic when publishing. |
| `queue_length` | `number` | `0` | The bridge-side subscribe queue length. |
| `reconnect_on_close` | `boolean` | `true` | Automatically re-advertise on reconnection. |

## Returns

| Field | Type | Description |
| --- | --- | --- |
| `publish` | `(message: TMessage) => void` | Publishes a message. A no-op until the underlying topic is ready (there's a one-render window right after mount). |
| `topic` | `Topic<TMessage> \| null` | The underlying roslib.js `Topic` instance, or `null` before it's created. |

## Example

```tsx
function StopButton() {
  const { publish } = usePublisher<Twist>({
    name: "/cmd_vel",
    messageType: "geometry_msgs/Twist",
  });

  return (
    <button
      onClick={() =>
        publish({
          linear: { x: 0, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: 0 },
        })
      }
    >
      Stop
    </button>
  );
}
```

`publish` internally calls `Topic.publish`, which advertises the topic automatically the first time it's called — there's no separate "advertise" step to manage yourself.
