import { useEffect, useState } from "react";
import { Topic } from "roslib";
import { useRosContext } from "../RosContext";

export interface UseTopicOptions {
  /** The topic name, like '/cmd_vel'. */
  name: string;
  /** The message type, like 'std_msgs/String'. */
  messageType: string;
  compression?: string;
  throttle_rate?: number;
  queue_size?: number;
  latch?: boolean;
  queue_length?: number;
  reconnect_on_close?: boolean;
  /** Skip subscribing while `false`. Defaults to `true`. */
  enabled?: boolean;
}

export interface UseTopicResult<TMessage> {
  /** The latest message received on the topic, or `null` until the first one arrives. */
  message: TMessage | null;
  /** The underlying roslib.js `Topic` instance, or `null` while not subscribed. */
  topic: Topic<TMessage> | null;
}

/**
 * Subscribes to a ROS topic for the lifetime of the calling component and
 * re-renders with each incoming message. Resubscribes whenever the topic
 * name/type or other subscription options change.
 */
export function useTopic<TMessage = unknown>(options: UseTopicOptions): UseTopicResult<TMessage> {
  const { ros } = useRosContext();
  const {
    name,
    messageType,
    compression,
    throttle_rate,
    queue_size,
    latch,
    queue_length,
    reconnect_on_close,
    enabled = true,
  } = options;

  const [message, setMessage] = useState<TMessage | null>(null);
  const [topic, setTopic] = useState<Topic<TMessage> | null>(null);

  useEffect(() => {
    setMessage(null);
    if (!enabled) {
      setTopic(null);
      return;
    }

    const currentTopic = new Topic<TMessage>({
      ros,
      name,
      messageType,
      compression,
      throttle_rate,
      queue_size,
      latch,
      queue_length,
      reconnect_on_close,
    });
    const handleMessage = (msg: TMessage) => setMessage(msg);
    currentTopic.subscribe(handleMessage);
    setTopic(currentTopic);

    return () => {
      currentTopic.unsubscribe(handleMessage);
      setTopic(null);
    };
  }, [
    ros,
    name,
    messageType,
    compression,
    throttle_rate,
    queue_size,
    latch,
    queue_length,
    reconnect_on_close,
    enabled,
  ]);

  return { message, topic };
}
