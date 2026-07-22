import React, { createContext, useCallback, useContext, useState } from 'react';
import type { Feather } from '@expo/vector-icons';
import { ThemedDialog } from '@/components/ThemedDialog';

export type DialogVariant = 'info' | 'confirm' | 'destructive';

export interface ShowDialogOptions {
  /** Defaults to 'info'. */
  variant?: DialogVariant;
  title: string;
  message: string;
  /** Defaults per variant: info->'info', confirm->'lock', destructive->'alert-triangle'. */
  icon?: keyof typeof Feather.glyphMap;
  /** Defaults per variant: info->'Tamam', confirm->'Devam', destructive->'Sil'. */
  confirmText?: string;
  /** Defaults to 'Vazgeç'. Never shown for the 'info' variant (single button). */
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
}

/** Same shape as ShowDialogOptions but with every default already resolved,
 * so ThemedDialog never has to know about defaulting rules. */
export interface ResolvedDialog {
  variant: DialogVariant;
  title: string;
  message: string;
  icon?: keyof typeof Feather.glyphMap;
  confirmText: string;
  cancelText: string;
  onConfirm?: () => void | Promise<void>;
}

interface DialogContextValue {
  showDialog: (options: ShowDialogOptions) => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

const DEFAULT_CONFIRM_TEXT: Record<DialogVariant, string> = {
  info: 'Tamam',
  confirm: 'Devam',
  destructive: 'Sil',
};

function resolveDialog(options: ShowDialogOptions): ResolvedDialog {
  const variant = options.variant ?? 'info';
  return {
    variant,
    title: options.title,
    message: options.message,
    icon: options.icon,
    confirmText: options.confirmText ?? DEFAULT_CONFIRM_TEXT[variant],
    cancelText: options.cancelText ?? 'Vazgeç',
    onConfirm: options.onConfirm,
  };
}

/** Themed replacement for `Alert.alert` — imperative call, React-driven modal.
 * Mounted once at the app root (app/_layout.tsx) so any screen can call
 * useDialog() without its own local state. */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<ResolvedDialog | null>(null);
  const [visible, setVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  const showDialog = useCallback((options: ShowDialogOptions) => {
    setDialog(resolveDialog(options));
    setProcessing(false);
    setVisible(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (processing) return;
    setVisible(false);
  }, [processing]);

  const handleConfirm = useCallback(() => {
    if (processing || !dialog) return;
    if (!dialog.onConfirm) {
      setVisible(false);
      return;
    }
    setProcessing(true);
    void (async () => {
      try {
        await dialog.onConfirm?.();
      } finally {
        setProcessing(false);
        setVisible(false);
      }
    })();
  }, [processing, dialog]);

  return (
    <DialogContext.Provider value={{ showDialog }}>
      {children}
      <ThemedDialog
        visible={visible}
        dialog={dialog}
        processing={processing}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within a DialogProvider');
  return ctx;
}
