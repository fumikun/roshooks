---
layout: home

hero:
  name: roshooks
  text: roslib.js as React Hooks
  tagline: A TypeScript library that lets you write React apps connected to ROS / ROS 2 over rosbridge using declarative Hooks
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/ros-provider

features:
  - title: Connection lifecycle management
    details: RosProvider owns a single roslib.Ros connection and broadcasts its status (connecting / connected / closed / error) to descendants via context.
  - title: Topic subscribe & publish
    details: useTopic / usePublisher automatically subscribe and advertise in sync with a component's lifecycle, cleaning up on unmount.
  - title: Services, params, actions, and TF
    details: useService / useParam / useAction / useTF cover the core ROS / ROS 2 features as Hooks.
  - title: Fully typed
    details: Message types are generic parameters, and roshooks builds directly on the types roslib.js ships with.
---
