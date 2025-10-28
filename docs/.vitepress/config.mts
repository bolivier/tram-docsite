import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "TRAM",
  description: "A Clojure web framework",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "./logo.png",
    nav: [
      { text: "Home", link: "/" },
      { text: "Install", link: "/installation" },
      { text: "Getting Started", link: "/getting-started" },
    ],

    sidebar: [
      {
        text: "Documentation",
        items: [
          { text: "Overview", link: "/overview" },
          { text: "Installation", link: "/installation" },
          {text: "Getting Started", link: "/getting-started"},
          { text: "Project Structure", link: "/project-structure" },
          { text: "Tutorial", link: "/tutorial" },

          { text: "Models", link: "/models" },
          { text: "Associations", link: "/associations" },
          { text: "Concerns", link: "/concerns" },

          { text: "Routing", link: "/routing" },
          { text: "Handlers", link: "/handlers" },

          { text: "Views", link: "/views" },

          { text: "Database", link: "/database" },

          { text: "Runtimes", link: "/runtimes" },
          { text: "CLI Generators", link: "/generators" },

          { text: "Components", link: "/components" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/bolivier/tram" }],
  },
});
