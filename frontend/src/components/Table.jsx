import React, { useState, useMemo } from "react";
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, Search, X,
} from "lucide-react";

/**
 * Table Component — fully reusable, sortable, searchable, paginated
 *
 * Usage:
 *   const columns = [
 *     { key: "name",   label: "Name",   sortable: true },
 *     { key: "email",  label: "Email"  },
 *     { key: "role",   label: "Role",   render: (val) => <Badge>{val}</Badge> },
 *     { key: "actions",label: "",       render: (_, row) => <Button>Edit</Button> },
 *   ];
 *
 *   <Table
 *     columns={columns}
 *     data={users}
 *     searchable
 *     searchPlaceholder="Search users..."
 *     pageSize={10}
 *     emptyMessage="No users found"
 *   />
 */

// ─── Sort Icon ────────────────────────────────────────────────────────────────
function SortIcon({ column, sortKey, sortDir }) {
  if (sortKey !== column) return <ChevronsUpDown size={13} className="text-gray-600" />;
  return sortDir === "asc"
    ? <ChevronUp   size={13} className="text-brand-400" />
    : <ChevronDown size={13} className="text-brand-400" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Table({
  columns          = [],
  data             = [],
  searchable       = false,
  searchPlaceholder= "Search...",
  searchKeys       = [],          // keys to search across; defaults to all string columns
  pageSize         = 10,
  paginated        = true,
  emptyMessage     = "No data found",
  emptyIcon        = null,
  loading          = false,
  title            = "",
  titleIcon: TitleIcon = null,
  headerRight      = null,        // React node rendered in top-right of header
  onRowClick       = null,
  rowClassName     = "",
  className        = "",
  stickyHeader     = false,
}) {
  const [sortKey,   setSortKey]   = useState("");
  const [sortDir,   setSortDir]   = useState("asc");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);

  // ── Determine searchable keys ──────────────────────────────────────────────
  const effectiveSearchKeys = searchKeys.length > 0
    ? searchKeys
    : columns.filter(c => c.key && c.key !== "actions").map(c => c.key);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      effectiveSearchKeys.some(key => {
        const val = row[key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, effectiveSearchKeys]);

  // ── Sort ───────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // ── Paginate ───────────────────────────────────────────────────────────────
  const totalPages = paginated ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const paginated_data = paginated
    ? sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sorted;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  // ── Skeleton rows ──────────────────────────────────────────────────────────
  const skeletonRows = Array(pageSize > 5 ? 5 : pageSize).fill(null);

  return (
    <div className={`bg-surface-1 border border-surface-2 rounded-xl overflow-hidden ${className}`}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      {(title || searchable || headerRight) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between
                        gap-3 px-5 py-4 border-b border-surface-2">
          {title && (
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              {TitleIcon && <TitleIcon size={16} className="text-brand-400" />}
              {title}
            </h2>
          )}

          <div className="flex items-center gap-3 ml-auto">
            {searchable && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2
                                             text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="bg-surface-2 border border-surface-3 rounded-lg
                             pl-8 pr-8 py-2 text-xs text-gray-300 placeholder-gray-600
                             focus:outline-none focus:border-brand-500/50 focus:ring-1
                             focus:ring-brand-500/20 transition-all duration-200 w-48"
                />
                {search && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2
                               text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
            {headerRight}
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={stickyHeader ? "sticky top-0 bg-surface-1 z-10" : ""}>
            <tr className="border-b border-surface-2">
              {columns.map((col) => (
                <th
                  key={col.key || col.label}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`
                    py-3 px-4 text-left text-xs font-mono text-gray-500
                    uppercase tracking-wider whitespace-nowrap
                    ${col.sortable ? "cursor-pointer hover:text-gray-300 select-none" : ""}
                    ${col.className || ""}
                  `}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Skeleton
              skeletonRows.map((_, i) => (
                <tr key={i} className="border-b border-surface-2/50">
                  {columns.map((col, j) => (
                    <td key={j} className="py-3 px-4">
                      <div className="h-4 bg-surface-2 rounded animate-pulse"
                           style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated_data.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={columns.length}
                    className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    {emptyIcon && (
                      <div className="w-10 h-10 bg-surface-2 rounded-xl
                                      flex items-center justify-center mb-1">
                        {emptyIcon}
                      </div>
                    )}
                    <p className="text-gray-600 text-xs font-mono">
                      {search ? `No results for "${search}"` : emptyMessage}
                    </p>
                    {search && (
                      <button onClick={() => handleSearch("")}
                        className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginated_data.map((row, i) => (
                <tr
                  key={row.id || row._id || i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`
                    border-b border-surface-2/50
                    transition-colors duration-100
                    ${onRowClick ? "cursor-pointer hover:bg-surface-2/50" : "hover:bg-surface-2/20"}
                    ${rowClassName}
                  `}
                >
                  {columns.map((col) => (
                    <td key={col.key || col.label}
                        className={`py-3 px-4 text-gray-300 ${col.cellClassName || ""}`}>
                      {col.render
                        ? col.render(row[col.key], row, i)
                        : (row[col.key] ?? "—")
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {paginated && !loading && sorted.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3
                        border-t border-surface-2">
          <p className="text-xs text-gray-500 font-mono">
            Showing{" "}
            <span className="text-gray-300">
              {Math.min((currentPage - 1) * pageSize + 1, sorted.length)}–
              {Math.min(currentPage * pageSize, sorted.length)}
            </span>
            {" "}of{" "}
            <span className="text-gray-300">{sorted.length}</span>
            {search && <span className="text-brand-400"> (filtered)</span>}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         text-gray-400 hover:text-white hover:bg-surface-2
                         disabled:opacity-30 disabled:cursor-not-allowed
                         transition-colors"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages ||
                           Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) {
                  acc.push("...");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`dots-${idx}`}
                    className="w-7 h-7 flex items-center justify-center
                               text-xs text-gray-600 font-mono">
                    ···
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center
                                text-xs font-mono transition-colors
                                ${currentPage === p
                                  ? "bg-brand-500 text-white"
                                  : "text-gray-400 hover:text-white hover:bg-surface-2"
                                }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         text-gray-400 hover:text-white hover:bg-surface-2
                         disabled:opacity-30 disabled:cursor-not-allowed
                         transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}