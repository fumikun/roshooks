# useTopic

呼び出し元コンポーネントが存在する間、ROS トピックを購読し続け、新しいメッセージが届くたびに再レンダリングします。トピック名/タイプやその他のオプションが変わると自動的に再購読し、アンマウント時には自動的に unsubscribe します。

```tsx
import { useTopic } from "roshooks";

interface StringMsg {
  data: string;
}

const { message, topic } = useTopic<StringMsg>({
  name: "/chatter",
  messageType: "std_msgs/String",
});
```

## オプション

| オプション | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | — | トピック名(例: `"/chatter"`)。 |
| `messageType` | `string` | — | メッセージ型(例: `"std_msgs/String"`)。 |
| `compression` | `string` | `"none"` | `"png"` / `"cbor"` / `"cbor-raw"` / `"none"`。 |
| `throttle_rate` | `number` | `0` | メッセージ間の最小間隔(ms)。 |
| `queue_size` | `number` | `100` | ブリッジ側の配信用キューサイズ。 |
| `latch` | `boolean` | `false` | パブリッシュ時にトピックをラッチするか。 |
| `queue_length` | `number` | `0` | ブリッジ側の購読用キュー長。 |
| `reconnect_on_close` | `boolean` | `true` | 再接続時に自動で再購読するか。 |
| `enabled` | `boolean` | `true` | `false` にすると購読をスキップします(他の状態を待っている間など)。 |

## 返り値

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `message` | `TMessage \| null` | 直近に受信したメッセージ。最初の1件が届くまで(または `enabled` が `false` の間)は `null`。 |
| `topic` | `Topic<TMessage> \| null` | roslib.js の `Topic` インスタンス本体。未購読の間は `null`。 |

## 使用例

```tsx
function ChatterLabel() {
  const { message } = useTopic<{ data: string }>({
    name: "/chatter",
    messageType: "std_msgs/String",
  });

  return <p>{message?.data ?? "(まだありません)"}</p>;
}
```

## 条件付きで購読する

```tsx
const { message } = useTopic<StringMsg>({
  name: "/chatter",
  messageType: "std_msgs/String",
  enabled: isVisible,
});
```

トピックへの publish には [usePublisher](/ja/api/use-publisher) を参照してください。また、コンポーネントごとに購読が増えるのではなく1本の購読を複数コンポーネントで共有したい場合は [Jotaiでのグローバル状態管理](/ja/guide/jotai) も参考にしてください。
