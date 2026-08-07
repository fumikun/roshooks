# useAction

ROS 2 のアクションクライアント(`roslib.Action`)をラップします。一度に1つのゴールのライフサイクルだけを追跡します。新しいゴールを送るには `sendGoal` をもう一度呼び出してください。

```tsx
import { useAction } from "roshooks";

interface FibonacciGoal {
  order: number;
}
interface FibonacciFeedback {
  sequence: number[];
}
interface FibonacciResult {
  sequence: number[];
}

const { sendGoal, cancelGoal, state, feedback, result, error } = useAction<
  FibonacciGoal,
  FibonacciFeedback,
  FibonacciResult
>({
  name: "/fibonacci",
  actionType: "example_interfaces/Fibonacci",
});
```

## オプション

| オプション | 型 | 説明 |
| --- | --- | --- |
| `name` | `string` | アクション名(例: `"/fibonacci"`)。 |
| `actionType` | `string` | アクション型(例: `"example_interfaces/Fibonacci"`)。 |

## 返り値

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `sendGoal` | `(goal: TGoal) => void` | 新しいゴールを送信し、前回のゴール状態を置き換えます。 |
| `cancelGoal` | `() => void` | 実行中のゴールがあればキャンセルします。 |
| `state` | `ActionState` | 下記参照。 |
| `feedback` | `TFeedback \| null` | 直近のフィードバックメッセージ。 |
| `result` | `TResult \| null` | ゴールが成功した際の結果。 |
| `error` | `string \| null` | ゴールが失敗した際のエラーメッセージ。 |
| `action` | `Action<TGoal, TFeedback, TResult> \| null` | roslib.js の `Action` クライアント本体。生成前は `null`。 |

## `ActionState`

```ts
type ActionState = "idle" | "sending" | "active" | "succeeded" | "failed" | "canceled";
```

```
idle → sending → active → succeeded
                     │  └───────────→ failed
                     └─────────────→ canceled
```

- `idle` — まだゴールを送信していない状態(または `name`/`actionType` が変わった直後)。
- `sending` — `sendGoal` を呼んだ直後で、まだフィードバックが届いていない状態。
- `active` — 少なくとも1件フィードバックを受信した状態。
- `succeeded` / `failed` / `canceled` — 終了状態。

## 使用例

```tsx
function FibonacciDemo() {
  const { sendGoal, cancelGoal, state, feedback, result } = useAction<
    FibonacciGoal,
    FibonacciFeedback,
    FibonacciResult
  >({
    name: "/fibonacci",
    actionType: "example_interfaces/Fibonacci",
  });

  return (
    <div>
      <button onClick={() => sendGoal({ order: 10 })}>ゴール送信</button>
      <button onClick={cancelGoal} disabled={state !== "active" && state !== "sending"}>
        キャンセル
      </button>
      <p>state: {state}</p>
      {feedback && <p>feedback: {feedback.sequence.join(", ")}</p>}
      {result && <p>result: {result.sequence.join(", ")}</p>}
    </div>
  );
}
```

::: warning
この Hook は ROS 2 のシンプル化された `Action` API を対象としています。ROS 1 の `actionlib` を使う場合は、roslib.js の `ActionClient` / `Goal` クラスを [`useRos`](/ja/api/use-ros) 経由で直接使ってください。
:::
