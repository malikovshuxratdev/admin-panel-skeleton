/**
 * A table cell. Pass `onClick` to make it the row's primary navigation target;
 * it then renders as an affordance rather than plain text.
 */
import React from "react";
import { cn } from "@/shared/lib";

interface TableTextProps {
  text?: string | number | null;
  onClick?: () => void;
  className?: string;
}

const TableText: React.FC<TableTextProps> = ({ text, onClick, className }) => (
  <span
    onClick={onClick}
    className={cn(
      "text-base text-text-primary",
      onClick && "cursor-pointer text-link hover:underline",
      className,
    )}
  >
    {text ?? "—"}
  </span>
);

export default TableText;
