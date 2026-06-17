export const STATUS_ORDER = ["pending", "paid", "printing", "shipped", "fulfilled"];

export const money = (c: number) => "$" + ((c || 0) / 100).toFixed(2);

export const fmtDate = (iso: string | Date | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

export const fmtDateTime = (iso: string | Date | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export const pct = (n: number) => (n * 100).toFixed(1) + "%";
