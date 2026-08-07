# RosProvider

`roslib.Ros` の接続を1つ生成・保持し、その状態とともに React の Context 経由で配下のツリーに公開します。roshooks の他のすべての Hooks はこの Provider から接続を取得するため、それらを使う部分は必ず `RosProvider` でラップしてください。

```tsx
import { RosProvider } from "roshooks";

<RosProvider url="ws://localhost:9090">
  <App />
</RosProvider>;
```

## Props

| Prop | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `url` | `string` | — | rosbridge サーバーの URL(例: `"ws://localhost:9090"`)。 |
| `autoConnect` | `boolean` | `true` | マウント時、および `url` 変更時に自動接続するか。 |
| `transportFactory` | `ITransportFactory` | roslib の既定 WebSocket トランスポート | 接続に使うトランスポートを差し替えます。主にテストや WebRTC 構成で利用します。[テストの書き方](/ja/guide/testing) を参照。 |
| `onConnection` | `() => void` | — | 接続に成功したときに呼ばれます。 |
| `onClose` | `() => void` | — | 接続が閉じたときに呼ばれます。 |
| `onError` | `(error: unknown) => void` | — | 接続エラー発生時に呼ばれます。 |
| `children` | `ReactNode` | — | — |

## 挙動

- `Ros` インスタンスは初回レンダー時に一度だけ生成され、Provider が存在する間ずっと再利用されます(関係のない prop の変更で再生成されることはありません)。
- `autoConnect` が `true` の場合、マウント時と `url` 変更時に `ros.connect(url)` が呼ばれます。このとき既存の接続は先に閉じられます。
- アンマウント時に接続を閉じ、内部で登録したイベントリスナーもすべて解除します。
- 配下のコンポーネントは [`useRos`](/ja/api/use-ros)(またはより低レベルな [`useRosContext`](#userosscontext))で接続と状態を取得します。

状態遷移の全体像は [接続状態の扱い方](/ja/guide/connection-status) を参照してください。

## useRosContext()

```ts
import { useRosContext } from "roshooks";

const { ros, status, error } = useRosContext();
```

[`useRos`](/ja/api/use-ros) をはじめ、他のすべての Hooks が内部で利用している Context フックです。`RosProvider` の外側で呼び出すと例外を投げます。生の Context 値が必要な特別な理由がない限り、通常は `useRos` を使ってください。
