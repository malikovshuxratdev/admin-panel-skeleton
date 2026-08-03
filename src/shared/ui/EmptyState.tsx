/** Empty and error placeholder. One look for "nothing here" across the app. */
import React from "react";
import { Empty } from "antd";

interface EmptyStateProps {
  title?: string;
  description?: string;
  isError?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, isError }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-10">
    <Empty description={title} />
    {description && <p className="text-sm text-text-secondary">{description}</p>}
    {isError && <p className="text-sm text-red">{description}</p>}
  </div>
);

export default EmptyState;
