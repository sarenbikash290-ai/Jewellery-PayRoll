'use client';
import { ReactNode } from 'react';
import { useApp } from './AppContext';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose?: () => void;
}

export default function Modal({ title, subtitle, children, footer, size = 'md', onClose }: Props) {
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
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

