import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RosProvider, useRos } from "../src";
import { createFakeTransportFactory } from "./utils/fakeTransport";

function StatusProbe() {
  const { status, isConnected } = useRos();
  return <div data-testid="status">{isConnected ? "connected" : status}</div>;
}

describe("RosProvider", () => {
  it("starts connecting and transitions to connected once the transport opens", async () => {
    const { factory, transports } = createFakeTransportFactory();

    render(
      <RosProvider url="ws://localhost:9090" transportFactory={factory}>
        <StatusProbe />
      </RosProvider>,
    );

    expect(screen.getByTestId("status").textContent).toBe("connecting");

    await waitFor(() => expect(transports).toHaveLength(1));
    act(() => {
      transports[0].open();
    });

    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("connected"));
  });

  it("throws when a hook is used outside of a RosProvider", () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => render(<StatusProbe />)).toThrow(/RosProvider/);
    console.error = consoleError;
  });
});
