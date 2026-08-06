import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Ros } from "roslib";
import { RosProvider, useRos, useService } from "../src";
import { createFakeTransportFactory } from "./utils/fakeTransport";

interface AddTwoIntsRequest {
  a: number;
  b: number;
}

interface AddTwoIntsResponse {
  sum: number;
}

function Adder({ onRos }: { onRos: (ros: Ros) => void }) {
  const { ros } = useRos();
  const { callService, result, loading, error } = useService<AddTwoIntsRequest, AddTwoIntsResponse>({
    name: "/add_two_ints",
    serviceType: "rospy_tutorials/AddTwoInts",
  });
  onRos(ros);

  return (
    <div>
      <button data-testid="call" onClick={() => void callService({ a: 2, b: 3 }).catch(() => {})}>
        call
      </button>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="error">{error ?? "(none)"}</div>
      <div data-testid="result">{result ? result.sum : "(none)"}</div>
    </div>
  );
}

describe("useService", () => {
  it("resolves callService once rosbridge replies with a service_response", async () => {
    const { factory, transports } = createFakeTransportFactory();
    let ros: Ros | undefined;

    render(
      <RosProvider url="ws://localhost:9090" transportFactory={factory}>
        <Adder
          onRos={(r) => {
            ros = r;
          }}
        />
      </RosProvider>,
    );

    await waitFor(() => expect(transports).toHaveLength(1));
    act(() => transports[0].open());

    act(() => {
      screen.getByTestId("call").click();
    });

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("true"));

    const callMessage = transports[0].sent.find((m) => m.op === "call_service");
    expect(callMessage).toBeDefined();
    expect(callMessage.args).toEqual({ a: 2, b: 3 });

    act(() => {
      ros!.emit(callMessage.id, {
        op: "service_response",
        id: callMessage.id,
        service: "/add_two_ints",
        values: { sum: 5 },
        result: true,
      });
    });

    await waitFor(() => expect(screen.getByTestId("result").textContent).toBe("5"));
    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("error").textContent).toBe("(none)");
  });

  it("surfaces the failure message when the service call fails", async () => {
    const { factory, transports } = createFakeTransportFactory();
    let ros: Ros | undefined;

    render(
      <RosProvider url="ws://localhost:9090" transportFactory={factory}>
        <Adder
          onRos={(r) => {
            ros = r;
          }}
        />
      </RosProvider>,
    );

    await waitFor(() => expect(transports).toHaveLength(1));
    act(() => transports[0].open());

    act(() => {
      screen.getByTestId("call").click();
    });

    await waitFor(() => expect(transports[0].sent.some((m) => m.op === "call_service")).toBe(true));
    const callMessage = transports[0].sent.find((m) => m.op === "call_service");

    act(() => {
      ros!.emit(callMessage.id, {
        op: "service_response",
        id: callMessage.id,
        service: "/add_two_ints",
        values: "boom",
        result: false,
      });
    });

    await waitFor(() => expect(screen.getByTestId("error").textContent).toBe("boom"));
  });
});
