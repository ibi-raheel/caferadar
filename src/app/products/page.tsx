import { getProducts, getSuppliers, getCategories } from "@/lib/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; supplier?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const { products, total } = getProducts(params.search, params.supplier, params.category, page, 50);
  const suppliers = getSuppliers();
  const categories = getCategories();
  const totalPages = Math.ceil(total / 50);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { search: params.search, supplier: params.supplier, category: params.category, page: "1", ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/products?${p.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-gray-500 text-sm mt-1">
          {total.toLocaleString()} variants across all suppliers
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form className="flex-1 min-w-[200px]">
          <input type="hidden" name="supplier" value={params.supplier || ""} />
          <input type="hidden" name="category" value={params.category || ""} />
          <input
            type="text"
            name="search"
            placeholder="Search products..."
            defaultValue={params.search || ""}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
        <div className="flex gap-2">
          {params.supplier && (
            <Link href={buildUrl({ supplier: undefined })} className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
              {suppliers.find(s => s.id === params.supplier)?.name} &times;
            </Link>
          )}
          {params.category && (
            <Link href={buildUrl({ category: undefined })} className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200">
              {params.category} &times;
            </Link>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-500 py-1">Suppliers:</span>
        {suppliers.map((s) => (
          <Link
            key={s.id}
            href={buildUrl({ supplier: s.id })}
            className={`px-2 py-1 text-xs rounded-md border transition-colors ${
              params.supplier === s.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {s.name} ({s.product_count})
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-500 py-1">Categories:</span>
        {categories.slice(0, 15).map((c) => (
          <Link
            key={c.name}
            href={buildUrl({ category: c.name })}
            className={`px-2 py-1 text-xs rounded-md border transition-colors ${
              params.category === c.name
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-purple-400"
            }`}
          >
            {c.name} ({c.count})
          </Link>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Per Unit</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.variant_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <a
                    href={p.product_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {p.title}
                  </a>
                  <div className="flex gap-2 mt-0.5">
                    {p.vendor && <span className="text-xs text-gray-500">{p.vendor}</span>}
                    {p.product_type && <span className="text-xs text-gray-400">&middot; {p.product_type}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.supplier_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.variant_title}</td>
                <td className="px-4 py-3 text-sm font-semibold text-right">
                  ${p.price.toFixed(2)}
                  {p.discount_pct && (
                    <span className="ml-1 text-xs text-red-600">-{p.discount_pct}%</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  ${p.per_unit_price.toFixed(2)}/ea
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${p.available ? "bg-green-500" : "bg-red-400"}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
