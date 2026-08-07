# usePublisher

呼び出し元コンポーネントが存在する間、ROS トピックをアドバタイズし続け、それに紐づいた安定した `publish` 関数を返します。トピック名/タイプやその他のオプションが変わると自動的に再アドバタイズし、アンマウント時には自動的に unadvertise します。

```tsx
import { usePublisher } from "roshooks";

interface Twist {
  linear: { x: number; y: number; z: number };
  angular: { x: number; y: number; z: number };
}

const { publish } = usePublisher<Twist>({
  name: "/cmd_vel",
  messageType: "geometry_msgs/Twist",
});
```

## オプション

| オプション | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | — | トピック名(例: `"/cmd_vel"`)。 |
| `messageType` | `string` | — | メッセージ型(例: `"geometry_msgs/Twist"`)。 |
| `throttle_rate` | `number` | `0` | メッセージ間の最小間隔(ms)。 |
| `queue_size` | `number` | `100` | ブリッジ側の配信用キューサイズ。 |
| `latch` | `boolean` | `false` | パブリッシュ時にトピックをラッチするか。 |
| `queue_length` | `number` | `0` | ブリッジ側の購読用キュー長。 |
| `reconnect_on_close` | `boolean` | `true` | 再接続時に自動で再アドバタイズするか。 |

## 返り値

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `publish` | `(message: TMessage) => void` | メッセージを publish します。マウント直後の1レンダー分だけ、トピックの準備ができておらず no-op になる場合があります。 |
| `topic` | `Topic<TMessage> \| null` | roslib.js の `Topic` インスタンス本体。生成前は `null`。 |

## 使用例

```tsx
function StopButton() {
  const { publish } = usePublisher<Twist>({
    name: "/cmd_vel",
    messageType: "geometry_msgs/Twist",
  });

  return (
    <button
      onClick={() =>
        publish({
          linear: { x: 0, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: 0 },
        })
      }
    >
      Stop
    </button>
  );
}
```

`publish` は内部で `Topic.publish` を呼び出しており、初回呼び出し時にトピックを自動でアドバタイズします。アドバタイズを別途自分で管理する必要はありません。
