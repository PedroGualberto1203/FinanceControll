export default {
  content: ["./index.html", "./html/**/*.html", "./js/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#06070A",
        panel: "#101116",
        panelSoft: "#171920",
        line: "rgba(255,255,255,0.08)",
        blue: "#3A82FF",
        yellow: "#F6C90E"
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
