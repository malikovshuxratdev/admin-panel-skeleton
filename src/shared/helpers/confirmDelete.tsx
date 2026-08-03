/**
 * The one delete-confirmation dialog.
 *
 * Rules:
 *   - Never repeat `Modal.confirm({ icon: <ExclamationCircleOutlined/>, … })`
 *     at a call site. Every destructive confirm goes through here, so the
 *     wording, icon and danger styling stay identical everywhere.
 *   - Pass translated strings; this helper does not call `t()` itself.
 */
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

interface ConfirmDeleteOptions {
  title: string;
  content?: string;
  okText: string;
  cancelText: string;
  onOk: () => void;
}

export const confirmDelete = ({
  title,
  content,
  okText,
  cancelText,
  onOk,
}: ConfirmDeleteOptions): void => {
  Modal.confirm({
    title,
    icon: <ExclamationCircleOutlined />,
    content,
    okText,
    okType: "danger",
    cancelText,
    onOk,
  });
};
