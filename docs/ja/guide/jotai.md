# Jotai で ROS の状態をグローバル管理する

roshooks の Hooks はすべて `RosProvider` の Context を通じて動作します。これはコンポーネントツリーに閉じたローカルな状態管理としては十分ですが、次のようなケースでは物足りないことがあります。

- `RosProvider` の外側(例: ヘッダーやルート外のトースト通知)から接続状態を参照したい
- 同じトピックを複数のコンポーネントで購読しても、実際の WebSocket 購読は1本にまとめたい(`useTopic` はコンポーネントごとに個別の `Topic` を作って購読します)
- ROS の状態を、アプリの他のグローバル状態(認証情報や設定など)と同じ仕組みで扱いたい

こうした場合は [Jotai](https://jotai.org/) の atom に ROS の状態を持たせると、React のツリー構造に縛られないグローバルな状態として扱えます。

```bash
pnpm add jotai
```

## パターン A: 接続状態をグローバル atom にブリッジする

`RosProvider` の内側に小さな「ブリッジ」コンポーネントを1つ置き、`useRos()` の値を `useEffect` で atom へ書き込みます。以降はアプリのどこからでも `useAtomValue(rosStatusAtom)` で参照できます。

```ts
// store/ros.ts
import { atom } from "jotai";
import type { Ros } from "roslib";
import type { RosConnectionStatus } from "roshooks";

export const rosAtom = atom<Ros | null>(null);
export const rosStatusAtom = atom<RosConnectionStatus>("connecting");
```

```tsx
// RosJotaiBridge.tsx
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { useRos } from "roshooks";
import { rosAtom, rosStatusAtom } from "./store/ros";

/** RosProvider の直下に置き、接続状態を Jotai atom へ同期する。 */
export function RosJotaiBridge() {
  const { ros, status } = useRos();
  const setRos = useSetAtom(rosAtom);
  const setStatus = useSetAtom(rosStatusAtom);

  useEffect(() => setRos(ros), [ros, setRos]);
  useEffect(() => setStatus(status), [status, setStatus]);

  return null;
}
```

```tsx
// App.tsx
import { RosProvider } from "roshooks";
import { RosJotaiBridge } from "./RosJotaiBridge";

export function App() {
  return (
    <RosProvider url="ws://localhost:9090">
      <RosJotaiBridge />
      <Dashboard />
    </RosProvider>
  );
}
```

```tsx
// どこか別の場所(RosProvider の外でも可)
import { useAtomValue } from "jotai";
import { rosStatusAtom } from "./store/ros";

function HeaderConnectionBadge() {
  const status = useAtomValue(rosStatusAtom);
  return <span>{status}</span>;
}
```

## パターン B: トピック購読を単一の共有 atom にする

`useTopic` はフックを呼んだコンポーネントごとに `Topic` を作って購読するため、同じトピックを10個のコンポーネントで表示すると10本の購読が走ります。トピックの購読自体を1つの atom に持たせれば、購読は常に1本だけになり、購読中のコンポーネントが0になったタイミングで自動的に unsubscribe されます。

Jotai の atom が持つ `onMount` は「最初の購読者がついたときに呼ばれ、最後の購読者がいなくなったときにクリーンアップされる」という、まさにこの用途に合った仕組みです。`getDefaultStore()` を使って `rosAtom` の現在値を読み、`ros` が(再)接続されるたびに購読し直します。

```ts
// store/topic.ts
import { atom, getDefaultStore } from "jotai";
import { Topic } from "roslib";
import { rosAtom } from "./ros";

const store = getDefaultStore();

/** 指定したトピックの最新メッセージを保持するグローバル atom を作る。 */
export function createTopicAtom<T>(name: string, messageType: string) {
  const messageAtom = atom<T | null>(null);

  messageAtom.onMount = (setMessage) => {
    let topic: Topic<T> | undefined;
    let handleMessage: ((msg: T) => void) | undefined;

    const subscribe = () => {
      const ros = store.get(rosAtom);
      if (!ros) return;
      topic = new Topic<T>({ ros, name, messageType });
      handleMessage = (msg) => setMessage(msg);
      topic.subscribe(handleMessage);
    };

    const unsubscribe = () => {
      if (topic && handleMessage) topic.unsubscribe(handleMessage);
      topic = undefined;
    };

    subscribe();
    // ros が(再)接続されたら張り直す
    const unwatchRos = store.sub(rosAtom, () => {
      unsubscribe();
      subscribe();
    });

    return () => {
      unsubscribe();
      unwatchRos();
    };
  };

  return messageAtom;
}

interface StringMsg {
  data: string;
}

export const chatterAtom = createTopicAtom<StringMsg>("/chatter", "std_msgs/String");
```

```tsx
// 何個コンポーネントで読んでも購読は1本だけ
import { useAtomValue } from "jotai";
import { chatterAtom } from "./store/topic";

function ChatterLabel() {
  const message = useAtomValue(chatterAtom);
  return <p>{message?.data ?? "(まだありません)"}</p>;
}
```

:::tip どちらを選ぶか
- 特定のコンポーネントだけで完結する購読は、素直に [`useTopic`](/ja/api/use-topic) / [`usePublisher`](/ja/api/use-publisher) を使うのが最もシンプルです。
- アプリ全体で共有したい・購読本数を1本に絞りたい・`RosProvider` の外からもアクセスしたい、という場合に Jotai atom 化を検討してください。
:::

## `useParam` / `useAction` にも同じ考え方が使える

パターン B と同様に、`onMount` の中で `Param` / `Action` インスタンスを作れば、パラメータの現在値やアクションの実行状態もグローバル atom として共有できます。基本の形は「`rosAtom` から `ros` を読む → roslib.js のクライアントを作る → コールバックで `setSelf` する → クリーンアップ関数を返す」で共通です。
