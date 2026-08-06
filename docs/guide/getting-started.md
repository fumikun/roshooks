# Getting Started

roshooks wraps [roslib.js](https://github.com/RobotWebTools/roslibjs)'s connection, topics, services, params, actions, and TF as React Hooks. It's implemented in TypeScript and built with [Vite](https://vitejs.dev/) library mode into ESM, CJS, and type declarations.

## Installation

```bash
pnpm add roshooks roslib react react-dom
```

`react` and `react-dom` are peer dependencies, so whatever version your app already uses is picked up. `roslib` is a regular dependency of roshooks.

## Prerequisites

roshooks talks to ROS / ROS 2 over the WebSocket server provided by [rosbridge_suite](http://wiki.ros.org/rosbridge_suite) (`ws://<host>:9090` by default). Make sure `rosbridge_websocket` is running:

```bash
roslaunch rosbridge_server rosbridge_websocket.launch
```

## Minimal setup

Place a single [`RosProvider`](/api/ros-provider) near the root of your app, and use the Hooks anywhere below it.

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
      <p>connection: {status}</p>
      <p>last message: {message?.data ?? "(none)"}</p>
      <button disabled={!isConnected} onClick={() => publish({ data: "hello" })}>
        publish
      </button>
    </div>
  );
}
```

`RosProvider` connects to `url` automatically on mount (disable with `autoConnect={false}`). `useTopic` / `usePublisher` subscribe/advertise and clean up (unsubscribe/unadvertise) automatically in sync with the component's mount and unmount.

## Where to go next

- [Connection Status](/guide/connection-status) — how to use `status` / `isConnected` / `error`
- [Testing](/guide/testing) — testing components that use roshooks without a real WebSocket
- [Global State with Jotai](/guide/jotai) — sharing ROS state outside the `RosProvider` subtree
- [API Reference](/api/ros-provider) — options and return values for every Hook
