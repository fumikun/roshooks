import { useCallback, useEffect, useRef, useState } from "react";
import { Topic } from "roslib";
import { useRosContext } from "../RosContext";

export interface UsePublisherOptions {
  /** The topic name, like '/cmd_vel'. */
  name: string;
  /** The message type, like 'geometry_msgs/Twist'. */
  messageType: string;
  throttle_rate?: number;
  queue_size?: number;
  latch?: boolean;
  queue_length?: number;
  reconnect_on_close?: boolean;
}

export interface UsePublisherResult<TMessage> {
  /** Publishes a message on the topic. A no-op until the underlying topic is ready. */
  publish: (message: TMessage) => void;
  /** The underlying roslib.js `Topic` instance, or `null` before it's created. */
  topic: Topic<TMessage> | null;
}

/**
 * Advertises a ROS topic for the lifetime of the calling component and
 * returns a stable `publish` function bound to it. Re-advertises whenever
 * the topic name/type or other options change.
 */
export function usePublisher<TMessage = unknown>(options: UsePublisherOptions): UsePublisherResult<TMessage> {
  const { ros } = useRosContext();
  const { name, messageType, throttle_rate, queue_size, latch, queue_length, reconnect_on_close } = options;

  const topicRef = useRef<Topic<TMessage> | null>(null);
  const [topic, setTopic] = useState<Topic<TMessage> | null>(null);

  useEffect(() => {
    const currentTopic = new Topic<TMessage>({
      ros,
      name,
      messageType,
      throttle_rate,
      queue_size,
      latch,
      queue_length,
      reconnect_on_close,
    });
    topicRef.current = currentTopic;
    setTopic(currentTopic);

    return () => {
      currentTopic.unadvertise();
      topicRef.current = null;
      setTopic(null);
    };
  }, [ros, name, messageType, throttle_rate, queue_size, latch, queue_length, reconnect_on_close]);

  const publish = useCallback((message: TMessage) => {
    topicRef.current?.publish(message);
  }, []);

  return { publish, topic };
}
