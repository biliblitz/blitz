import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Blitz",
  description:
    "A blitzingly fast, game changing, next generation meta framework for preact.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "GitHub", link: "https://github.com/biliblitz/blitz" },
    ],

    sidebar: [
      {
        text: "教程",
        items: [{ text: "快速开始", link: "/tutorial/start" }],
      },
      {
        text: "设计",
        items: [
          { text: "Routing", link: "/design/routing" },
          { text: "Loader", link: "/design/loader" },
          { text: "Action", link: "/design/action" },
          { text: "Middleware", link: "/design/middleware" },
        ],
      },
      {
        text: "目标",
        items: [
          { text: "Nodejs", link: "/target/nodejs" },
          { text: "Static", link: "/target/static" },
          { text: "Cloudflare Pages", link: "/target/cloudflare-pages" },
        ],
      },
      {
        text: "高级",
        items: [{ text: "MDX", link: "/advanced/mdx" }],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
