import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type QrCodeViewerProps = {
  token: string;
  size?: number;
  nodeName?: string;
  subLabel?: string;
  showActions?: boolean;
};

export function QrCodeViewer({
  token,
  size = 200,
  nodeName,
  subLabel,
  showActions = true,
}: QrCodeViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !token) return;

    const base = import.meta.env.VITE_PUBLIC_APP_URL || (window.location.port === "5173" ? `${window.location.protocol}//${window.location.hostname}:8000` : window.location.origin);
    const publicUrl = new URL(base);
    publicUrl.searchParams.set("qr", token);
    const payload = publicUrl.toString();

    QRCode.toCanvas(
      canvasRef.current,
      payload,
      {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      },
      (err) => {
        setError(err ? "Não foi possível gerar o QR Code." : null);
        if (!err && canvasRef.current) {
          setDataUrl(canvasRef.current.toDataURL("image/png"));
        }
      }
    );
  }, [token, size]);

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qrcode-${token}.png`;
    a.click();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Selecione o token abaixo e copie. Cópia automática requer HTTPS.");
    }
  }

  return (
    <div className="qr-viewer">
      {error && <p role="alert">{error}</p>}
      <div className="qr-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
      <div className="qr-info">
        <code className="qr-token">{token}</code>
        {nodeName && <p className="qr-node-name">{nodeName}</p>}
        {subLabel && <p className="qr-sublabel muted">{subLabel}</p>}
      </div>
      {showActions && (
        <div className="qr-actions no-print">
          <button type="button" onClick={handleDownload} title="Baixar imagem PNG">
            💾 Baixar
          </button>
          <button type="button" onClick={handleCopy} title="Copiar token">
            {copied ? "✓ Copiado" : "📋 Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}

export default QrCodeViewer;
