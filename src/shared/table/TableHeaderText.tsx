/**
 * A column header. Never inline `<span className="text-base …">` in a column
 * definition — the styling must stay identical across every table.
 */
import React from "react";

const TableHeaderText: React.FC<{ text: string }> = ({ text }) => (
  <span className="text-base font-normal text-brand">{text}</span>
);

export default TableHeaderText;
