import { defineConfig } from "vitepress";

export default defineConfig({
  title: "roshooks",
  description: "React hooks for roslib.js",
  cleanUrls: true,
  // GitHub Pages project-site base path. Update this if the repository is
  // renamed or the docs are published under a different path.
  base: "/roshooks/",

  themeConfig: {
    // Shared across all locales.
    search: {
      provider: "local",
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: "Search", buttonAriaLabel: "Search" },
              modal: {
                noResultsText: "No results for",
                resetButtonTitle: "Reset search",
                footer: {
                  selectText: "to select",
                  navigateText: "to navigate",
                  closeText: "to close",
                },
              },
            },
          },
          ja: {
            translations: {
              button: { buttonText: "検索", buttonAriaLabel: "検索" },
              modal: {
                noResultsText: "検索結果が見つかりません:",
                resetButtonTitle: "検索条件をリセット",
                footer: {
                  selectText: "選択",
                  navigateText: "移動",
                  closeText: "閉じる",
                },
              },
            },
          },
        },
      },
    },
  },

  locales: {
    root: {
      label: "English",
      lang: "en-US",
      link: "/",
      title: "roshooks",
      description: "React hooks for roslib.js",
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
        outline: {
          label: "On this page",
        },
        docFooter: {
          prev: "Previous",
          next: "Next",
        },
      },
    },

    ja: {
      label: "日本語",
      lang: "ja-JP",
      link: "/ja/",
      title: "roshooks",
      description: "roslib.js を React Hooks でラップするライブラリ",
      themeConfig: {
        nav: [
          { text: "ガイド", link: "/ja/guide/getting-started" },
          { text: "API", link: "/ja/api/ros-provider" },
        ],
        sidebar: [
          {
            text: "ガイド",
            items: [
              { text: "はじめに", link: "/ja/guide/getting-started" },
              { text: "接続状態の扱い方", link: "/ja/guide/connection-status" },
              { text: "テストの書き方", link: "/ja/guide/testing" },
              { text: "Jotaiでのグローバル状態管理", link: "/ja/guide/jotai" },
            ],
          },
          {
            text: "APIリファレンス",
            items: [
              { text: "RosProvider", link: "/ja/api/ros-provider" },
              { text: "useRos", link: "/ja/api/use-ros" },
              { text: "useTopic", link: "/ja/api/use-topic" },
              { text: "usePublisher", link: "/ja/api/use-publisher" },
              { text: "useService", link: "/ja/api/use-service" },
              { text: "useParam", link: "/ja/api/use-param" },
              { text: "useAction", link: "/ja/api/use-action" },
              { text: "useTF", link: "/ja/api/use-tf" },
            ],
          },
        ],
        outline: {
          label: "このページの目次",
        },
        docFooter: {
          prev: "前へ",
          next: "次へ",
        },
      },
    },
  },
});
