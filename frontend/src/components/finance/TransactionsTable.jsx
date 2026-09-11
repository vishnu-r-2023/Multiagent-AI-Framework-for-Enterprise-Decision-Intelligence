import { memo } from "react";

const statusClassByTone = {
  completed: "bg-green-100 text-green-700",
  processing: "bg-amber-100 text-amber-700",
};

const amountClassByTone = {
  default: "text-slate-900",
  positive: "text-green-600",
};

function TransactionsTable({ transactions }) {
  return (
    <section className="glass-card mb-12 overflow-hidden rounded-xl shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200/50 bg-white/30 p-6">
        <h4 className="text-lg font-bold">Recent Transactions</h4>
        <button className="text-sm font-bold text-primary hover:underline">
          View All Activity
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-8 py-4">Transaction ID</th>
              <th className="px-8 py-4">Date</th>
              <th className="px-8 py-4">Counterparty</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="transition-colors hover:bg-primary/5"
              >
                <td className="px-8 py-4 font-mono text-xs font-bold">
                  {transaction.id}
                </td>
                <td className="px-8 py-4 text-xs font-medium text-slate-500">
                  {transaction.date}
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold">
                      {transaction.initials}
                    </div>
                    <span className="text-xs font-semibold">
                      {transaction.counterparty}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      statusClassByTone[transaction.statusTone]
                    }`}
                  >
                    {transaction.status}
                  </span>
                </td>
                <td
                  className={`px-8 py-4 text-right text-xs font-black ${
                    amountClassByTone[transaction.amountTone]
                  }`}
                >
                  {transaction.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default memo(TransactionsTable);
