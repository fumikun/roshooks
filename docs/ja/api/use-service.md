# useService

ROS サービスクライアントをラップします。[`useTopic`](/ja/api/use-topic) と異なり呼び出しは命令的です。必要なタイミングで `callService` を呼び出し、`loading` / `result` / `error` が直近の呼び出し結果を反映します。

```tsx
import { useService } from "roshooks";

interface AddTwoIntsRequest {
  a: number;
  b: number;
}

interface AddTwoIntsResponse {
  sum: number;
}

const { callService, loading, result, error } = useService<AddTwoIntsRequest, AddTwoIntsResponse>({
  name: "/add_two_ints",
  serviceType: "rospy_tutorials/AddTwoInts",
});
```

## オプション

| オプション | 型 | 説明 |
| --- | --- | --- |
| `name` | `string` | サービス名(例: `"/add_two_ints"`)。 |
| `serviceType` | `string` | サービス型(例: `"rospy_tutorials/AddTwoInts"`)。 |

## 返り値

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `callService` | `(request: TRequest, timeout?: number) => Promise<TResponse>` | サービスを呼び出します。成功時はレスポンスで resolve、失敗時は rosbridge のエラーメッセージを包んだ `Error` で reject します。 |
| `loading` | `boolean` | 呼び出し中は `true`。 |
| `result` | `TResponse \| null` | 直近の成功時のレスポンス。 |
| `error` | `string \| null` | 直近の失敗時のエラーメッセージ。 |
| `service` | `Service<TRequest, TResponse> \| null` | roslib.js の `Service` インスタンス本体。生成前は `null`。 |

## 使用例

```tsx
function AddTwoInts() {
  const { callService, loading, result, error } = useService<AddTwoIntsRequest, AddTwoIntsResponse>({
    name: "/add_two_ints",
    serviceType: "rospy_tutorials/AddTwoInts",
  });

  return (
    <div>
      <button disabled={loading} onClick={() => callService({ a: 2, b: 3 }).catch(() => {})}>
        2 + 3
      </button>
      {result && <p>sum: {result.sum}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
```

::: tip
`callService` は Promise を返すため、呼び出しが失敗して誰も await/catch していないと unhandled rejection になり得ます。`try`/`catch` で `await` するか、`error` フィールドだけを使いたい場合は no-op の `.catch()` を付けておいてください。
:::

実サーバーなしでサービスの応答をシミュレートする方法は [テストの書き方](/ja/guide/testing) を参照してください。
