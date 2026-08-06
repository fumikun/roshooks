# Testing

roshooks's own test suite never touches a real WebSocket — it swaps out `roslib.Ros`'s `transportFactory` option instead. You can use the same approach to test components in your app that use roshooks.

## A fake transport

`Ros` calls an `ITransportFactory` (`(url: string) => Promise<ITransport>`) internally when connecting. Swap it out in tests and you can initialize `RosProvider` without a real server.

```ts
// test/utils/fakeTransport.ts
import type { ITransport, ITransportFactory } from "roslib";

type Listener = (event: any) => void;

export class FakeTransport implements ITransport {
  sent: any[] = [];
  private state: "connecting" | "open" | "closing" | "closed" = "connecting";
  private listeners: Record<string, Listener[]> = {};

  on(event: string, listener: Listener) {
    (this.listeners[event] ??= []).push(listener);
    return this;
  }
  emit(event: string, payload?: unknown) {
    for (const l of this.listeners[event] ?? []) l(payload);
  }
  send(message: any) {
    this.sent.push(message);
  }
  close() {
    this.state = "closed";
    this.emit("close");
  }
  isConnecting() {
    return this.state === "connecting";
  }
  isOpen() {
    return this.state === "open";
  }
  isClosing() {
    return this.state === "closing";
  }
  isClosed() {
    return this.state === "closed";
  }
  /** Simulates the server accepting the connection, from a test. */
  open() {
    this.state = "open";
    this.emit("open");
  }
}

export function createFakeTransportFactory() {
  const transports: FakeTransport[] = [];
  const factory: ITransportFactory = async () => {
    const transport = new FakeTransport();
    transports.push(transport);
    return transport;
  };
  return { factory, transports };
}
```

## Testing RosProvider's connection status

```tsx
import { act, render, screen, waitFor } from "@testing-library/react";
import { RosProvider, useRos } from "roshooks";
import { createFakeTransportFactory } from "./utils/fakeTransport";

function StatusProbe() {
  const { status } = useRos();
  return <div data-testid="status">{status}</div>;
}

it("connects once the transport opens", async () => {
  const { factory, transports } = createFakeTransportFactory();

  render(
    <RosProvider url="ws://localhost:9090" transportFactory={factory}>
      <StatusProbe />
    </RosProvider>,
  );

  expect(screen.getByTestId("status").textContent).toBe("connecting");

  await waitFor(() => expect(transports).toHaveLength(1));
  act(() => transports[0].open());

  await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("connected"));
});
```

## Testing topic message reception

Since `Ros` is also an event emitter, you can simulate a rosbridge publish message directly with `ros.emit(topicName, { op: "publish", topic, msg })`. Grab `ros` from `useRos()` and pass it to your test.

```tsx
act(() => {
  ros.emit("/chatter", { op: "publish", topic: "/chatter", msg: { data: "hello" } });
});

await waitFor(() => expect(screen.getByTestId("message").textContent).toBe("hello"));
```

## Testing a service call

Service calls are sent with an id of the form `call_service:<name>:<uuid>` and resolved by a `service_response` message addressed to that same id. Grab the id from the sent message (`transport.sent`) and emit the matching response.

```tsx
act(() => screen.getByTestId("call").click());

const callMessage = transports[0].sent.find((m) => m.op === "call_service");

act(() => {
  ros.emit(callMessage.id, {
    op: "service_response",
    id: callMessage.id,
    service: "/add_two_ints",
    values: { sum: 5 },
    result: true,
  });
});

await waitFor(() => expect(screen.getByTestId("result").textContent).toBe("5"));
```

The same pattern — inspect `transport.sent` for what was sent, then `ros.emit` the matching response — works for `useParam` and `useAction` as well.
