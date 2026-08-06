# useTF

Subscribes to the transform of `frameId` (relative to `fixedFrame`) via `tf2_web_republisher`, re-rendering with each update.

```tsx
import { useTF } from "roshooks";

const transform = useTF({ frameId: "base_link", fixedFrame: "odom" });
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `frameId` | `string` | — | The TF frame to subscribe to, e.g. `"base_link"`. |
| `fixedFrame` | `string` | `"base_link"` | The fixed frame to express the transform in. |
| `angularThres` | `number` | `2.0` | Angular threshold used by the TF republisher. |
| `transThres` | `number` | `0.01` | Translation threshold used by the TF republisher. |
| `rate` | `number` | `10.0` | Update rate (Hz) for the TF republisher. |
| `updateDelay` | `number` | `50` | Time (ms) to wait after a new subscription before updating the republisher's list of TFs. |
| `topicTimeout` | `number` | `2.0` | Timeout parameter for the TF republisher. |
| `serverName` | `string` | `"/tf2_web_republisher"` | The name of the tf2_web_republisher server/action. |
| `ros2` | `boolean` | `false` | Use the ROS 2 action-based client (`ROS2TFClient`) instead of the ROS 1 service-based one (`TFClient`). |

## Returns

`Transform | null` — the latest transform (`{ translation, rotation }`), or `null` until the first one arrives.

## Example

```tsx
function BaseLinkPosition() {
  const transform = useTF({ frameId: "base_link", fixedFrame: "map" });

  if (!transform) return <p>waiting for tf…</p>;

  const { x, y, z } = transform.translation;
  return (
    <p>
      x: {x.toFixed(2)}, y: {y.toFixed(2)}, z: {z.toFixed(2)}
    </p>
  );
}
```

## ROS 2

```tsx
const transform = useTF({ frameId: "base_link", fixedFrame: "odom", ros2: true });
```

::: tip
Each call to `useTF` creates its own `TFClient`/`ROS2TFClient` and tears it down on unmount. If several components in your app watch the same frame, consider the shared-atom pattern from [Global State with Jotai](/guide/jotai) to keep it to a single republisher subscription.
:::
