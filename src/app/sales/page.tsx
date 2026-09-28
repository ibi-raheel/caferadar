import { getSales } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default function SalesPage() {
  const sales = getSales();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Active Sales</h1>
        <p className="text-gray-500 text-sm mt-1">
          {sales.length} items currently on sale across all suppliers
        </p>
      </div>

      {sales.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No active sales right now</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Was</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Per Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((sale) => (
                <tr key={sale.variant_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <a
                      href={sale.product_url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {sale.title}
                    </a>
                    {sale.vendor && (
                      <p className="text-xs text-gray-500">{sale.vendor}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{sale.supplier_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{sale.variant_title}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-green-700">
                    ${sale.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 text-right line-through">
                    ${sale.compare_at_price?.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                      {sale.discount_pct}% off
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    ${sale.per_unit_price.toFixed(2)}/ea
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
