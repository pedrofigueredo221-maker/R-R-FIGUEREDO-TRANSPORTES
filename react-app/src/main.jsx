import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./styles/screens.css";

const rootElement = document.getElementById("react-root");

if (!rootElement) {
  throw new Error('Elemento raiz do React "#react-root" não encontrado.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
