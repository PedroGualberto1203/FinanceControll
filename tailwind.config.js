export default {
  content: ["./index.html", "./html/**/*.html", "./js/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#080B16",
        panel: "#11172A",
        panelSoft: "#161D34",
        line: "rgba(255,255,255,0.08)",
        blue: "#2F7BFF",
        yellow: "#F3C74D"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        card: "8px"
      }
    }
  },
  plugins: []
};
