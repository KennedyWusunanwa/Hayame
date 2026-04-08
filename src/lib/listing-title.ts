export function buildListingTitle(
  brand: string | null | undefined,
  model: string | null | undefined,
  carYear: number | null | undefined,
): string | null {
  const normalizedBrand =
    typeof brand === "string" ? brand.trim().replace(/\s+/g, " ") : "";
  const normalizedModel =
    typeof model === "string" ? model.trim().replace(/\s+/g, " ") : "";
  const normalizedYear =
    typeof carYear === "number" && Number.isFinite(carYear)
      ? String(carYear)
      : "";

  if (!normalizedBrand || !normalizedModel || !normalizedYear) {
    return null;
  }

  return `${normalizedBrand} ${normalizedModel} ${normalizedYear}`;
}

export function buildListingTitlePreview(
  brand: string | null | undefined,
  model: string | null | undefined,
  carYear: number | null | undefined,
): string {
  return (
    buildListingTitle(brand, model, carYear) ?? "Select brand, model and year"
  );
}
