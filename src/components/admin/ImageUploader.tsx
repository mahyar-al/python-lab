import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../../lib/adminApi';

export interface ImageUploaderProps {
  label?: string;
  value?: string;
  currentImage?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  maxSizeMB?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  currentImage,
  onChange,
  onRemove,
  maxSizeMB = 8
}) => {
  const displayImage = value || currentImage || '';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setUploadSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`حجم تصویر نباید بیشتر از ${maxSizeMB} مگابایت باشد.`);
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          const res = await adminApi.uploadImage(reader.result);
          if (res?.url) {
            onChange(res.url);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 2500);
          } else {
            setError('خطا در ذخیره تصویر روی سرور.');
          }
        } catch (err: any) {
          setError(err?.message || 'خطا در آپلود تصویر در سرور.');
        } finally {
          setIsUploading(false);
        }
      }
    };

    reader.onerror = () => {
      setError('خطا در خواندن فایل تصویر.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
    // Reset file input so same file can be re-selected if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (urlInputValue.trim()) {
      onChange(urlInputValue.trim());
      setUrlInputValue('');
      setShowUrlInput(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-1.5 text-right w-full">
      {label && <label className="block text-xs font-medium text-[#111110]">{label}</label>}

      {displayImage ? (
        <div className="relative rounded-xl border border-[#BFDDF0] overflow-hidden bg-gray-50 aspect-video max-h-48 flex items-center justify-center group">
          <img
            src={displayImage}
            alt="Uploaded"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/brand/morico-logo.jpg';
            }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 bg-white text-black rounded-lg hover:bg-gray-100 text-xs font-medium flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'در حال آپلود...' : 'تغییر تصویر'}</span>
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 bg-[#A33A3A] text-white rounded-lg hover:bg-red-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                <span>حذف</span>
              </button>
            )}
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-white">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
              <span className="text-xs">در حال آپلود پایدار در سرور...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-[#BFDDF0] rounded-xl p-4 bg-white/60 hover:bg-[#D3ECFA]/20 transition-colors flex flex-col items-center justify-center text-center gap-2">
          {isUploading ? (
            <div className="py-4 flex flex-col items-center justify-center gap-2 text-[#111110]">
              <Loader2 className="w-6 h-6 animate-spin text-[#111110]" />
              <span className="text-xs font-medium">در حال آپلود فایل در فضای ابری سرور...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111110] text-white text-xs font-medium hover:bg-black transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>انتخاب فایل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#BFDDF0] text-[#111110] text-xs font-medium hover:bg-white transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>آدرس اینترنتی (URL)</span>
                </button>
              </div>
              <span className="text-[11px] text-[#4A5560]">فرمت‌های JPG، PNG، WebP تا سقف {maxSizeMB}MB</span>

              {showUrlInput && (
                <form onSubmit={handleUrlSubmit} className="flex gap-2 w-full max-w-sm mt-2">
                  <input
                    type="url"
                    value={urlInputValue}
                    onChange={(e) => setUrlInputValue(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-2.5 py-1 text-xs border border-[#BFDDF0] rounded-lg dir-ltr font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#111110] text-white rounded-lg text-xs font-medium cursor-pointer"
                  >
                    ثبت
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {uploadSuccess && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#2F6B4F]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>تصویر با موفقیت در سرور ذخیره شد.</span>
        </div>
      )}

      {error && <p className="text-[11px] text-[#A33A3A] mt-1">{error}</p>}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
