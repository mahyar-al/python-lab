import React, { useState, useRef } from 'react';
import {
  Product,
  CustomLayer,
  CartItem,
  GarmentViewId,
  ViewCustomization,
  CustomizationData
} from '../lib/types';
import { formatPrice, formatPersianNumber, toPersianDigits } from '../lib/currency';
import { BackgroundRemovalModal } from './BackgroundRemovalModal';
import { removeBackgroundAuto } from '../lib/bgRemoval';
import { renderPrintDesign, renderMockupComposite } from '../lib/designExport';
import {
  Type,
  RotateCw,
  Trash2,
  AlignCenter,
  ShoppingBag,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Eraser,
  RotateCcw,
  FlipHorizontal,
  Loader2,
  Check,
  Eye,
  Sliders,
  Layers
} from 'lucide-react';

interface CustomizerStudioProps {
  products: Product[];
  initialProduct?: Product | null;
  onAddToCart: (item: CartItem) => void;
  onBackToShop: () => void;
}

const VIEW_TITLES: Record<GarmentViewId, string> = {
  front: 'نمای روبرو (جلو)',
  back: 'نمای پشت',
  left: 'نمای بغل چپ',
  right: 'نمای بغل راست'
};

const VIEW_SHORT_LABELS: Record<GarmentViewId, string> = {
  front: 'جلو',
  back: 'پشت',
  left: 'بغل چپ',
  right: 'بغل راست'
};

