import { defineConfig } from "vitepress";

export default defineConfig({
  title: "roshooks",
  description: "React hooks for roslib.js",
  lang: "en-US",
  cleanUrls: true,
  // GitHub Pages project-site base path. Update this if the repository is
  // renamed or the docs are published under a different path.
  base: "/roshooks/",

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/api/ros-provider" },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Connection Status", link: "/guide/connection-status" },
          { text: "Testing", link: "/guide/testing" },
          { text: "Global State with Jotai", link: "/guide/jotai" },
        ],
      },
      {
        text: "API Reference",
        items: [
          { text: "RosProvider", link: "/api/ros-provider" },
          { text: "useRos", link: "/api/use-ros" },
          { text: "useTopic", link: "/api/use-topic" },
          { text: "usePublisher", link: "/api/use-publisher" },
          { text: "useService", link: "/api/use-service" },
          { text: "useParam", link: "/api/use-param" },
          { text: "useAction", link: "/api/use-action" },
          { text: "useTF", link: "/api/use-tf" },
        ],
      },
    ],

    search: {
      provider: "local",
    },

    outline: {
      label: "On this page",
    },

    docFooter: {
      prev: "Previous",
      next: "Next",
    },
  },
});
