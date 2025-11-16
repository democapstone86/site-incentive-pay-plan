import * as React from "react";

const SIPPHomePage = React.memo(function SIPPHomePage() {
  React.useEffect(() => {
    const html = document.documentElement;
    const prevOverflow = html.style.overflowY;
    const prevGutter = (html.style as any).scrollbarGutter;
    html.style.overflowY = "scroll";
    (html.style as any).scrollbarGutter = "stable both-edges";
    return () => {
      html.style.overflowY = prevOverflow;
      (html.style as any).scrollbarGutter = prevGutter || "";
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-900">
      <p>Test</p>
    </div>
  );
});

export default SIPPHomePage;
