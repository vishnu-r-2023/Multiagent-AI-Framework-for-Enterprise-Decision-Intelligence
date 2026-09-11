import { memo } from "react";

const statusClassByTone = {
  active: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
};

function TopProductsCard({ products }) {
  return (
    <section className="glass-card flex flex-col rounded-xl border border-white/40 p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="text-lg font-bold text-slate-900">Top Performing Products</h4>
        <button className="text-slate-500 transition-colors hover:text-slate-900">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200/50 text-xs font-bold uppercase tracking-widest text-slate-400">
              <th className="pb-4">Product</th>
              <th className="pb-4 text-center">Sales</th>
              <th className="pb-4 text-right">Revenue</th>
              <th className="pb-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr
                key={product.name}
                className="group transition-colors hover:bg-slate-50/50"
              >
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <span className="material-symbols-outlined">
                        {product.icon}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="py-4 text-center text-sm text-slate-600">
                  {product.sales}
                </td>
                <td className="py-4 text-right text-sm font-bold text-slate-900">
                  {product.revenue}
                </td>
                <td className="py-4 text-right">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-tight ${
                      statusClassByTone[product.statusTone]
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="mt-6 w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200">
        View All Products
      </button>
    </section>
  );
}

export default memo(TopProductsCard);
