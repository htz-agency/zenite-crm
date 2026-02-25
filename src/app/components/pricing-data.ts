// Minimal pricing-data types consumed by CRM.
// Full pricing engine lives in Zenite Price (price.htz.agency).

export type ServiceGroup = "performance" | "sales_ops" | "brand_co";

export const groupLabels: Record<ServiceGroup, string> = {
  performance: "Performance",
  sales_ops: "Sales OPS",
  brand_co: "Brand & Co",
};
