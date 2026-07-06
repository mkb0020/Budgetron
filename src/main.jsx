import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { createPrettyWindow } from "./ui/window/window.js";
import "./ui/window/window.css";
import "./App.css";

createPrettyWindow({
  title: "Budgetron",
  icon: "/images/icon.png",
  accentColor: "#00ffff", // AquaAura — swap to a hex from any preset if you want a different vibe
  version: "v0.1.0",
  statusText: "ready",
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
