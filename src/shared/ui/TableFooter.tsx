/**
 * The pagination footer. Never hardcode this JSX at a call site.
 *
 * Accepts either separate setters or one combined handler — pages differ, and
 * the type below makes it impossible to pass neither.
 */
import React, { useCallback } from "react";
import { Pagination } from "antd";

interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
}

interface Base {
  pagination: TablePagination;
  showSizeChanger?: boolean;
  /** Override when the footer sits somewhere other than under a table. */
  className?: string;
}

type TableFooterProps = Base &
  (
    | { setPage: (page: number) => void; setPageSize: (size: number) => void; onChange?: never }
    | { onChange: (page: number, pageSize: number) => void; setPage?: never; setPageSize?: never }
  );

const TableFooter: React.FC<TableFooterProps> = ({
  pagination,
  setPage,
  setPageSize,
  onChange,
  showSizeChanger = false,
  className = "flex justify-start",
}) => {
  const handleChange = useCallback(
    (page: number, pageSize: number) => {
      if (onChange) return onChange(page, pageSize);
      setPage?.(page);
      if (pageSize !== pagination.pageSize) setPageSize?.(pageSize);
    },
    [onChange, setPage, setPageSize, pagination.pageSize],
  );

  if (!pagination.total) return null;

  return (
    <div className={className}>
      <Pagination
        current={pagination.page}
        total={pagination.total}
        pageSize={pagination.pageSize}
        onChange={handleChange}
        showSizeChanger={showSizeChanger}
      />
    </div>
  );
};

export default TableFooter;
