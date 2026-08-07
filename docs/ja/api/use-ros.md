# useRos

最寄りの [`RosProvider`](/ja/api/ros-provider) から、共有されている ROS 接続と現在の状態を取得します。

```tsx
import { useRos } from "roshooks";

const { ros, status, isConnected, error } = useRos();
```

## 返り値

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `ros` | `Ros` | roslib.js の接続ハンドル本体。Hooks でカバーされていない低レベル API(`getTopics`、`getServices`、`getParams` など)に使います。 |
| `status` | `"connecting" \| "connected" \| "closed" \| "error"` | 接続の現在状態。 |
| `isConnected` | `boolean` | `status === "connected"` の糖衣構文。 |
| `error` | `unknown` | 直近の接続エラー、なければ `null`。 |

## 使用例

```tsx
function ConnectionBadge() {
  const { status } = useRos();
  return <span>{status}</span>;
}
```

状態遷移の詳細は [接続状態の扱い方](/ja/guide/connection-status) を参照してください。

::: warning
呼び出し元コンポーネントの上位に `RosProvider` が存在しない場合、例外を投げます。
:::
