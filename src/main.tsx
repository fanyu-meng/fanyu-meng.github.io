import { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <h1>页面暂时无法显示</h1>
          <p>请刷新页面重试。</p>
          <button type="button" onClick={() => window.location.reload()}>刷新页面</button>
        </main>
      );
    }

    return this.props.children;
  }
}

// Cross-origin scripts can report an opaque "Script error.". Logging a global
// error must not replace the React root when the page is still working.
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
