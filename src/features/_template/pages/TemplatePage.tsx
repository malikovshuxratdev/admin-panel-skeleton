/**
 * TEMPLATE — a routed list page.
 *
 * Rules for this layer:
 *   - If `Routes.tsx` renders it, it lives here and is named
 *     `<Domain><Role?>Page.tsx`. Nothing else belongs in `pages/`.
 *   - A page wires things together: it reads params, calls hooks, and lays
 *     out sections. Table columns, filters and forms move into `sections/`
 *     or `components/` once the page passes ~200 lines.
 *   - Never hand-roll a list table. `DataTable` owns loading, error and
 *     empty states plus the pagination footer.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { paths } from "@/routes";
import { DataTable, TableHeaderText, TableText, TableActions } from "@/shared/table";
import { confirmDelete, getNameByLanguage } from "@/shared/helpers";
import { usePaginatedParams } from "@/shared/hooks";
import { useCurrentLanguage } from "@/shared/constants";
import { useTemplateListQuery, useTemplateDeleteMutation } from "@/features/_template/hooks";
import type { TemplateItem } from "@/features/_template/types";

const TemplatePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lang = useCurrentLanguage();

  const { params, setPage, setPageSize } = usePaginatedParams("templateList", {
    page: 1,
    page_size: 20,
  });

  const { data, isLoading, isError } = useTemplateListQuery(params);
  const { mutate: remove } = useTemplateDeleteMutation();

  const view = (row: TemplateItem) =>
    navigate(paths.TEMPLATE_DETAIL.replace(":id", String(row.id)));

  const handleDelete = (row: TemplateItem) =>
    confirmDelete({
      title: t("common.messages.confirm-delete"),
      content: t("common.messages.delete-warning"),
      okText: t("common.buttons.delete"),
      cancelText: t("common.buttons.cancel"),
      onOk: () => remove(row.id),
    });

  const columns = [
    {
      title: <TableHeaderText text={t("common.labels.name")} />,
      key: "name",
      render: (_: unknown, r: TemplateItem) => (
        <TableText text={getNameByLanguage(r.name, lang)} onClick={() => view(r)} />
      ),
    },
    {
      title: <TableHeaderText text={t("common.labels.actions")} />,
      key: "actions",
      render: (_: unknown, r: TemplateItem) => (
        <TableActions
          onView={() => view(r)}
          onEdit={() => navigate(paths.TEMPLATE_UPDATE.replace(":id", String(r.id)))}
          onDelete={() => handleDelete(r)}
        />
      ),
    },
  ];

  return (
    <DataTable
      data={data?.items ?? []}
      columns={columns}
      isLoading={isLoading}
      isError={isError}
      pagination={{ page: params.page, pageSize: params.page_size, total: data?.total ?? 0 }}
      setPage={setPage}
      setPageSize={setPageSize}
      emptyTitle={t("pages.template.no-data")}
      emptyDescription={t("pages.template.no-data-description")}
    />
  );
};

export default TemplatePage;
