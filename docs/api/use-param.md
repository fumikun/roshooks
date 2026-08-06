# useParam

Reads and writes a single value on the ROS parameter server, like `max_vel_x`. Fetches the current value on mount by default.

```tsx
import { useParam } from "roshooks";

const { value, loading, error, refresh, setValue, deleteValue } = useParam<number>("/max_vel_x");
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | The parameter name, e.g. `"/max_vel_x"`. |
| `options.autoFetch` | `boolean` (default `true`) | Fetch the current value automatically on mount and whenever `name` changes. |

## Returns

| Field | Type | Description |
| --- | --- | --- |
| `value` | `T \| null` | The current value, or `null` before the first successful fetch. |
| `loading` | `boolean` | `true` while a get/set/delete call is in flight. |
| `error` | `string \| null` | The failure message from the most recent failed call. |
| `refresh` | `() => Promise<T>` | Re-fetches the value from the parameter server. |
| `setValue` | `(value: T) => Promise<void>` | Sets the value on the parameter server. |
| `deleteValue` | `() => Promise<void>` | Deletes the parameter on the parameter server. |

## Example

```tsx
function MaxVelocityControl() {
  const { value, loading, setValue } = useParam<number>("/max_vel_x");

  return (
    <input
      type="number"
      value={value ?? 0}
      disabled={loading}
      onChange={(e) => setValue(Number(e.target.value)).catch(() => {})}
    />
  );
}
```

## Disabling the automatic fetch

```tsx
const { value, refresh } = useParam<number>("/max_vel_x", { autoFetch: false });

// fetch on demand instead, e.g. from a button
<button onClick={() => refresh()}>Load</button>;
```
