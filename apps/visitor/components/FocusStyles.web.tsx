import { useEffect } from "react";

export function FocusStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      input,textarea,button,select { font-family: Arial, Helvetica, sans-serif; }
      :focus-visible { outline: 2px solid #17473f !important; outline-offset: 2px; }
      [role="button"]:focus-visible { box-shadow: 0 0 0 3px #f5cc54 !important; }
      [role="tab"]:focus-visible { outline-offset: -3px; }
      @keyframes destination-pulse { 50% { opacity: .45; } }
      [data-testid="destination-marker"] { animation: destination-pulse 1.8s ease-in-out 2; }
      @media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
      @media (forced-colors: active) { [role="button"],[role="tab"],input { border: 1px solid ButtonText !important; } }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  return null;
}
