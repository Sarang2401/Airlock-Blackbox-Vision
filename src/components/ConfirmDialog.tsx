import { ReactNode, useEffect, useId, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  children?: ReactNode;
  disabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ title, description, confirmLabel, children, disabled, onCancel, onConfirm }: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    cancel.current?.focus();
    return () => {
      element?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog ref={dialog} className="confirm-dialog surface" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={(event) => {
      event.preventDefault();
      onCancel();
    }}>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) onConfirm();
      }}>
        <div className="confirm-heading">
          <span className="feature-icon"><ShieldCheck size={21} aria-hidden="true" /></span>
          <h2 id={titleId}>{title}</h2>
        </div>
        <p id={descriptionId} className="muted">{description}</p>
        {children}
        <div className="confirm-actions">
          <button ref={cancel} type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="button button-primary" disabled={disabled}>{confirmLabel}</button>
        </div>
      </form>
    </dialog>
  );
}
