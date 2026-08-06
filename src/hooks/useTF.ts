import { useEffect, useState } from "react";
import { ROS2TFClient, TFClient, type Transform } from "roslib";
import { useRosContext } from "../RosContext";

export interface UseTFOptions {
  /** The TF frame to subscribe to, like 'base_link'. */
  frameId: string;
  fixedFrame?: string;
  angularThres?: number;
  transThres?: number;
  rate?: number;
  updateDelay?: number;
  topicTimeout?: number;
  serverName?: string;
  /** Use the ROS 2 action-based tf2_web_republisher client instead of the ROS 1 service-based one. Defaults to `false`. */
  ros2?: boolean;
}

/**
 * Subscribes to the transform of `frameId` (relative to `fixedFrame`) via
 * tf2_web_republisher and re-renders with each update.
 */
export function useTF(options: UseTFOptions): Transform | null {
  const { ros } = useRosContext();
  const {
    frameId,
    fixedFrame,
    angularThres,
    transThres,
    rate,
    updateDelay,
    topicTimeout,
    serverName,
    ros2 = false,
  } = options;

  const [transform, setTransform] = useState<Transform | null>(null);

  useEffect(() => {
    const clientOptions = { ros, fixedFrame, angularThres, transThres, rate, updateDelay, topicTimeout, serverName };
    const client = ros2 ? new ROS2TFClient(clientOptions) : new TFClient(clientOptions);
    const handleTransform = (nextTransform: Transform) => setTransform(nextTransform);

    setTransform(null);
    client.subscribe(frameId, handleTransform);

    return () => {
      client.unsubscribe(frameId, handleTransform);
      client.dispose();
    };
  }, [ros, frameId, fixedFrame, angularThres, transThres, rate, updateDelay, topicTimeout, serverName, ros2]);

  return transform;
}
