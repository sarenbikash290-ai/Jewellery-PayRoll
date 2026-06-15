'use client';
import { ReactNode } from 'react';
import { useApp } from './AppContext';
import { X } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose?: () => void;
  hideClose?: boolean;
}

export default function Modal({ title, subtitle, children, footer, size = 'md', onClose, hideClose = false }: Props) {
  const { closeModal } = useApp();
  const handleClose = onClose ?? closeModal;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className={`modal modal-${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle && <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '3px' }}>{subtitle}</div>}
          </div>
          {!hideClose && <button
            onClick={handleClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'var(--bg-hover)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-2)', cursor: 'pointer', transition: 'var(--transition)',
              flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--danger-border)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
          >
            <X size={16} />
          </button>}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

