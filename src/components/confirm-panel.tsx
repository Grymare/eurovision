type ConfirmPanelProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmPanel({
  title,
  message,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmPanelProps) {
  return (
    <div className="space-y-4 rounded-lg border border-stage-border bg-stage-elevated/80 p-5" role="dialog">
      <h3 className="section-heading text-base">{title}</h3>
      <p className="text-sm leading-6 text-muted">{message}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" disabled={isBusy} onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" className="btn-secondary" disabled={isBusy} onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
