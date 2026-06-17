import Settings from "@/models/Settings";

/**
 * Runtime-configurable Gelato order mode. A DB setting (toggled from the admin)
 * overrides the GELATO_ORDER_TYPE env default, so you can flip draft/production
 * without a redeploy. Falls back to the env var, then "draft" (the safe default).
 */
export async function getGelatoOrderType(): Promise<"order" | "draft"> {
  const s = await Settings.findById("gelatoOrderType").lean();
  const val = s?.value ?? (process.env.GELATO_ORDER_TYPE === "order" ? "order" : "draft");
  return val === "order" ? "order" : "draft";
}

export async function setGelatoOrderType(value: "order" | "draft"): Promise<void> {
  await Settings.findByIdAndUpdate("gelatoOrderType", { value }, { upsert: true });
}
