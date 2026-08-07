# useTF

`tf2_web_republisher` 経由で `frameId`(`fixedFrame` を基準とした変換)を購読し、更新のたびに再レンダリングします。

```tsx
import { useTF } from "roshooks";

const transform = useTF({ frameId: "base_link", fixedFrame: "odom" });
```

## オプション

| オプション | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `frameId` | `string` | — | 購読する TF フレーム(例: `"base_link"`)。 |
| `fixedFrame` | `string` | `"base_link"` | 変換を表現する基準となる固定フレーム。 |
| `angularThres` | `number` | `2.0` | TF republisher が使う角度のしきい値。 |
| `transThres` | `number` | `0.01` | TF republisher が使う並進のしきい値。 |
| `rate` | `number` | `10.0` | TF republisher の更新レート(Hz)。 |
| `updateDelay` | `number` | `50` | 新規購読後、republisher が保持する TF 一覧を更新するまでの待機時間(ms)。 |
| `topicTimeout` | `number` | `2.0` | TF republisher のタイムアウト値。 |
| `serverName` | `string` | `"/tf2_web_republisher"` | tf2_web_republisher サーバー(アクション)の名前。 |
| `ros2` | `boolean` | `false` | ROS 1 のサービスベースのクライアント(`TFClient`)の代わりに、ROS 2 のアクションベースのクライアント(`ROS2TFClient`)を使うか。 |

## 返り値

`Transform | null` — 直近の変換(`{ translation, rotation }`)。最初の1件が届くまでは `null`。

## 使用例

```tsx
function BaseLinkPosition() {
  const transform = useTF({ frameId: "base_link", fixedFrame: "map" });

  if (!transform) return <p>tf を待機中…</p>;

  const { x, y, z } = transform.translation;
  return (
    <p>
      x: {x.toFixed(2)}, y: {y.toFixed(2)}, z: {z.toFixed(2)}
    </p>
  );
}
```

## ROS 2 の場合

```tsx
const transform = useTF({ frameId: "base_link", fixedFrame: "odom", ros2: true });
```

::: tip
`useTF` は呼び出しごとに独自の `TFClient` / `ROS2TFClient` を生成し、アンマウント時に破棄します。アプリ内の複数のコンポーネントが同じフレームを購読する場合は、republisher への購読を1本にまとめるために [Jotaiでのグローバル状態管理](/ja/guide/jotai) の共有 atom パターンの採用を検討してください。
:::
