# useService

Wraps a ROS service client. Unlike [`useTopic`](/api/use-topic), calls are imperative: invoke `callService` whenever you need to, and `loading` / `result` / `error` reflect the most recent call.

```tsx
import { useService } from "roshooks";

interface AddTwoIntsRequest {
  a: number;
  b: number;
}

interface AddTwoIntsResponse {
  sum: number;
}

const { callService, loading, result, error } = useService<AddTwoIntsRequest, AddTwoIntsResponse>({
  name: "/add_two_ints",
  serviceType: "rospy_tutorials/AddTwoInts",
});
```

## Options

| Option | Type | Description |
| --- | --- | --- |
| `name` | `string` | The service name, e.g. `"/add_two_ints"`. |
| `serviceType` | `string` | The service type, e.g. `"rospy_tutorials/AddTwoInts"`. |

## Returns

| Field | Type | Description |
| --- | --- | --- |
| `callService` | `(request: TRequest, timeout?: number) => Promise<TResponse>` | Calls the service. Resolves with the response, or rejects with an `Error` wrapping rosbridge's failure message. |
| `loading` | `boolean` | `true` while a call is in flight. |
| `result` | `TResponse \| null` | The response from the most recent successful call. |
| `error` | `string \| null` | The failure message from the most recent failed call. |
| `service` | `Service<TRequest, TResponse> \| null` | The underlying roslib.js `Service` instance, or `null` before it's created. |

## Example

```tsx
function AddTwoInts() {
  const { callService, loading, result, error } = useService<AddTwoIntsRequest, AddTwoIntsResponse>({
    name: "/add_two_ints",
    serviceType: "rospy_tutorials/AddTwoInts",
  });

  return (
    <div>
      <button disabled={loading} onClick={() => callService({ a: 2, b: 3 }).catch(() => {})}>
        2 + 3
      </button>
      {result && <p>sum: {result.sum}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
```

::: tip
`callService` returns a promise, so an unhandled rejection is possible if a call fails and nothing awaits or catches it. Either `await` it in a `try`/`catch`, or attach a no-op `.catch()` if you're only interested in the `error` field.
:::

See [Testing](/guide/testing) for how to simulate service responses without a real rosbridge server.
