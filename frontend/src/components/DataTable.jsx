import EmptyState from "./EmptyState";

export default function DataTable({ columns, rows, getRowKey, emptyTitle, emptyDescription }) {
  if (!rows?.length) {
    return <EmptyState title={emptyTitle || "No records"} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${column.className || ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, index) => (
              <tr key={getRowKey ? getRowKey(row) : row.id || index} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 text-sm text-slate-700 ${column.cellClassName || ""}`}>
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
