"use client";

import { useCallback, useState } from "react";

type ConfirmOpts = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

const btnBase: React.CSSProperties = {
  border: "none",
  borderRadius: 999,
  padding: "11px 20px",
  fontWeight: 800,
  fontSize: ".9rem",
  cursor: "pointer",
  fontFamily: "inherit",
};

/**
 * Promise-based confirmation modal — a styled drop-in for window.confirm().
 *   const { confirm, confirmNode } = useConfirm();
 *   if (!(await confirm({ message: "Sure?", danger: true }))) return;
 *   ...render {confirmNode} somewhere in the component.
 */
export function useConfirm() {
  const [opts, setOpts] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback(
    (o: ConfirmOpts) => new Promise<boolean>((resolve) => setOpts({ ...o, resolve })),
    []
  );

  const close = (v: boolean) => {
    opts?.resolve(v);
    setOpts(null);
  };

  const confirmNode = opts ? (
    <div
      onClick={() => close(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(43,33,64,.55)",
        display: "grid",
        placeItems: "center",
        padding: 24,
        animation: "ouFadeIn .18s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "28px 26px",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 24px 60px rgba(34,21,56,.4)",
          fontFamily: "inherit",
        }}
      >
        {opts.title && (
          <h3 style={{ margin: "0 0 8px", color: "#3A2A5C", fontSize: "1.25rem", fontWeight: 800 }}>{opts.title}</h3>
        )}
        <p style={{ margin: "0 0 22px", color: "#5A4E6E", lineHeight: 1.5 }}>{opts.message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => close(false)} style={{ ...btnBase, background: "#F4E9D2", color: "#3A2A5C" }}>
            {opts.cancelLabel || "Cancel"}
          </button>
          <button
            onClick={() => close(true)}
            style={{ ...btnBase, background: opts.danger ? "#c4452f" : "#E0654E", color: "#fff" }}
          >
            {opts.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
      <style>{`@keyframes ouFadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  ) : null;

  return { confirm, confirmNode };
}
