# Global State with Jotai

Every roshooks Hook operates through `RosProvider`'s React context. That's plenty for state scoped to a component subtree, but it falls short in a few situations:

- You need to read the connection status from outside the `RosProvider` subtree (e.g. a header or a toast system mounted at the app root).
- Several components subscribe to the same topic, but you want a single shared WebSocket subscription instead of one per component (`useTopic` creates its own `Topic` per call site).
- You want ROS state to live alongside the rest of your app's global state (auth, settings, etc.) using the same tools.

For these cases, storing ROS state in [Jotai](https://jotai.org/) atoms gives you state that isn't tied to the React tree.

```bash
pnpm add jotai
```

## Pattern A: bridge the connection status into a global atom

Mount a small "bridge" component inside `RosProvider` that copies `useRos()`'s value into an atom on every render via `useEffect`. From then on, any component in the app can read `useAtomValue(rosStatusAtom)`.

```ts
// store/ros.ts
import { atom } from "jotai";
import type { Ros } from "roslib";
import type { RosConnectionStatus } from "roshooks";

export const rosAtom = atom<Ros | null>(null);
export const rosStatusAtom = atom<RosConnectionStatus>("connecting");
```

```tsx
// RosJotaiBridge.tsx
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { useRos } from "roshooks";
import { rosAtom, rosStatusAtom } from "./store/ros";

/** Mount directly under RosProvider to sync connection state into Jotai atoms. */
export function RosJotaiBridge() {
  const { ros, status } = useRos();
  const setRos = useSetAtom(rosAtom);
  const setStatus = useSetAtom(rosStatusAtom);

  useEffect(() => setRos(ros), [ros, setRos]);
  useEffect(() => setStatus(status), [status, setStatus]);

  return null;
}
```

```tsx
// App.tsx
import { RosProvider } from "roshooks";
import { RosJotaiBridge } from "./RosJotaiBridge";

export function App() {
  return (
    <RosProvider url="ws://localhost:9090">
      <RosJotaiBridge />
      <Dashboard />
    </RosProvider>
  );
}
```

```tsx
// Anywhere else in the app — even outside RosProvider
import { useAtomValue } from "jotai";
import { rosStatusAtom } from "./store/ros";

function HeaderConnectionBadge() {
  const status = useAtomValue(rosStatusAtom);
  return <span>{status}</span>;
}
```

## Pattern B: a single shared atom for a topic subscription

`useTopic` creates one `Topic` per call site, so rendering the same topic in ten components opens ten subscriptions. Moving the subscription itself into an atom means there's always exactly one subscription, and it's torn down automatically once no component is reading it anymore.

Jotai atoms have an `onMount` hook that fires when the first subscriber appears and cleans up when the last one goes away — exactly the lifecycle we want here. `getDefaultStore()` lets us read `rosAtom`'s current value and re-subscribe whenever `ros` (re)connects.

```ts
// store/topic.ts
import { atom, getDefaultStore } from "jotai";
import { Topic } from "roslib";
import { rosAtom } from "./ros";

const store = getDefaultStore();

/** Creates a global atom holding the latest message on a given topic. */
export function createTopicAtom<T>(name: string, messageType: string) {
  const messageAtom = atom<T | null>(null);

  messageAtom.onMount = (setMessage) => {
    let topic: Topic<T> | undefined;
    let handleMessage: ((msg: T) => void) | undefined;

    const subscribe = () => {
      const ros = store.get(rosAtom);
      if (!ros) return;
      topic = new Topic<T>({ ros, name, messageType });
      handleMessage = (msg) => setMessage(msg);
      topic.subscribe(handleMessage);
    };

    const unsubscribe = () => {
      if (topic && handleMessage) topic.unsubscribe(handleMessage);
      topic = undefined;
    };

    subscribe();
    // Re-subscribe whenever ros (re)connects.
    const unwatchRos = store.sub(rosAtom, () => {
      unsubscribe();
      subscribe();
    });

    return () => {
      unsubscribe();
      unwatchRos();
    };
  };

  return messageAtom;
}

interface StringMsg {
  data: string;
}

export const chatterAtom = createTopicAtom<StringMsg>("/chatter", "std_msgs/String");
```

```tsx
// No matter how many components read this, there's only one subscription.
import { useAtomValue } from "jotai";
import { chatterAtom } from "./store/topic";

function ChatterLabel() {
  const message = useAtomValue(chatterAtom);
  return <p>{message?.data ?? "(none)"}</p>;
}
```

:::tip Which pattern should I use?
- For subscriptions scoped to a single component, plain [`useTopic`](/api/use-topic) / [`usePublisher`](/api/use-publisher) is simplest.
- Reach for a Jotai atom when you need app-wide sharing, want to collapse many subscriptions into one, or need access from outside `RosProvider`.
:::

## The same idea applies to `useParam` / `useAction`

Following pattern B, you can build `Param` or `Action` clients inside `onMount` the same way, so a parameter's current value or an action's execution state can be shared globally too. The shape is always the same: read `ros` from `rosAtom`, create a roslib.js client, call `setSelf` from its callbacks, and return a cleanup function.
