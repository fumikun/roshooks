# Testing

This guide assumes you're testing with [Vitest](https://vitest.dev/) and [`@testing-library/react`](https://testing-library.com/docs/react-testing-library/intro/), the same stack roshooks's own test suite uses. The approach doesn't depend on any roshooks-specific test utilities — it works by swapping out `roslib.Ros`'s `transportFactory` option — so it applies equally to components in your own app.

## Setup

```bash
pnpm add -D vitest jsdom @testing-library/react
```

Vitest needs a DOM environment to render React components in. Configure it in `vite.config.ts` (or a separate `vitest.config.ts`):

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true, // lets you use describe/it/expect without importing them
  },
});
```

Add a script to run it:

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

The examples below import `describe`, `it`, and `expect` from `"vitest"` explicitly even with `globals: true` enabled, since that's how roshooks's own suite is written — feel free to drop the import if you rely on the globals instead.

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

This file has no dependency on Vitest itself, so it can be reused as-is regardless of test runner — only the `*.test.tsx` files below are Vitest-specific.

## Testing RosProvider's connection status

```tsx
// RosProvider.test.tsx
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RosProvider, useRos } from "roshooks";
import { createFakeTransportFactory } from "./utils/fakeTransport";

function StatusProbe() {
  const { status } = useRos();
  return <div data-testid="status">{status}</div>;
}

describe("RosProvider", () => {
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
});
```

Run it with `pnpm test` (or `pnpm vitest` in watch mode).

## Testing topic message reception

Since `Ros` is also an event emitter, you can simulate a rosbridge publish message directly with `ros.emit(topicName, { op: "publish", topic, msg })`. Grab `ros` from `useRos()` — e.g. by having the component under test call a prop callback with it — and pass it to your test.

```tsx
import { act, waitFor, screen } from "@testing-library/react";
import { expect, it } from "vitest";

it("updates with each incoming message", async () => {
  // ...render a component that calls onRos(ros) from useRos() and subscribes with useTopic...

  act(() => {
    ros.emit("/chatter", { op: "publish", topic: "/chatter", msg: { data: "hello" } });
  });

  await waitFor(() => expect(screen.getByTestId("message").textContent).toBe("hello"));
});
```

## Testing a service call

Service calls are sent with an id of the form `call_service:<name>:<uuid>` and resolved by a `service_response` message addressed to that same id. Grab the id from the sent message (`transport.sent`) and emit the matching response.

```tsx
import { act, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";

it("resolves callService once rosbridge replies", async () => {
  // ...render + open the transport as above, then trigger the call...

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
});
```

The same pattern — inspect `transport.sent` for what was sent, then `ros.emit` the matching response — works for `useParam` and `useAction` as well.

::: tip
`callService`/`setValue`/etc. return promises. If a test triggers one that's expected to fail, make sure the click handler (or your own code) attaches a `.catch()` — otherwise Vitest reports an unhandled rejection even when the test itself passes. See the `error` field assertions in roshooks's own [`useService` tests](https://github.com/fumikun/roshooks/blob/main/tests/useService.test.tsx) for a full example.
:::
