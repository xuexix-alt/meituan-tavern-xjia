export type PackageLike = Record<string, unknown>;

function asText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function packageKey(pkg: PackageLike): string {
  const id = asText(pkg.id);
  const shopId = asText(pkg.shop_id ?? pkg.shopId ?? '');
  return id ? `${shopId}::${id}` : '';
}

/** Keep legacy package IDs distinct when they repeat across shops. */
export function dedupePackages(packages: unknown[]): PackageLike[] {
  const seen = new Set<string>();
  return packages.filter((value): value is PackageLike => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const pkg = value as PackageLike;
    const key = packageKey(pkg);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Resolve a package by ID, using the legacy name query only as a compatibility fallback. */
export function findPackageByIdOrName(
  packages: PackageLike[],
  itemId: string,
  itemName?: string,
  preferName = false,
): PackageLike | undefined {
  const byId = packages.find(pkg => asText(pkg.id) === itemId);
  const byName = itemName ? packages.find(pkg => asText(pkg.name) === itemName) : undefined;
  return preferName ? (byName ?? byId) : (byId ?? byName);
}
