import React from 'react';
import { PrintableArea } from '../../lib/types';
import { toPersianDigits } from '../../lib/currency';
import { Sparkles, Move } from 'lucide-react';

export interface PrintableAreaEditorProps {
  imageUrl?: string;
  viewTitle?: string;
  printableArea?: PrintableArea;
  area?: PrintableArea;
  onChange: (newArea: PrintableArea) => void;
}

export const PrintableAreaEditor: React.FC<PrintableAreaEditorProps> = ({
  imageUrl,
  viewTitle = 'نمای محصول',
  printableArea,
  area,
  onChange
}) => {
  const currentArea = printableArea || area || { x: 30, y: 25, width: 40, height: 45 };

  const updateField = (field: keyof PrintableArea, value: number) => {
    const val = Math.max(5, Math.min(95, value));
    onChange({
      ...currentArea,
      [field]: val
    });
  };

  return (
    <div className="space-y-4 p-4 rounded-xl border border-[#BFDDF0] bg-white text-right">
      <div className="flex items-center justify-between border-b border-[#BFDDF0]/60 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#111110]">
          <Sparkles className="w-4 h-4 text-[#2B5876]" />
          <span>محدوده مجاز چاپ اختصاصی ({viewTitle})</span>
        </div>
        <span className="text-[11px] text-[#4A5560]">کادر خط‌چین محدوده چاپ روی لباس است</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Visual Preview */}
        <div dir="ltr" className="md:col-span-6 relative aspect-[4/5] max-h-[320px] mx-auto w-full rounded-xl overflow-hidden border border-[#BFDDF0] bg-gray-50 flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt={viewTitle} className="w-full h-full object-contain pointer-events-none" />
          ) : (
            <div className="text-gray-400 text-xs">تصویر موکاپ بارگذاری نشده است</div>
          )}

          {/* Printable Area Box */}
          <div
            style={{
              position: 'absolute',
              left: `${currentArea.x}%`,
              top: `${currentArea.y}%`,
              width: `${currentArea.width}%`,
              height: `${currentArea.height}%`
            }}
            className="border-2 border-dashed border-[#111110] bg-white/40 flex items-center justify-center pointer-events-none transition-all shadow-sm"
          >
            <div className="text-center p-1 bg-black/70 text-white rounded text-[10px] font-mono">
              محدوده چاپ
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="md:col-span-6 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#4A5560] mb-1">
                موقعیت افقی X ({toPersianDigits(currentArea.x)}%):
              </label>
              <input
                type="range"
                min="0"
                max="80"
                value={currentArea.x}
                onChange={(e) => updateField('x', Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#4A5560] mb-1">
                موقعیت عمودی Y ({toPersianDigits(currentArea.y)}%):
              </label>
              <input
                type="range"
                min="0"
                max="80"
                value={currentArea.y}
                onChange={(e) => updateField('y', Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#4A5560] mb-1">
                عرض کادر چاپ ({toPersianDigits(currentArea.width)}%):
              </label>
              <input
                type="range"
                min="10"
                max="90"
                value={currentArea.width}
                onChange={(e) => updateField('width', Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#4A5560] mb-1">
                ارتفاع کادر چاپ ({toPersianDigits(currentArea.height)}%):
              </label>
              <input
                type="range"
                min="10"
                max="90"
                value={currentArea.height}
                onChange={(e) => updateField('height', Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="p-3 bg-[#E4F5FF]/40 rounded-lg text-[11px] text-[#4A5560] leading-relaxed">
            این مختصات دقیقاً تعیین می‌کند که در استودیو آنلاین مشتری، تایپوگرافی یا مونوگرام درون چه محدوده‌ای از لباس مجاز به جای‌گذاری باشد.
          </div>
        </div>
      </div>
    </div>
  );
};
