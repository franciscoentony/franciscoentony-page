import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { resolveAssetPath } from "./utils/resolvePath";

// Tile ASCII do skeleton das imagens (docs/redesign/SPEC-SKELETON-IMAGENS.md).
// Vai por variável CSS para respeitar o BASE_URL do deploy.
document.documentElement.style.setProperty(
  "--skeleton-mask",
  `url("${resolveAssetPath("/ui/skeleton-ascii.webp")}")`,
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
