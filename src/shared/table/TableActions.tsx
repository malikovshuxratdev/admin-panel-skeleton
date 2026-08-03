/**
 * The view/edit/delete row-actions control. Never rebuild this dropdown at a
 * call site — omitted handlers simply hide their entry.
 */
import React from "react";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TableActions: React.FC<TableActionsProps> = ({ onView, onEdit, onDelete }) => {
  const { t } = useTranslation();

  const items: MenuProps["items"] = [
    onView && { key: "view", label: t("common.buttons.view"), onClick: onView },
    onEdit && { key: "edit", label: t("common.buttons.edit"), onClick: onEdit },
    onDelete && { key: "delete", label: t("common.buttons.delete"), danger: true, onClick: onDelete },
  ].filter(Boolean) as MenuProps["items"];

  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <button type="button" className="px-2 py-1" aria-label={t("common.labels.actions")}>
        <MoreOutlined />
      </button>
    </Dropdown>
  );
};

export default TableActions;
