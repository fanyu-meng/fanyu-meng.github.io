import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Error handling for root element
const rootElement = document.getElementById("root");
if (!rootElement) {
  document.body.innerHTML = '<div style="padding: 20px; color: red;"><h1>Error: Root element not found</h1></div>';
  throw new Error("Root element not found");
}

// Add error boundary
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h1>Application Error</h1>
        <p><strong>Message:</strong> ${event.message}</p>
        <p><strong>Source:</strong> ${event.filename}:${event.lineno}:${event.colno}</p>
        <pre>${event.error?.stack || 'No stack trace'}</pre>
      </div>
    `;
  }
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

try {
  console.log("Starting app render...");
  createRoot(rootElement).render(<App />);
  console.log("App rendered successfully");
} catch (error) {
  console.error("Failed to render app:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h1>Application Error</h1>
      <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
      <pre>${error instanceof Error ? error.stack : String(error)}</pre>
    </div>
  `;
}
