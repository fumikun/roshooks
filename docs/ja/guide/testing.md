# テストの書き方

roshooks 自体のテストは実際の WebSocket を使わず、`roslib.Ros` の `transportFactory` オプションを差し替えることで検証しています。アプリ側のコンポーネントをテストするときも同じアプローチが使えます。

## フェイクトランスポート

`Ros` は接続時に内部で `ITransportFactory`(`(url: string) => Promise<ITransport>`)を呼び出します。テスト用にこれを差し替えれば、実サーバーなしで `RosProvider` を初期化できます。

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
  /** テストからサーバー接続の成立をシミュレートする */
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

## RosProvider の接続状態をテストする

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

## トピックのメッセージ受信をテストする

`Ros` は EventEmitter でもあるため、rosbridge からの publish メッセージは `ros.emit(topicName, { op: "publish", topic, msg })` で直接シミュレートできます。`ros` は `useRos()` から取得してテストコードに渡します。

```tsx
act(() => {
  ros.emit("/chatter", { op: "publish", topic: "/chatter", msg: { data: "hello" } });
});

await waitFor(() => expect(screen.getByTestId("message").textContent).toBe("hello"));
```

## サービス呼び出しをテストする

サービス呼び出しは `call_service:<name>:<uuid>` という ID で送信され、その ID 宛の `service_response` メッセージで解決します。送信済みメッセージ(`transport.sent`)から ID を取得し、対応するレスポンスを `ros.emit` で返してあげます。

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

このパターンをベースに、`useParam` や `useAction` も同様に `transport.sent` から送信内容を検証し、必要なイベントを `ros.emit` で返すことでテストできます。
