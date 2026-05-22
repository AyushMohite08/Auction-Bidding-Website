import EmptyState from "./EmptyState";

export default function DataTable({
  columns,
  rows,
  getRowKey,
  getRowId,
  rowClassName,
  emptyTitle,
  emptyDescription,
  fixed = true,
}) {
  if (!rows?.length) {
    return <EmptyState title={emptyTitle || "No records"} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className={`w-full divide-y divide-slate-200 ${fixed ? "table-fixed" : ""}`}>
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${column.width || ""} ${column.className || ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, index) => (
              <tr
                id={getRowId ? getRowId(row) : undefined}
                key={getRowKey ? getRowKey(row) : row.id || index}
                className={`transition-colors hover:bg-slate-50 ${rowClassName ? rowClassName(row, index) : ""}`}
              >
                {columns.map((column) => {
                  const content = column.render ? column.render(row, index) : row[column.key];
                  const title = typeof content === "string" || typeof content === "number" ? String(content) : undefined;

                  return (
                    <td key={column.key} className={`px-4 py-3 align-middle text-sm text-slate-700 ${column.truncate ? "max-w-0" : ""} ${column.cellClassName || ""}`}>
                      {column.truncate ? (
                        <div title={title} className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                          {content}
                        </div>
                      ) : (
                        content
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
