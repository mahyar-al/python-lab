import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface StoreToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const StoreToast: React.FC<StoreToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 left-5 right-5 sm:right-auto sm:left-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      dir="rtl"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 sm:p-4 rounded-2xl bg-white border shadow-[0_10px_35px_rgba(17,17,16,0.12)] flex items-center justify-between gap-3 text-xs transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
              isError
                ? 'border-[#A33A3A]/40'
                : isWarning
                ? 'border-[#9A6B1F]/40'
                : isSuccess
                ? 'border-[#2F6B4F]/40'
                : 'border-[#BFDDF0]'
            }`}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="shrink-0">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#2F6B4F]" />}
                {isError && <AlertCircle className="w-4 h-4 text-[#A33A3A]" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-[#9A6B1F]" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-[#111110]" />}
              </div>
              <p className="text-[#111110] font-medium leading-relaxed truncate-2-lines">
                {toast.message}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    onDismiss(toast.id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#111110] text-white hover:bg-[#2A2A28] text-[11px] font-bold transition-colors cursor-pointer"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-lg text-gray-400 hover:text-[#111110] hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="بستن اعلان"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
