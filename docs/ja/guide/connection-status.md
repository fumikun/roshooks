# 接続状態の扱い方

[`useRos`](/ja/api/use-ros) は `RosProvider` が保持する接続の状態を返します。

```ts
type RosConnectionStatus = "connecting" | "connected" | "closed" | "error";

const { ros, status, isConnected, error } = useRos();
```

| フィールド | 説明 |
| --- | --- |
| `ros` | roslib.js の `Ros` インスタンス本体。低レベル API (`getTopics` など) が必要なときに使います。 |
| `status` | 接続の現在状態。 |
| `isConnected` | `status === "connected"` の糖衣構文。 |
| `error` | 直近の `error` イベントのペイロード(未発生なら `null`)。 |

## 状態遷移

```
connecting → connected → closed
    │            │
    └──── error ─┘
```

- マウント時、`autoConnect`(既定 `true`)であれば `status` は `"connecting"` から始まります。
- rosbridge サーバーへの接続に成功すると `"connected"` になります。
- サーバーが切断すると `"closed"` になります。`reconnect_on_close` を使うトピック/サービスは自動的に再購読・再アドバタイズされますが、`Ros` 自体の自動再接続は roshooks では行っていません。
- WebSocket 自体のエラー(接続拒否など)は `"error"` になり、`error` にイベント情報が入ります。

## UI での使い方の例

```tsx
function ConnectionBadge() {
  const { status } = useRos();

  const color = {
    connecting: "gray",
    connected: "green",
    closed: "orange",
    error: "red",
  }[status];

  return <span style={{ color }}>{status}</span>;
}
```

## `url` を切り替えて再接続する

`RosProvider` の `url` prop を変更すると、既存の接続を閉じて新しい URL へ再接続します。

```tsx
const [url, setUrl] = useState("ws://localhost:9090");

<RosProvider url={url}>
  <App />
</RosProvider>;
```

`autoConnect={false}` にした場合、roshooks 側では自動接続を行いません。`ros` を [`useRos`](/ja/api/use-ros) から取得し、`ros.connect(url)` を任意のタイミングで呼び出してください(`connect` は `Promise<void>` を返します)。
