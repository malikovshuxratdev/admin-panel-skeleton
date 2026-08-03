/**
 * The list table. EVERY list screen uses this — never a bare antd <Table>.
 *
 * It owns four things so no page has to repeat them:
 *   loading state · error state · empty state · the pagination footer.
 *
 * Rules:
 *   - Build columns with TableHeaderText / TableText / TableActions.
 *   - Pass `setPage` / `setPageSize` directly from usePaginatedParams.
 *   - A table exposing one combined handler uses `onPaginationChange` instead.
 */
import React from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { TableFooter, EmptyState } from "@/shared/ui";

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnsType<T>;
  isLoading?: boolean;
  isError?: boolean;
  pagination: Pagination;
  setPage?: (page: number) => void;
  setPageSize?: (size: number) => void;
  onPaginationChange?: (page: number, pageSize: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey?: keyof T | ((row: T) => React.Key);
}

function DataTable<T extends object>({
  data,
  columns,
  isLoading,
  isError,
  pagination,
  setPage,
  setPageSize,
  onPaginationChange,
  emptyTitle,
  emptyDescription,
  rowKey = "id" as keyof T,
}: DataTableProps<T>) {
  if (isError) {
    return <EmptyState title={emptyTitle} description={emptyDescription} isError />;
  }

  return (
    <div className="space-y-4">
      <Table<T>
        dataSource={data}
        columns={columns}
        loading={isLoading}
        pagination={false}
        rowKey={rowKey as never}
        locale={{ emptyText: <EmptyState title={emptyTitle} description={emptyDescription} /> }}
      />
      {onPaginationChange ? (
        <TableFooter pagination={pagination} onChange={onPaginationChange} />
      ) : (
        <TableFooter pagination={pagination} setPage={setPage!} setPageSize={setPageSize!} />
      )}
    </div>
  );
}

export default DataTable;
