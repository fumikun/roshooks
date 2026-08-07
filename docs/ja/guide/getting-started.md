# はじめに

roshooks は [roslib.js](https://github.com/RobotWebTools/roslibjs) の接続・トピック・サービス・パラメータ・アクション・TF を React Hooks でラップしたライブラリです。TypeScript で実装されており、[Vite](https://vitejs.dev/) のライブラリモードで ESM / CJS / 型定義をビルドしています。

## インストール

```bash
pnpm add roshooks roslib react react-dom
```

`react` / `react-dom` は peerDependencies として扱われるため、アプリ側で用意されているバージョンがそのまま使われます。`roslib` は roshooks の通常の依存関係です。

## 前提条件

roshooks は [rosbridge_suite](http://wiki.ros.org/rosbridge_suite) が提供する WebSocket サーバー(既定では `ws://<host>:9090`)経由で ROS / ROS 2 と通信します。あらかじめ `rosbridge_websocket` を起動しておいてください。

```bash
roslaunch rosbridge_server rosbridge_websocket.launch
```

## 最小構成

アプリのルートに近い場所で [`RosProvider`](/ja/api/ros-provider) を1つ配置し、その配下で各 Hooks を使います。

```tsx
import { RosProvider, useRos, useTopic, usePublisher } from "roshooks";

export function App() {
  return (
    <RosProvider url="ws://localhost:9090">
      <ChatterDemo />
    </RosProvider>
  );
}

interface StringMsg {
  data: string;
}

function ChatterDemo() {
  const { status, isConnected } = useRos();
  const { message } = useTopic<StringMsg>({
    name: "/chatter",
    messageType: "std_msgs/String",
  });
  const { publish } = usePublisher<StringMsg>({
    name: "/chatter",
    messageType: "std_msgs/String",
  });

  return (
    <div>
      <p>接続状態: {status}</p>
      <p>最新メッセージ: {message?.data ?? "(まだありません)"}</p>
      <button disabled={!isConnected} onClick={() => publish({ data: "hello" })}>
        publish
      </button>
    </div>
  );
}
```

`RosProvider` はマウント時に自動的に `url` へ接続します(`autoConnect={false}` で無効化可能)。`useTopic` / `usePublisher` はコンポーネントのマウント・アンマウントに合わせて自動的に購読・アドバタイズと後片付け(unsubscribe / unadvertise)を行います。

## 次に読むもの

- [接続状態の扱い方](/ja/guide/connection-status) — `status` / `isConnected` / `error` の使い分け
- [テストの書き方](/ja/guide/testing) — 実際の WebSocket なしで roshooks を使うコンポーネントをテストする方法
- [Jotaiでのグローバル状態管理](/ja/guide/jotai) — `RosProvider` の外側でも ROS の状態を共有する方法
- [APIリファレンス](/ja/api/ros-provider) — 各 Hooks のオプションと返り値の一覧
