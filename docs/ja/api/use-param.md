# useParam

`max_vel_x` のような ROS パラメータサーバー上の単一の値を読み書きします。既定ではマウント時に現在値を自動取得します。

```tsx
import { useParam } from "roshooks";

const { value, loading, error, refresh, setValue, deleteValue } = useParam<number>("/max_vel_x");
```

## 引数

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `name` | `string` | パラメータ名(例: `"/max_vel_x"`)。 |
| `options.autoFetch` | `boolean`(既定 `true`) | マウント時、および `name` 変更時に現在値を自動取得するか。 |

## 返り値

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `value` | `T \| null` | 現在値。初回取得が成功するまでは `null`。 |
| `loading` | `boolean` | get/set/delete いずれかの呼び出し中は `true`。 |
| `error` | `string \| null` | 直近の失敗時のエラーメッセージ。 |
| `refresh` | `() => Promise<T>` | パラメータサーバーから値を再取得します。 |
| `setValue` | `(value: T) => Promise<void>` | パラメータサーバーに値を設定します。 |
| `deleteValue` | `() => Promise<void>` | パラメータサーバー上のパラメータを削除します。 |

## 使用例

```tsx
function MaxVelocityControl() {
  const { value, loading, setValue } = useParam<number>("/max_vel_x");

  return (
    <input
      type="number"
      value={value ?? 0}
      disabled={loading}
      onChange={(e) => setValue(Number(e.target.value)).catch(() => {})}
    />
  );
}
```

## 自動取得を無効化する

```tsx
const { value, refresh } = useParam<number>("/max_vel_x", { autoFetch: false });

// 例えばボタン押下時など、任意のタイミングで取得する
<button onClick={() => refresh()}>読み込む</button>;
```
