# roshooks

React Hooks for [roslib.js](https://github.com/RobotWebTools/roslibjs). Implemented in TypeScript and built with Vite library mode. Lets you write React apps connected to ROS / ROS 2 over rosbridge using declarative Hooks.

## Installation

```bash
pnpm add roshooks roslib react react-dom
```

`react` / `react-dom` are peerDependencies; `roslib` is installed as a regular dependency.

## Quick start

```tsx
import { RosProvider, useRos, useTopic, usePublisher } from "roshooks";

function App() {
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

## What's included

- `RosProvider` — owns a single `roslib.Ros` connection and exposes its status via context
- `useRos` — the connection handle and live status (`connecting` / `connected` / `closed` / `error`)
- `useTopic` / `usePublisher` — subscribe to / publish on a topic
- `useService` — call a service imperatively
- `useParam` — get/set/delete a value on the ROS parameter server
- `useAction` — drive a ROS 2 action client through its goal lifecycle
- `useTF` — subscribe to a transform via `tf2_web_republisher`

Full API reference and guides (connection status, testing without a real WebSocket, sharing ROS state globally with Jotai): see the [documentation site](./docs).

## Documentation

The docs live under [`docs/`](./docs) and are built with [VitePress](https://vitepress.dev/).

```bash
pnpm docs:dev      # local dev server
pnpm docs:build    # static build -> docs/.vitepress/dist
pnpm docs:preview  # preview the production build
```

Pushes to `main` that touch `docs/**` are deployed to GitHub Pages automatically by [`.github/workflows/deploy-docs.yml`](./.github/workflows/deploy-docs.yml). This requires enabling **Settings → Pages → Source: GitHub Actions** on the repository once. If the repository is renamed or forked under a different name, update the `base` path in [`docs/.vitepress/config.ts`](./docs/.vitepress/config.ts) to match.

## Development

```bash
pnpm install
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest
pnpm build       # vite build -> dist/ (ESM + CJS + type declarations)
```

## License

MIT. This project depends on [roslib.js](https://github.com/RobotWebTools/roslibjs), which is licensed under BSD-3-Clause.
