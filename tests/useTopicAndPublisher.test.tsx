import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Ros } from "roslib";
import { RosProvider, useRos, usePublisher, useTopic } from "../src";
import { createFakeTransportFactory } from "./utils/fakeTransport";

interface ChatterMessage {
  data: string;
}

function Subscriber({ onRos }: { onRos: (ros: Ros) => void }) {
  const { ros } = useRos();
  const { message } = useTopic<ChatterMessage>({ name: "/chatter", messageType: "std_msgs/String" });
  onRos(ros);
  return <div data-testid="message">{message?.data ?? "(none)"}</div>;
}

function Publisher() {
  const { ros } = useRos();
  const { publish } = usePublisher<ChatterMessage>({ name: "/chatter", messageType: "std_msgs/String" });
  return (
    <button
      onClick={() => publish({ data: "hello" })}
      data-testid="publish"
      data-connected={ros.isConnected}
    >
      publish
    </button>
  );
}

describe("useTopic", () => {
  it("updates with each incoming message on the subscribed topic", async () => {
    const { factory } = createFakeTransportFactory();
    let ros: Ros | undefined;

    render(
      <RosProvider url="ws://localhost:9090" transportFactory={factory}>
        <Subscriber
          onRos={(r) => {
            ros = r;
          }}
        />
      </RosProvider>,
    );

    expect(screen.getByTestId("message").textContent).toBe("(none)");

    // Simulate rosbridge delivering a publish message for the subscribed topic.
    act(() => {
      ros!.emit("/chatter", { op: "publish", topic: "/chatter", msg: { data: "hello" } });
    });

    await waitFor(() => expect(screen.getByTestId("message").textContent).toBe("hello"));
  });
});

describe("usePublisher", () => {
  it("publishes onto the ros connection, auto-advertising the topic", async () => {
    const { factory, transports } = createFakeTransportFactory();

    render(
      <RosProvider url="ws://localhost:9090" transportFactory={factory}>
        <Publisher />
      </RosProvider>,
    );

    await waitFor(() => expect(transports).toHaveLength(1));
    act(() => transports[0].open());

    act(() => {
      screen.getByTestId("publish").click();
    });

    await waitFor(() => {
      const publishMessage = transports[0].sent.find((m) => m.op === "publish");
      expect(publishMessage).toBeDefined();
      expect(publishMessage.topic).toBe("/chatter");
      expect(publishMessage.msg).toEqual({ data: "hello" });
    });
  });
});
