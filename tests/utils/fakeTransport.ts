import type { ITransport, ITransportFactory } from "roslib";

type TransportState = "connecting" | "open" | "closing" | "closed";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (event: any) => void;

/**
 * A roslib `ITransport` double that never touches a real WebSocket.
 * Implements just enough of an event emitter for `Ros` to attach its
 * open/close/error/message listeners.
 */
export class FakeTransport implements ITransport {
  sent: any[] = [];
  private state: TransportState = "connecting";
  private listeners: Record<string, Listener[]> = {};

  on(event: string, listener: Listener): this {
    (this.listeners[event] ??= []).push(listener);
    return this;
  }

  emit(event: string, payload?: unknown): void {
    for (const listener of this.listeners[event] ?? []) {
      listener(payload);
    }
  }

  send(message: any): void {
    this.sent.push(message);
  }

  close(): void {
    this.state = "closed";
    this.emit("close", undefined);
  }

  isConnecting(): boolean {
    return this.state === "connecting";
  }

  isOpen(): boolean {
    return this.state === "open";
  }

  isClosing(): boolean {
    return this.state === "closing";
  }

  isClosed(): boolean {
    return this.state === "closed";
  }

  /** Simulates the server accepting the connection. */
  open(): void {
    this.state = "open";
    this.emit("open", undefined);
  }
}

/** Builds a `transportFactory` for `Ros`/`RosProvider` that hands out `FakeTransport`s instead of real sockets. */
export function createFakeTransportFactory(): {
  factory: ITransportFactory;
  transports: FakeTransport[];
} {
  const transports: FakeTransport[] = [];
  const factory: ITransportFactory = async () => {
    const transport = new FakeTransport();
    transports.push(transport);
    return transport;
  };
  return { factory, transports };
}
