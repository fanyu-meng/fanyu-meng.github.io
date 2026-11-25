import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const en = location.pathname.startsWith("/en/");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold">404</h1>
        <p className="mb-4 text-base text-muted-foreground">{en ? "This page doesn’t exist." : "没有这个页面。"}</p>
        <a href={en ? "/en/" : "/"} className="text-primary underline hover:text-primary/90">
          {en ? "Back to the home page" : "返回首页"}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
