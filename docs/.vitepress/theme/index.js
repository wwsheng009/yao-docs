import DefaultTheme from "vitepress/theme";
import ZoomImg from "./ZoomImg.vue";

import "./custom.css";
import "./index.css";

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component("ZoomImg", ZoomImg);
  },
};