export const CustomizerStudio: React.FC<CustomizerStudioProps> = ({
  products,
  initialProduct,
  onAddToCart,
  onBackToShop
}) => {
  const customizableProducts = products.filter((p) => p.customizable);
  const activeProduct =
    initialProduct && initialProduct.customizable
      ? initialProduct
      : customizableProducts[0] || products[0];

  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(activeProduct);

  const [selectedColor, setSelectedColor] = useState(
    activeProduct?.colors?.[0]?.name || 'مشکی زغالی'
  );
  const [selectedColorHex, setSelectedColorHex] = useState(
    activeProduct?.colors?.[0]?.hex || '#1A1A1A'
  );
  const [selectedSize, setSelectedSize] = useState(
    activeProduct?.sizes?.[1] || activeProduct?.sizes?.[0] || 'L'
  );

  // Active view: front, back, left, or right
  const [activeSide, setActiveSide] = useState<GarmentViewId>('front');

  // Independent layers per view
  const [viewsLayers, setViewsLayers] = useState<Record<GarmentViewId, CustomLayer[]>>({
    front: [
      {
        id: 'default-monogram',
        type: 'monogram',
        content: 'MC_MONOGRAM',
        x: 50,
        y: 35,
        scale: 1,
        rotation: 0
      }
    ],
    back: [],
    left: [],
    right: []
  });

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    viewsLayers.front[0]?.id || null
  );

  // Active tool tab: 'text' | 'image' | 'monogram' | 'adjust'
  const [activeToolTab, setActiveToolTab] = useState<'text' | 'image' | 'monogram' | 'adjust'>('text');

  // Text tool controls
  const [textInput, setTextInput] = useState('موریکو استایل');
  const [textFont, setTextFont] = useState<'vazirmatn' | 'serif'>('vazirmatn');
  const [textColor, setTextColor] = useState('#111110');

  // Background removal modal & loader
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [bgModalImage, setBgModalImage] = useState<string>('');
  const [isAutoRemovingBg, setIsAutoRemovingBg] = useState(false);
  const [bgRemovalFeedback, setBgRemovalFeedback] = useState<string | null>(null);

  // Guide lines toggle
  const [showPrintGuide, setShowPrintGuide] = useState(true);

  // Submitting state
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Find active view definition in product
  const currentViewDef = selectedProduct?.views?.find((v) => v.name === activeSide) || {
    id: `view-${activeSide}`,
    name: activeSide,
    title: VIEW_TITLES[activeSide],
    image:
      activeSide === 'front'
        ? selectedProduct?.image || '/mockups/tee-front.svg'
        : activeSide === 'back'
        ? '/mockups/tee-back.svg'
        : activeSide === 'left'
        ? '/mockups/tee-left.svg'
        : '/mockups/tee-right.svg',
    printableArea:
      activeSide === 'front'
        ? { x: 28, y: 22, width: 44, height: 48 }
        : activeSide === 'back'
        ? { x: 26, y: 20, width: 48, height: 50 }
        : { x: 38, y: 25, width: 24, height: 35 }
  };

  const currentLayers = viewsLayers[activeSide] || [];
  const activeLayer = currentLayers.find((l) => l.id === selectedLayerId);

  const setLayersForActiveSide = (updater: (prev: CustomLayer[]) => CustomLayer[]) => {
    setViewsLayers((prev) => {
      const next = updater(prev[activeSide] || []);
      return {
        ...prev,
        [activeSide]: next
      };
    });
  };

  const updateActiveLayer = (updater: (layer: CustomLayer) => CustomLayer) => {
    if (!selectedLayerId) return;
    setLayersForActiveSide((prev) =>
      prev.map((l) => (l.id === selectedLayerId ? updater(l) : l))
    );
  };

  const customFee = 150000;
  const effectiveProductPrice = (selectedProduct?.discountPrice || selectedProduct?.price) || 0;
  const totalPrice = effectiveProductPrice + customFee;

  // Total layers across all views
  const totalLayersCount = Object.values(viewsLayers).reduce((acc, curr) => acc + curr.length, 0);

  // Handle switching view
  const handleSwitchSide = (side: GarmentViewId) => {
    setActiveSide(side);
    const layersInSide = viewsLayers[side] || [];
    setSelectedLayerId(layersInSide[0]?.id || null);
  };

  // Add text layer
  const handleAddText = () => {
    if (!textInput.trim()) return;
    const isVazir = textFont === 'vazirmatn';
    const newLayer: CustomLayer = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: textInput.trim(),
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: isVazir ? 'var(--font-fa)' : 'var(--font-serif)',
      color: textColor,
      scale: 1,
      rotation: 0,
      letterSpacing: isVazir ? 0 : 0.15
    };
    setLayersForActiveSide((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setActiveToolTab('adjust');
  };

  // Add Monogram
  const handleAddMonogram = () => {
    const newLayer: CustomLayer = {
      id: `monogram-${Date.now()}`,
      type: 'monogram',
      content: 'MC_MONOGRAM',
      x: 50,
      y: 40,
      scale: 1,
      rotation: 0,
      color: textColor
    };
    setLayersForActiveSide((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setActiveToolTab('adjust');
  };

  // Preset text
  const handleAddPreset = (phrase: string, fontType: 'vazirmatn' | 'serif') => {
    const isVazir = fontType === 'vazirmatn';
    const newLayer: CustomLayer = {
      id: `preset-${Date.now()}`,
      type: 'text',
      content: phrase,
      x: 50,
      y: 50,
      fontSize: 20,
      fontFamily: isVazir ? 'var(--font-fa)' : 'var(--font-serif)',
      color: textColor,
      scale: 1,
      rotation: 0,
      letterSpacing: isVazir ? 0 : 0.2
    };
    setLayersForActiveSide((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setActiveToolTab('adjust');
  };

  // Handle Image Upload from device
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result as string;
      if (!dataUrl) return;

      const newLayer: CustomLayer = {
        id: `img-${Date.now()}`,
        type: 'image',
        content: dataUrl,
        originalImage: dataUrl,
        hasBgRemoved: false,
        x: 50,
        y: 45,
        scale: 1,
        rotation: 0,
        width: 130,
        height: 130
      };

      setLayersForActiveSide((prev) => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
      setActiveToolTab('adjust');
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  // Smart Auto Background Removal
  const handleAutoRemoveBg = async (layer: CustomLayer) => {
    if (layer.type !== 'image') return;
    setIsAutoRemovingBg(true);
    setBgRemovalFeedback(null);

    try {
      const srcToProcess = layer.originalImage || layer.content;
      const res = await removeBackgroundAuto(srcToProcess, { tolerance: 28, feather: 1.5 });

      updateActiveLayer((l) => ({
        ...l,
        content: res.dataUrl,
        originalImage: l.originalImage || l.content,
        hasBgRemoved: true
      }));

      setBgRemovalFeedback('پس‌زمینه با موفقیت و ظرافت بالا حذف شد.');
      setTimeout(() => setBgRemovalFeedback(null), 3500);
    } catch (err: any) {
      alert('خطا در حذف خودکار پس‌زمینه: ' + (err.message || 'مشکل در پردازش تصویر'));
    } finally {
      setIsAutoRemovingBg(false);
    }
  };

  // Open manual background removal modal
  const handleOpenManualBgModal = (layer: CustomLayer) => {
    if (layer.type !== 'image') return;
    setBgModalImage(layer.originalImage || layer.content);
    setBgModalOpen(true);
  };

  // Apply from manual background modal
  const handleApplyManualBg = (transparentPngUrl: string) => {
    updateActiveLayer((l) => ({
      ...l,
      content: transparentPngUrl,
      originalImage: l.originalImage || l.content,
      hasBgRemoved: true
    }));
    setBgModalOpen(false);
    setBgRemovalFeedback('ویرایش دستی پس‌زمینه با موفقیت بر روی لایه اعمال شد.');
    setTimeout(() => setBgRemovalFeedback(null), 3500);
  };

  // Restore original image
  const handleRestoreOriginalImage = (layer: CustomLayer) => {
    if (!layer.originalImage) return;
    updateActiveLayer((l) => ({
      ...l,
      content: l.originalImage!,
      hasBgRemoved: false
    }));
    setBgRemovalFeedback('تصویر اصلی بدون شفافیت بازگردانده شد.');
    setTimeout(() => setBgRemovalFeedback(null), 3500);
  };

  // Delete layer
  const handleDeleteLayer = (id: string) => {
    setLayersForActiveSide((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) {
      const remaining = currentLayers.filter((l) => l.id !== id);
      setSelectedLayerId(remaining[0]?.id || null);
    }
  };

  // Center layer horizontally
  const handleCenterLayer = (id: string) => {
    setLayersForActiveSide((prev) =>
      prev.map((l) => (l.id === id ? { ...l, x: 50 } : l))
    );
  };

  // Scale layer
  const handleScaleLayer = (id: string, delta: number) => {
    setLayersForActiveSide((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, scale: Math.max(0.3, Math.min(2.5, Number(((l.scale || 1) + delta).toFixed(2)))) } : l
      )
    );
  };

  // Rotate layer
  const handleRotateLayer = (id: string, step = 15) => {
    setLayersForActiveSide((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, rotation: ((l.rotation || 0) + step) % 360 } : l
      )
    );
  };

  // Flip horizontal
  const handleFlipLayer = (id: string) => {
    setLayersForActiveSide((prev) =>
      prev.map((l) => (l.id === id ? { ...l, flipped: !l.flipped } : l))
    );
  };

  // Add customized item to cart
  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    setIsExporting(true);

    try {
      // 1. Build composite and print outputs for each view that has layers
      const customizedViews: Record<string, ViewCustomization> = {};
      const viewKeys: GarmentViewId[] = ['front', 'back', 'left', 'right'];

      let primaryDesignUrl = '';
      let primaryMockupUrl = '';

      for (const vKey of viewKeys) {
        const layers = viewsLayers[vKey] || [];
        if (layers.length === 0) continue;

        const vDef = selectedProduct.views?.find((v) => v.name === vKey) || {
          id: `view-${vKey}`,
          name: vKey,
          title: VIEW_TITLES[vKey],
          image: selectedProduct.image,
          printableArea: { x: 28, y: 22, width: 44, height: 48 }
        };

        const printPng = await renderPrintDesign(layers, vDef.printableArea, 1200, 1500);
        const mockupPng = await renderMockupComposite(
          vDef.image,
          selectedColorHex,
          layers,
          600,
          750
        );

        if (!primaryDesignUrl) {
          primaryDesignUrl = printPng;
          primaryMockupUrl = mockupPng;
        }

        customizedViews[vKey] = {
          viewId: vKey,
          viewTitle: VIEW_TITLES[vKey],
          garmentImage: vDef.image,
          printableArea: vDef.printableArea,
          layers: [...layers],
          designImageUrl: printPng,
          previewMockupUrl: mockupPng
        };
      }

      // If no layers were added on any view, add the default monogram
      if (Object.keys(customizedViews).length === 0) {
        const defMonogram: CustomLayer = {
          id: 'monogram-default',
          type: 'monogram',
          content: 'MC_MONOGRAM',
          x: 50,
          y: 35,
          scale: 1,
          rotation: 0
        };
        const printPng = await renderPrintDesign([defMonogram], undefined, 1200, 1500);
        const mockupPng = await renderMockupComposite(
          selectedProduct.image,
          selectedColorHex,
          [defMonogram],
          600,
          750
        );

        primaryDesignUrl = printPng;
        primaryMockupUrl = mockupPng;

        customizedViews.front = {
          viewId: 'front',
          viewTitle: VIEW_TITLES.front,
          garmentImage: selectedProduct.image,
          printableArea: { x: 28, y: 22, width: 44, height: 48 },
          layers: [defMonogram],
          designImageUrl: printPng,
          previewMockupUrl: mockupPng
        };
      }

      const customization: CustomizationData = {
        side: activeSide,
        views: customizedViews as any,
        layers: currentLayers,
        customFee,
        designImageUrl: primaryDesignUrl,
        previewMockupUrl: primaryMockupUrl,
        viewName: VIEW_TITLES[activeSide]
      };

      const cartItem: CartItem = {
        cartItemId: `custom-${Date.now()}`,
        product: selectedProduct,
        selectedColor,
        selectedSize,
        quantity: 1,
        customization
      };

      onAddToCart(cartItem);
    } catch (err) {
      console.error('Error generating design export', err);
      // Fallback
      const fallbackItem: CartItem = {
        cartItemId: `custom-${Date.now()}`,
        product: selectedProduct,
        selectedColor,
        selectedSize,
        quantity: 1,
        customization: {
          side: activeSide,
          layers: currentLayers,
          customFee,
          viewName: VIEW_TITLES[activeSide]
        }
      };
      onAddToCart(fallbackItem);
    } finally {
      setIsExporting(false);
    }
  };

  if (!selectedProduct) {
    return (
      <div className="w-full py-16 px-4 max-w-[1200px] mx-auto text-center" dir="rtl">
        <div className="bg-white rounded-[24px] border border-[#BFDDF0] p-10 max-w-lg mx-auto shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#E4F5FF] text-[#111110] flex items-center justify-center mx-auto border border-[#BFDDF0]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#111110]">استودیو طراحی آنلاین</h2>
          <p className="text-sm text-[#4A5560] leading-relaxed">
            در حال حاضر هیچ محصولی برای طراحی آنلاین در فروشگاه ثبت نشده است. از طریق پنل مدیریت محصول جدید با قابلیت شخصی‌سازی اضافه نمایید.
          </p>
          <div className="pt-2">
            <button
              onClick={onBackToShop}
              className="px-6 py-2.5 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] text-xs font-medium transition-colors"
            >
              بازگشت به کاتالوگ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const printableArea = currentViewDef.printableArea || { x: 28, y: 22, width: 44, height: 48 };

  return (
    <div className="w-full py-6 sm:py-10 md:py-12 bg-[#E4F5FF]" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-8 pb-4 border-b border-[#BFDDF0]">
          <div className="text-right">
            <span className="font-serif text-[10px] sm:text-xs brand-tracking text-[#4A5560] uppercase block">
              ATELIER STUDIO · 2026
            </span>
            <h1 className="text-lg sm:text-2xl md:text-3xl text-[#111110] font-medium tracking-normal mt-0.5">
              استودیو طراحی اختصاصی ۴ جهته آنلاین
            </h1>
          </div>

          <button
            onClick={onBackToShop}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#4A5560] hover:text-[#111110] px-3.5 py-2 rounded-xl border border-[#BFDDF0] bg-[#FFFFFF] transition-colors self-start sm:self-auto min-h-[40px] cursor-pointer"
          >
            <span>بازگشت به فروشگاه</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Main Canvas Column */}
          <div className="lg:col-span-7 flex flex-col items-center w-full">
            
            {/* 4-Direction View Switcher Bar */}
            <div className="w-full flex items-center justify-between gap-2 p-1.5 bg-[#FFFFFF] border border-[#BFDDF0] rounded-2xl mb-4 shadow-sm flex-wrap">
              <div className="flex items-center gap-1 flex-wrap">
                {(['front', 'back', 'left', 'right'] as GarmentViewId[]).map((vKey) => {
                  const isActive = activeSide === vKey;
                  const layerCount = (viewsLayers[vKey] || []).length;
                  return (
                    <button
                      key={vKey}
                      type="button"
                      onClick={() => handleSwitchSide(vKey)}
                      className={`relative px-3.5 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1.5 min-h-[38px] ${
                        isActive
                          ? 'bg-[#111110] text-[#FFFFFF] shadow-sm'
                          : 'text-[#4A5560] hover:text-[#111110] hover:bg-[#E4F5FF]/60'
                      }`}
                    >
                      <span>{VIEW_SHORT_LABELS[vKey]}</span>
                      {layerCount > 0 && (
                        <span
                          className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                            isActive
                              ? 'bg-white text-black font-bold'
                              : 'bg-[#111110] text-white'
                          }`}
                        >
                          {toPersianDigits(layerCount)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Guide lines toggle button */}
              <button
                type="button"
                onClick={() => setShowPrintGuide(!showPrintGuide)}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                  showPrintGuide
                    ? 'border-[#111110] text-[#111110] bg-[#E4F5FF]/50'
                    : 'border-[#BFDDF0] text-[#4A5560]'
                }`}
                title="نمایش / مخفی کردن کادر مجاز چاپ"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>کادر چاپ</span>
              </button>
            </div>

            {/* The Interactive Canvas Card */}
            <div
              id="customizer-canvas-viewport"
              className="relative w-full max-w-[380px] sm:max-w-[460px] md:max-w-[500px] aspect-[4/5] bg-[#FFFFFF] rounded-[20px] border border-[#BFDDF0] shadow-[0_8px_30px_rgba(17,17,16,0.06)] p-3 sm:p-5 flex items-center justify-center overflow-hidden select-none"
            >
              {/* Garment Base Silhouette with dynamically applied color */}
              <div
                className="relative w-full h-full rounded-[14px] flex items-center justify-center transition-colors duration-300 overflow-hidden"
                style={{
                  backgroundColor: selectedColorHex === '#111110' ? '#181816' : selectedColorHex
                }}
              >
                {/* Base Garment Mockup Image */}
                <img
                  src={currentViewDef.image}
                  alt={currentViewDef.title}
                  className="w-full h-full object-contain pointer-events-none transition-opacity duration-300"
                  style={{
                    filter: selectedColorHex === '#111110' ? 'brightness(0.95)' : 'none'
                  }}
                />

                {/* Printable Area Thin Dotted Outline */}
                {showPrintGuide && (
                  <div
                    className="absolute rounded-xl border border-dashed border-[#111110]/35 pointer-events-none transition-all"
                    style={{
                      left: `${printableArea.x}%`,
                      top: `${printableArea.y}%`,
                      width: `${printableArea.width}%`,
                      height: `${printableArea.height}%`
                    }}
                  >
                    <span className="absolute top-1.5 right-1.5 text-[9px] text-[#111110]/60 font-medium bg-white/70 px-1 py-0.5 rounded">
                      محدوده چاپ ({VIEW_SHORT_LABELS[activeSide]})
                    </span>
                  </div>
                )}

                {/* Interactive Layers */}
                <div className="absolute inset-0 pointer-events-auto">
                  {currentLayers.map((layer) => {
                    const isSelected = selectedLayerId === layer.id;
                    return (
                      <div
                        key={layer.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLayerId(layer.id);
                          setActiveToolTab('adjust');
                        }}
                        className={`absolute cursor-pointer transition-shadow ${
                          isSelected
                            ? 'ring-2 ring-[#111110] ring-offset-2 ring-offset-white rounded p-1 shadow-md'
                            : 'hover:opacity-90'
                        }`}
                        style={{
                          top: `${layer.y}%`,
                          left: `${layer.x}%`,
                          transform: `translate(-50%, -50%) scale(${layer.scale || 1}) rotate(${
                            layer.rotation || 0
                          }deg) ${layer.flipped ? 'scaleX(-1)' : ''}`
                        }}
                      >
                        {layer.type === 'monogram' ? (
                          <div className="flex flex-col items-center justify-center text-center select-none">
                            <span
                              className="font-serif text-3xl font-bold tracking-tight"
                              style={{
                                color:
                                  selectedColorHex === '#111110'
                                    ? '#FFFFFF'
                                    : layer.color || '#111110'
                              }}
                            >
                              MC
                            </span>
                            <span
                              className="font-serif text-[9px] tracking-[0.25em] uppercase font-medium mt-0.5"
                              style={{
                                color:
                                  selectedColorHex === '#111110'
                                    ? '#D3ECFA'
                                    : layer.color || '#111110'
                              }}
                            >
                              MORICO STYLE
                            </span>
                            <span
                              className="text-[7px] tracking-[0.3em] uppercase opacity-75 font-serif"
                              style={{
                                color:
                                  selectedColorHex === '#111110' ? '#D3ECFA' : '#4A5560'
                              }}
                            >
                              ATELIER 2026
                            </span>
                          </div>
                        ) : layer.type === 'image' ? (
                          <div className="relative group">
                            <img
                              src={layer.content}
                              alt="Custom print layer"
                              className="w-24 h-24 sm:w-28 sm:h-28 object-contain pointer-events-none drop-shadow-sm"
                            />
                            {layer.hasBgRemoved && (
                              <span className="absolute -top-2 -left-2 bg-[#2B5876] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow">
                                بدون پس‌زمینه
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontFamily: layer.fontFamily || 'var(--font-fa)',
                              fontSize: `${layer.fontSize || 22}px`,
                              color:
                                selectedColorHex === '#111110' &&
                                (!layer.color || layer.color === '#111110')
                                  ? '#FFFFFF'
                                  : layer.color || '#111110',
                              letterSpacing: layer.letterSpacing
                                ? `${layer.letterSpacing}em`
                                : 0
                            }}
                            className="text-center font-normal whitespace-pre select-none tracking-normal drop-shadow-sm"
                          >
                            {layer.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Quick Action Toolbar for Selected Layer */}
            {activeLayer && (
              <div className="mt-4 p-2 bg-[#FFFFFF] border border-[#BFDDF0] rounded-2xl shadow-[0_8px_30px_rgba(17,17,16,0.06)] flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap max-w-full">
                <button
                  type="button"
                  onClick={() => handleCenterLayer(activeLayer.id)}
                  className="p-2 sm:p-2.5 rounded-xl text-[#111110] hover:bg-[#E4F5FF] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                  title="تراز در مرکز افقی"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScaleLayer(activeLayer.id, 0.1)}
                  className="p-2 sm:p-2.5 rounded-xl text-[#111110] hover:bg-[#E4F5FF] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                  title="بزرگ‌نمایی (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScaleLayer(activeLayer.id, -0.1)}
                  className="p-2 sm:p-2.5 rounded-xl text-[#111110] hover:bg-[#E4F5FF] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                  title="کوچک‌نمایی (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRotateLayer(activeLayer.id, 15)}
                  className="p-2 sm:p-2.5 rounded-xl text-[#111110] hover:bg-[#E4F5FF] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                  title="چرخش ۱۵ درجه"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFlipLayer(activeLayer.id)}
                  className="p-2 sm:p-2.5 rounded-xl text-[#111110] hover:bg-[#E4F5FF] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                  title="قرینه افقی"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>

                {activeLayer.type === 'image' && (
                  <>
                    <div className="h-5 w-[1px] bg-[#BFDDF0] mx-0.5" />
                    <button
                      type="button"
                      disabled={isAutoRemovingBg}
                      onClick={() => handleAutoRemoveBg(activeLayer)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#2B5876] text-white hover:bg-[#1A384C] transition-colors text-xs flex items-center gap-1 font-medium disabled:opacity-50"
                      title="حذف هوشمند خودکار پس‌زمینه"
                    >
                      {isAutoRemovingBg ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>حذف خودکار پس‌زمینه</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenManualBgModal(activeLayer)}
                      className="px-2.5 py-1.5 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] hover:bg-[#E4F5FF] transition-colors text-xs flex items-center gap-1 font-medium"
                      title="ویرایش دستی پس‌زمینه با براش و پاک‌کن"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>ویرایش دستی</span>
                    </button>
                  </>
                )}

                <div className="h-5 w-[1px] bg-[#BFDDF0] mx-0.5 sm:mx-1" />
                <button
                  type="button"
                  onClick={() => handleDeleteLayer(activeLayer.id)}
                  className="p-2 sm:p-2.5 rounded-xl text-[#A33A3A] hover:bg-[#A33A3A]/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                  title="حذف لایه"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Notification / Toast for Background Removal feedback */}
            {bgRemovalFeedback && (
              <div className="mt-3 px-4 py-2 bg-[#2F6B4F] text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm animate-fade-in">
                <Check className="w-4 h-4" />
                <span>{bgRemovalFeedback}</span>
              </div>
            )}

          </div>

          {/* Configuration & Tools Sidebar Column */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Step 1: Base Product & Color & Size */}
            <div className="bg-[#FFFFFF] rounded-[20px] border border-[#BFDDF0] p-4 sm:p-6 shadow-[0_8px_30px_rgba(17,17,16,0.06)] text-right space-y-4">
              <h3 className="text-sm font-bold text-[#111110] flex items-center justify-between">
                <span>۱. انتخاب پوشاک پایه و رنگ</span>
                <span className="text-[11px] font-normal text-[#4A5560]">
                  {selectedProduct.name}
                </span>
              </h3>

              {/* Garment Selector */}
              <div className="grid grid-cols-2 gap-2">
                {customizableProducts.map((prod) => {
                  const isSelected = selectedProduct.id === prod.id;
                  const price = prod.discountPrice || prod.price;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setSelectedColor(prod.colors?.[0]?.name || '');
                        setSelectedColorHex(prod.colors?.[0]?.hex || '#1A1A1A');
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#111110] bg-[#E4F5FF]/40 ring-1 ring-[#111110]'
                          : 'border-[#BFDDF0] hover:border-[#111110]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#E4F5FF] shrink-0 border border-[#BFDDF0]">
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        <div className="text-[11px] font-bold text-[#111110] truncate">{prod.name}</div>
                        <div className="text-[10px] text-[#4A5560] font-medium mt-0.5">{formatPrice(price)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Color options */}
              <div className="pt-3 border-t border-[#BFDDF0]">
                <label className="block text-xs font-medium text-[#111110] mb-2">
                  رنگ پارچه: <span className="text-[#4A5560] font-normal">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.colors?.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c.name);
                        setSelectedColorHex(c.hex);
                      }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer relative ${
                        selectedColor === c.name
                          ? 'scale-110 border-[#111110] shadow-md ring-2 ring-[#111110]/20'
                          : 'border-[#BFDDF0] hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {selectedColor === c.name && (
                        <span
                          className={`absolute inset-0 flex items-center justify-center text-xs ${
                            c.hex === '#FFFFFF' || c.hex === '#F5F5F0' || c.hex === '#E2DBD0'
                              ? 'text-[#111110]'
                              : 'text-white'
                          }`}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size options */}
              <div className="pt-3 border-t border-[#BFDDF0]">
                <label className="block text-xs font-medium text-[#111110] mb-2">
                  سایز لباس: <span className="font-bold text-[#111110] font-mono">{selectedSize}</span>
                </label>
                <div className="flex gap-2">
                  {(selectedProduct.sizes || ['S', 'M', 'L', 'XL']).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                        selectedSize === sz
                          ? 'bg-[#111110] text-white border-[#111110]'
                          : 'bg-white text-[#4A5560] border-[#BFDDF0] hover:border-[#111110]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Tools (Text, Image Upload, Monogram, Adjust) */}
            <div className="bg-[#FFFFFF] rounded-[20px] border border-[#BFDDF0] p-4 sm:p-6 shadow-[0_8px_30px_rgba(17,17,16,0.06)] text-right space-y-4">
              <div className="flex items-center justify-between border-b border-[#BFDDF0] pb-3">
                <h3 className="text-sm font-bold text-[#111110]">
                  ۲. ابزارهای طراحی روی {VIEW_TITLES[activeSide]}
                </h3>
                <span className="text-[11px] text-[#4A5560]">
                  {toPersianDigits(currentLayers.length)} لایه فعال
                </span>
              </div>

              {/* Tool Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#E4F5FF]/50 rounded-xl border border-[#BFDDF0]">
                <button
                  type="button"
                  onClick={() => setActiveToolTab('text')}
                  className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    activeToolTab === 'text'
                      ? 'bg-white text-[#111110] shadow-sm font-bold'
                      : 'text-[#4A5560] hover:text-[#111110]'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>متن</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveToolTab('image')}
                  className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    activeToolTab === 'image'
                      ? 'bg-white text-[#111110] shadow-sm font-bold'
                      : 'text-[#4A5560] hover:text-[#111110]'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>تصویر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveToolTab('monogram')}
                  className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    activeToolTab === 'monogram'
                      ? 'bg-white text-[#111110] shadow-sm font-bold'
                      : 'text-[#4A5560] hover:text-[#111110]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>مونوگرام</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveToolTab('adjust')}
                  className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    activeToolTab === 'adjust'
                      ? 'bg-white text-[#111110] shadow-sm font-bold'
                      : 'text-[#4A5560] hover:text-[#111110]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>تنظیمات</span>
                </button>
              </div>

              {/* TOOL TAB 1: TEXT */}
              {activeToolTab === 'text' && (
                <div className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-[#111110]">
                      متن دلخواه (فارسی / انگلیسی):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="متن خود را بنویسید..."
                        className="flex-1 px-3 py-2 text-xs border border-[#BFDDF0] rounded-xl focus:outline-none focus:border-[#111110] bg-[#FFFFFF] text-[#111110]"
                      />
                      <button
                        type="button"
                        onClick={handleAddText}
                        className="px-4 py-2 bg-[#111110] text-[#FFFFFF] text-xs font-medium rounded-xl hover:bg-[#2A2A28] transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                      >
                        افزودن متن
                      </button>
                    </div>
                  </div>

                  {/* Font Family Choice */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTextFont('vazirmatn')}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                        textFont === 'vazirmatn'
                          ? 'border-[#111110] bg-[#E4F5FF]/60 text-[#111110] font-bold'
                          : 'border-[#BFDDF0] text-[#4A5560]'
                      }`}
                    >
                      قلم وزیرمتن (فارسی استاندارد)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextFont('serif')}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium font-serif text-center transition-all ${
                        textFont === 'serif'
                          ? 'border-[#111110] bg-[#E4F5FF]/60 text-[#111110] font-bold'
                          : 'border-[#BFDDF0] text-[#4A5560]'
                      }`}
                    >
                      Cormorant Garamond (لوکس)
                    </button>
                  </div>

                  {/* Text Color Picker */}
                  <div>
                    <label className="block text-[11px] text-[#4A5560] mb-1.5">رنگ متن و نوشته:</label>
                    <div className="flex items-center gap-2">
                      {[
                        { name: 'مشکی', hex: '#111110' },
                        { name: 'سفید', hex: '#FFFFFF' },
                        { name: 'طوسی سربی', hex: '#4A5560' },
                        { name: 'خردلی لوکس', hex: '#9A6B1F' },
                        { name: 'آبی موریکو', hex: '#2B5876' }
                      ].map((tc) => (
                        <button
                          key={tc.hex}
                          type="button"
                          onClick={() => {
                            setTextColor(tc.hex);
                            if (activeLayer && activeLayer.type === 'text') {
                              updateActiveLayer((l) => ({ ...l, color: tc.hex }));
                            }
                          }}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            textColor === tc.hex
                              ? 'scale-110 border-[#111110] shadow'
                              : 'border-[#BFDDF0]'
                          }`}
                          style={{ backgroundColor: tc.hex }}
                          title={tc.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Curated Presets */}
                  <div className="pt-2 border-t border-[#BFDDF0]/60">
                    <span className="text-[11px] text-[#4A5560] block mb-2">عبارت‌های آماده استودیو MORICO:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddPreset('سادگی و اصالت', 'vazirmatn')}
                        className="px-2.5 py-1 text-[11px] rounded-lg border border-[#BFDDF0] text-[#111110] hover:border-[#111110] bg-white transition-colors"
                      >
                        سادگی و اصالت
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPreset('آتلیه مد ۲۰۲۶', 'vazirmatn')}
                        className="px-2.5 py-1 text-[11px] rounded-lg border border-[#BFDDF0] text-[#111110] hover:border-[#111110] bg-white transition-colors"
                      >
                        آتلیه مد ۲۰۲۶
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPreset('QUIET LUXURY', 'serif')}
                        className="px-2.5 py-1 text-[11px] rounded-lg border border-[#BFDDF0] font-serif text-[#111110] hover:border-[#111110] bg-white transition-colors"
                      >
                        QUIET LUXURY
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPreset('MORICO STUDIO', 'serif')}
                        className="px-2.5 py-1 text-[11px] rounded-lg border border-[#BFDDF0] font-serif text-[#111110] hover:border-[#111110] bg-white transition-colors"
                      >
                        MORICO STUDIO
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TOOL TAB 2: IMAGE UPLOAD & BACKGROUND REMOVAL */}
              {activeToolTab === 'image' && (
                <div className="space-y-4 pt-1">
                  <div className="p-4 rounded-xl border-2 border-dashed border-[#BFDDF0] hover:border-[#111110] bg-[#E4F5FF]/30 text-center transition-all">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-white border border-[#BFDDF0] flex items-center justify-center mx-auto mb-2 text-[#111110]">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-[#111110] mb-1">
                      آپلود طرح، لوگو یا تصویر دلخواه
                    </h4>
                    <p className="text-[11px] text-[#4A5560] leading-relaxed mb-3">
                      پشتیبانی از فرمت‌های PNG، JPG، SVG و WebP تا سقف ۱۰ مگابایت
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-[#111110] text-white rounded-xl text-xs font-bold hover:bg-[#2A2A28] transition-colors shadow-sm cursor-pointer"
                    >
                      انتخاب فایل از دستگاه
                    </button>
                  </div>

                  {/* Background removal info card */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#BFDDF0] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#2B5876]">
                      <Sparkles className="w-4 h-4" />
                      <span>سیستم هوشمند حذف پس‌زمینه</span>
                    </div>
                    <p className="text-[11px] text-[#4A5560] leading-relaxed">
                      پس از افزودن تصویر، می‌توانید با دکمه <strong className="text-[#111110]">«حذف خودکار پس‌زمینه»</strong> زمینه سفید یا اضافی تصویرتان را بدون آسیب به خطوط اصلی حذف کنید یا با ابزار <strong className="text-[#111110]">«ویرایش دستی»</strong> با قلم مو و پاک‌کن جزئیات را تنظیم نمایید.
                    </p>
                  </div>
                </div>
              )}

              {/* TOOL TAB 3: MONOGRAM */}
              {activeToolTab === 'monogram' && (
                <div className="space-y-4 pt-1">
                  <div className="p-4 rounded-xl border border-[#BFDDF0] bg-[#E4F5FF]/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-[#BFDDF0] flex items-center justify-center font-serif text-2xl font-bold text-[#111110] shadow-sm">
                          MC
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#111110]">مونوگرام رسمی MORICO</div>
                          <div className="text-[11px] text-[#4A5560]">امضای برند MORICO STYLE – Since 2026</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddMonogram}
                        className="px-4 py-2 bg-[#111110] text-white rounded-xl text-xs font-bold hover:bg-[#2A2A28] transition-colors cursor-pointer"
                      >
                        افزودن به نما
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TOOL TAB 4: ADJUST / FINE TUNE SELECTED LAYER */}
              {activeToolTab === 'adjust' && (
                <div className="space-y-4 pt-1">
                  {activeLayer ? (
                    <div className="space-y-3.5 bg-[#E4F5FF]/30 p-3.5 rounded-xl border border-[#BFDDF0]">
                      <div className="flex items-center justify-between border-b border-[#BFDDF0]/60 pb-2">
                        <span className="text-xs font-bold text-[#111110]">
                          تنظیمات لایه انتخابی ({activeLayer.type === 'text' ? 'متن' : activeLayer.type === 'image' ? 'تصویر' : 'مونوگرام'})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteLayer(activeLayer.id)}
                          className="text-[#A33A3A] hover:underline text-[11px] flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>

                      {/* Position X Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#4A5560] mb-1">
                          <span>موقعیت افقی (X):</span>
                          <span className="font-mono">{toPersianDigits(activeLayer.x)}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={activeLayer.x}
                          onChange={(e) => updateActiveLayer((l) => ({ ...l, x: Number(e.target.value) }))}
                          className="w-full"
                        />
                      </div>

                      {/* Position Y Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#4A5560] mb-1">
                          <span>موقعیت عمودی (Y):</span>
                          <span className="font-mono">{toPersianDigits(activeLayer.y)}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={activeLayer.y}
                          onChange={(e) => updateActiveLayer((l) => ({ ...l, y: Number(e.target.value) }))}
                          className="w-full"
                        />
                      </div>

                      {/* Scale Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#4A5560] mb-1">
                          <span>اندازه و مقیاس (Scale):</span>
                          <span className="font-mono">{toPersianDigits(activeLayer.scale || 1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.4"
                          max="2.5"
                          step="0.05"
                          value={activeLayer.scale || 1}
                          onChange={(e) => updateActiveLayer((l) => ({ ...l, scale: Number(e.target.value) }))}
                          className="w-full"
                        />
                      </div>

                      {/* Rotation Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#4A5560] mb-1">
                          <span>زاویه چرخش:</span>
                          <span className="font-mono">{toPersianDigits(activeLayer.rotation || 0)}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={activeLayer.rotation || 0}
                          onChange={(e) => updateActiveLayer((l) => ({ ...l, rotation: Number(e.target.value) }))}
                          className="w-full"
                        />
                      </div>

                      {/* If Image layer: background removal actions */}
                      {activeLayer.type === 'image' && (
                        <div className="pt-2 border-t border-[#BFDDF0]/60 space-y-2">
                          <span className="text-[11px] font-bold text-[#111110] block">
                            ابزارهای پس‌زمینه تصویر:
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isAutoRemovingBg}
                              onClick={() => handleAutoRemoveBg(activeLayer)}
                              className="flex-1 py-2 px-3 rounded-xl bg-[#2B5876] text-white text-xs font-bold hover:bg-[#1A384C] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              {isAutoRemovingBg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              <span>حذف خودکار</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenManualBgModal(activeLayer)}
                              className="flex-1 py-2 px-3 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] text-xs font-bold hover:bg-[#E4F5FF] transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Eraser className="w-3.5 h-3.5" />
                              <span>پاک‌کن دستی</span>
                            </button>
                          </div>

                          {activeLayer.hasBgRemoved && (
                            <button
                              type="button"
                              onClick={() => handleRestoreOriginalImage(activeLayer)}
                              className="w-full py-1.5 text-[11px] text-[#4A5560] hover:text-[#111110] hover:underline flex items-center justify-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>بازگردانی به عکس اولیه</span>
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-[#4A5560]">
                      هیچ لایه‌ای انتخاب نشده است. روی یکی از لایه‌های تصویر یا متن کلیک کنید.
                    </div>
                  )}
                </div>
              )}

              {/* Layers List for Current View */}
              {currentLayers.length > 0 && (
                <div className="pt-3 border-t border-[#BFDDF0]">
                  <span className="text-[11px] font-bold text-[#4A5560] block mb-2">
                    لایه‌های موجود در این نما:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {currentLayers.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => {
                          setSelectedLayerId(l.id);
                          setActiveToolTab('adjust');
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition-colors ${
                          selectedLayerId === l.id
                            ? 'bg-[#111110] text-white border-[#111110]'
                            : 'bg-[#E4F5FF]/40 text-[#111110] border-[#BFDDF0] hover:border-[#111110]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Layers className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {l.type === 'monogram'
                              ? 'مونوگرام رسمی MC'
                              : l.type === 'text'
                              ? `متن: "${l.content}"`
                              : 'تصویر اختصاصی آپلود شده'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLayer(l.id);
                          }}
                          className="p-1 hover:opacity-75"
                          title="حذف"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Price & Checkout Card */}
            <div className="bg-[#FFFFFF] rounded-[20px] border border-[#BFDDF0] p-4 sm:p-6 shadow-[0_8px_30px_rgba(17,17,16,0.06)] text-right space-y-4">
              <div className="flex items-center justify-between text-xs text-[#4A5560]">
                <span>پوشاک پایه ({selectedProduct.name})</span>
                <span className="font-medium font-mono">{formatPrice(effectiveProductPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#4A5560]">
                <span>هزینه طراحی و آماده‌سازی چاپ اختصاصی</span>
                <span className="font-medium font-mono">{formatPrice(customFee)}</span>
              </div>
              <div className="pt-3 border-t border-[#BFDDF0] flex items-center justify-between">
                <span className="font-bold text-sm text-[#111110]">مجموع قابل پرداخت:</span>
                <span className="text-lg font-bold text-[#111110] font-mono">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleAddToCart}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#111110] text-[#FFFFFF] hover:bg-[#2A2A28] rounded-xl text-sm font-medium transition-all shadow-[0_8px_24px_rgba(17,17,16,0.1)] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال آماده‌سازی فایل‌های چاپ DTG...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>افزودن این اثر سفارشی به سبد خرید</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-[#4A5560] text-center leading-relaxed">
                طرح‌های همه جهت‌ها ({toPersianDigits(totalLayersCount)} لایه) در سفارش ثبت و به آتلیه چاپ ارسال می‌شوند.
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Manual Background Removal Modal */}
      {bgModalOpen && (
        <BackgroundRemovalModal
          isOpen={bgModalOpen}
          initialImageUrl={bgModalImage}
          onClose={() => setBgModalOpen(false)}
          onApply={handleApplyManualBg}
        />
      )}
    </div>
  );
};
