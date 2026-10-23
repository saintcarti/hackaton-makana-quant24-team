import { KeyboardEvent, ReactNode, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  title: string;
  confirmLabel: string;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children: ReactNode;
}

/** Igual que la salida en CSS (.sheet-root): se desmonta recién cuando terminó de irse por el mismo camino. */
const EXIT_MS = 340;
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select, textarea, [href], [tabindex]:not([tabindex="-1"])';

/**
 * Hoja modal estilo iOS: Cancelar a la izquierda, título al centro, acción a la derecha, fondo atenuado.
 * Escape o un clic afuera cancelan; el foco queda adentro y vuelve a quien la abrió al cerrar.
 */
export default function Sheet({ open, title, confirmLabel, confirmDisabled, onCancel, onConfirm, children }: Props) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      opener.current = document.activeElement as HTMLElement | null;
      setMounted(true);
      // setTimeout y no requestAnimationFrame: rAF se congela con la ventana tapada y la hoja no aparecería.
      const t = window.setTimeout(() => setShown(true), 20);
      return () => window.clearTimeout(t);
    }
    setShown(false);
    const t = window.setTimeout(() => {
      setMounted(false);
      opener.current?.focus?.();
    }, EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  useEffect(() => {
    if (!shown) return;
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>('input, select, textarea') ?? panel)?.focus();
  }, [shown]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCancel();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className={`sheet-root${shown && open ? ' is-open' : ''}`} onKeyDown={onKeyDown}>
      <div className="sheet-scrim" onClick={onCancel} aria-hidden="true" />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef} tabIndex={-1}>
        <div className="sheet-grabber" aria-hidden="true" />
        <header className="sheet-head">
          <button type="button" className="sheet-action" onClick={onCancel}>
            Cancelar
          </button>
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          <button type="button" className="sheet-action strong" onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
