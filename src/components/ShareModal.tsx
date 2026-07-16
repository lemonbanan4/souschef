import { useEffect, useRef, useState } from "react";
import type { GameState, LevelInfo } from "../types";
import { CARD_FORMATS, type CardFormat, copyCard, downloadCard, renderChefCard, shareCard } from "../lib/share";
import { loadChefName } from "../lib/profile";

interface Props {
  game: GameState;
  level: LevelInfo;
  badgeTotal: number;
  onClose: () => void;
  onNotify: (message: string, error?: boolean) => void;
}

export default function ShareModal({ game, level, badgeTotal, onClose, onNotify }: Props) {
  const [format, setFormat] = useState<CardFormat>("story");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canNativeShare = typeof navigator.share === "function";

  useEffect(() => {
    let live = true;
    // wait for Baloo 2 / Nunito so the canvas text renders in-brand
    void document.fonts.ready.then(() => {
      if (!live) return;
      const canvas = renderChefCard(format, game, level, badgeTotal, loadChefName() || undefined);
      canvasRef.current = canvas;
      setPreviewUrl(canvas.toDataURL("image/png"));
    });
    return () => {
      live = false;
    };
  }, [format, game, level, badgeTotal]);

  const filename = `souschef-lv${level.level}-${format}.png`;

  async function handleShare() {
    if (!canvasRef.current) return;
    const result = await shareCard(canvasRef.current, filename);
    if (result === "unsupported") {
      downloadCard(canvasRef.current, filename);
      onNotify("Share sheet unavailable here — downloaded instead ⬇️");
    }
  }

  async function handleCopy() {
    if (!canvasRef.current) return;
    const ok = await copyCard(canvasRef.current);
    onNotify(ok ? "Card copied — paste it anywhere 📋" : "Clipboard blocked — try download instead", !ok);
  }

  function handleDownload() {
    if (!canvasRef.current) return;
    downloadCard(canvasRef.current, filename);
    onNotify("Chef card downloaded ⬇️");
  }

  const activeFormat = CARD_FORMATS.find((f) => f.id === format)!;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal clay share-modal" onClick={(e) => e.stopPropagation()}>
        <h2>📤 Share your chef card</h2>

        <div className="mode-tabs" role="tablist" style={{ marginBottom: 12 }}>
          {CARD_FORMATS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={format === f.id}
              className={`mode-tab ${format === f.id ? "active" : ""}`}
              onClick={() => setFormat(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p style={{ marginBottom: 12 }}>{activeFormat.hint}</p>

        <div className={`share-preview ${format}`}>
          {previewUrl ? <img src={previewUrl} alt="Chef card preview" /> : <div className="share-loading">🍳 plating…</div>}
        </div>

        <div className="modal-actions" style={{ justifyContent: "center", flexWrap: "wrap" }}>
          {canNativeShare && (
            <button className="cook-btn" onClick={handleShare}>Share 📤</button>
          )}
          <button className={canNativeShare ? "ghost-btn" : "cook-btn"} onClick={handleDownload}>Download ⬇️</button>
          <button className="ghost-btn" onClick={handleCopy}>Copy 📋</button>
          <button className="ghost-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
