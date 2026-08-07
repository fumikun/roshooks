# テストの書き方

このガイドは、roshooks 自体のテストスイートと同じく [Vitest](https://vitest.dev/) と [`@testing-library/react`](https://testing-library.com/docs/react-testing-library/intro/) を使うことを前提にしています。ここで紹介する手法自体は roshooks 固有のテストユーティリティに依存しておらず、`roslib.Ros` の `transportFactory` オプションを差し替えるだけなので、アプリ側のコンポーネントをテストする場合にも同じように使えます。

## セットアップ

```bash
pnpm add -D vitest jsdom @testing-library/react
```

Vitest で React コンポーネントを描画するには DOM 環境が必要です。`vite.config.ts`(または別ファイルの `vitest.config.ts`)で設定します。

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true, // describe/it/expect を import なしで使えるようになる
  },
});
```

実行用のスクリプトも追加しておきます。

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

以下のサンプルでは `globals: true` を設定していても `describe` / `it` / `expect` を `"vitest"` から明示的に import しています。これは roshooks 自体のテストコードのスタイルに合わせたものです。globals に頼る場合は import を省略しても構いません。

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

このファイル自体は Vitest に依存していないため、テストランナーが何であってもそのまま再利用できます。Vitest 固有なのは、この後の `*.test.tsx` ファイルの部分です。

## RosProvider の接続状態をテストする

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

`pnpm test`(watch モードなら `pnpm vitest`)で実行できます。

## トピックのメッセージ受信をテストする

`Ros` は EventEmitter でもあるため、rosbridge からの publish メッセージは `ros.emit(topicName, { op: "publish", topic, msg })` で直接シミュレートできます。`ros` は `useRos()` から取得し(例えばテスト対象のコンポーネントから props のコールバックで渡すなど)、テストコードに渡します。

```tsx
import { act, waitFor, screen } from "@testing-library/react";
import { expect, it } from "vitest";

it("updates with each incoming message", async () => {
  // ...useRos() から onRos(ros) を呼び、useTopic で購読するコンポーネントを描画...

  act(() => {
    ros.emit("/chatter", { op: "publish", topic: "/chatter", msg: { data: "hello" } });
  });

  await waitFor(() => expect(screen.getByTestId("message").textContent).toBe("hello"));
});
```

## サービス呼び出しをテストする

サービス呼び出しは `call_service:<name>:<uuid>` という ID で送信され、その ID 宛の `service_response` メッセージで解決します。送信済みメッセージ(`transport.sent`)から ID を取得し、対応するレスポンスを `ros.emit` で返してあげます。

```tsx
import { act, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";

it("resolves callService once rosbridge replies", async () => {
  // ...上記と同様に描画してトランスポートを open し、呼び出しをトリガー...

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

このパターン(`transport.sent` から送信内容を確認し、対応するレスポンスを `ros.emit` で返す)は `useParam` や `useAction` にも同様に使えます。

::: tip
`callService` / `setValue` などは Promise を返します。失敗するはずの呼び出しをテストで発火させる場合、クリックハンドラ(またはご自身のコード側)で `.catch()` を付けておいてください。付けていないと、テスト自体は成功していても Vitest が unhandled rejection として報告します。完全な例は roshooks 自体の [`useService` のテスト](https://github.com/fumikun/roshooks/blob/main/tests/useService.test.tsx) にある `error` フィールドのアサーションを参照してください。
:::
