import React, { useState, useMemo } from 'react';
import { TopWeeklyItem, Product, Category } from '../../lib/types';
import { DEFAULT_TOP_WEEKLY_ITEMS } from '../../lib/specialSectionsData';
import { formatPrice, formatPersianNumber, toPersianDigits } from '../../lib/currency';
import { ImageUploader } from './ImageUploader';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  Search,
  Star,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  Tag,
  ThumbsUp
} from 'lucide-react';

interface AdminTopWeeklyProps {
  items: TopWeeklyItem[];
  products?: Product[];
  categories?: Category[];
  onSave: (items: TopWeeklyItem[]) => Promise<void>;
  onSyncPublicStore?: () => void;
  dark?: boolean;
}

export const AdminTopWeekly: React.FC<AdminTopWeeklyProps> = ({
  items: initialItems,
  products = [],
  categories = [],
  onSave,
  onSyncPublicStore
}) => {
  const [items, setItems] = useState<TopWeeklyItem[]>(() => {
    return initialItems && initialItems.length > 0 ? initialItems : DEFAULT_TOP_WEEKLY_ITEMS;
  });

  const [activeChip, setActiveChip] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'thisWeek' | 'lastWeek'>('thisWeek');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<TopWeeklyItem | null>(null);
  const [modalMode, setModalMode] = useState<'catalog' | 'manual'>('catalog');

  // Form States
  const [selectedCatalogProductId, setSelectedCatalogProductId] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('digital');
  const [formImage, setFormImage] = useState<string>('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formDiscountPrice, setFormDiscountPrice] = useState<number | undefined>(undefined);
  const [formRating, setFormRating] = useState<number>(4.9);
  const [formSatisfactionPercent, setFormSatisfactionPercent] = useState<number>(98);
  const [formReviewsCount, setFormReviewsCount] = useState<number>(500);
  const [formTag, setFormTag] = useState<string>('منتخب برتر هفته');
  const [formAwardTitle, setFormAwardTitle] = useState<string>('بالاترین رضایت خریداران');
  const [formRankThisWeek, setFormRankThisWeek] = useState<number>(1);
  const [formRankLastWeek, setFormRankLastWeek] = useState<number>(1);

  // Dynamic categories registered in the store
  const availableChips = useMemo(() => {
    const list = [{ id: 'all', label: 'همه دسته‌ها' }];
    if (categories && categories.length > 0) {
      categories.forEach((c) => {
        list.push({ id: c.id, label: c.title });
      });
    } else {
      const uniqueCats = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
      uniqueCats.forEach((cat) => {
        list.push({ id: cat, label: cat });
      });
    }
    return list;
  }, [categories, items]);

  // Filter items
  const filteredItems = items.filter((item) => {
    const catObj = categories.find((c) => c.id === activeChip);
    const catTitle = catObj?.title || activeChip;
    const matchesCategory =
      activeChip === 'all' ||
      item.category === activeChip ||
      item.category === catTitle ||
      (catObj?.slug && item.category === catObj.slug);
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.awardTitle && item.awardTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tag && item.tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    const rA = timeframe === 'thisWeek' ? a.rankThisWeek : a.rankLastWeek;
    const rB = timeframe === 'thisWeek' ? b.rankThisWeek : b.rankLastWeek;
    return rA - rB;
  });

  // Open Add modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setModalMode('catalog');
    setSelectedCatalogProductId('');
    setFormName('');
    setFormCategory('digital');
    setFormImage('');
    setFormPrice(15000000);
    setFormDiscountPrice(13500000);
    setFormRating(4.9);
    setFormSatisfactionPercent(98);
    setFormReviewsCount(600);
    setFormTag('منتخب برتر هفته');
    setFormAwardTitle('بهترین کیفیت و اصالت');
    setFormRankThisWeek(items.length + 1);
    setFormRankLastWeek(items.length + 1);
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (item: TopWeeklyItem) => {
    setEditingItem(item);
    setModalMode('manual');
    setSelectedCatalogProductId('');
    setFormName(item.name);
    setFormCategory(item.category || 'digital');
    setFormImage(item.image || '');
    setFormPrice(item.price);
    setFormDiscountPrice(item.discountPrice);
    setFormRating(item.rating || 4.9);
    setFormSatisfactionPercent(item.satisfactionPercent || 98);
    setFormReviewsCount(item.reviewsCount || 100);
    setFormTag(item.tag || 'منتخب برتر هفته');
    setFormAwardTitle(item.awardTitle || 'نشان برگزیده');
    setFormRankThisWeek(item.rankThisWeek || 1);
    setFormRankLastWeek(item.rankLastWeek || 1);
    setIsModalOpen(true);
  };

  // Select catalog product to auto-populate
  const handleSelectCatalogProduct = (prodId: string) => {
    setSelectedCatalogProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setFormName(prod.name);
      setFormCategory(prod.categoryId || 'digital');
      setFormImage(prod.image || (prod.images && prod.images[0]) || '');
      setFormPrice(prod.price);
      setFormDiscountPrice(prod.discountPrice);
      setFormTag('منتخب برتر هفته');
      setFormAwardTitle('کیفیت برگزیده آتلیه');
    }
  };

  // Save Modal Item
  const handleSaveModalItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                name: formName.trim(),
                category: formCategory,
                image: formImage || '/brand/morico-logo.jpg',
                price: Number(formPrice) || 0,
                discountPrice: formDiscountPrice ? Number(formDiscountPrice) : undefined,
                rating: Number(formRating) || 4.9,
                satisfactionPercent: Number(formSatisfactionPercent) || 98,
                reviewsCount: Number(formReviewsCount) || 0,
                tag: formTag.trim(),
                awardTitle: formAwardTitle.trim(),
                rankThisWeek: Number(formRankThisWeek) || 1,
                rankLastWeek: Number(formRankLastWeek) || 1
              }
            : i
        )
      );
    } else {
      const newItem: TopWeeklyItem = {
        id: `tw-custom-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        image: formImage || '/brand/morico-logo.jpg',
        price: Number(formPrice) || 0,
        discountPrice: formDiscountPrice ? Number(formDiscountPrice) : undefined,
        rating: Number(formRating) || 4.9,
        satisfactionPercent: Number(formSatisfactionPercent) || 98,
        reviewsCount: Number(formReviewsCount) || 0,
        tag: formTag.trim(),
        awardTitle: formAwardTitle.trim(),
        rankThisWeek: Number(formRankThisWeek) || items.length + 1,
        rankLastWeek: Number(formRankLastWeek) || items.length + 1
      };
      setItems((prev) => [newItem, ...prev]);
    }

    setIsModalOpen(false);
  };

  // Delete Item
  const handleDeleteItem = (id: string) => {
    if (window.confirm('آیا از حذف این کالا از لیست برترین‌های هفته اطمینان دارید؟')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // Move Rank Up / Down
  const handleMoveRank = (id: string, direction: 'up' | 'down') => {
    const sorted = [...items].sort((a, b) =>
      timeframe === 'thisWeek'
        ? a.rankThisWeek - b.rankThisWeek
        : a.rankLastWeek - b.rankLastWeek
    );
    const index = sorted.findIndex((i) => i.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const itemA = sorted[index];
    const itemB = sorted[targetIndex];

    if (timeframe === 'thisWeek') {
      const temp = itemA.rankThisWeek;
      itemA.rankThisWeek = itemB.rankThisWeek;
      itemB.rankThisWeek = temp;
    } else {
      const temp = itemA.rankLastWeek;
      itemA.rankLastWeek = itemB.rankLastWeek;
      itemB.rankLastWeek = temp;
    }

    setItems([...sorted]);
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (
      window.confirm(
        'آیا مایلید تمام آیتم‌های برترین‌های هفته به لیست استاندارد موریکو بازنشانی شوند؟'
      )
    ) {
      setItems(DEFAULT_TOP_WEEKLY_ITEMS);
    }
  };

  // Save changes to backend & disk
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSave(items);
      setSaveSuccess(true);
      onSyncPublicStore?.();
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch {
      alert('خطا در ذخیره‌سازی داده‌های برترین‌های هفته.');
    } finally {
      setIsSaving(false);
    }
  };

  // Summary Metrics
  const totalCount = items.length;
  const top1Item = [...items].sort((a, b) => a.rankThisWeek - b.rankThisWeek)[0];
  const maxSatisfaction = items.length > 0 ? Math.max(...items.map((i) => i.satisfactionPercent || 0)) : 100;
  const awardsCount = items.filter((i) => Boolean(i.awardTitle)).length;

  return (
    <div className="space-y-6 text-right font-sans">
      {/* ----------------------------------------------------------------- */}
      {/* Header Banner                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#BFDDF0] shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">مدیریت برترین‌های هفته</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  {formatPersianNumber(totalCount)} کالا
                </span>
              </div>
              <p className="text-xs text-gray-500">
                تنظیم رتبه‌بندی‌های هفتگی، نشان‌های افتخار، درصد رضایت خریداران و محصولات سرآمد هفته
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="بازنشانی به داده‌های اولیه"
          >
            <RotateCcw className="w-4 h-4 text-gray-500" />
            <span>بازنشانی</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#111110] text-white hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن کالا به لیست</span>
          </button>

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saveSuccess ? 'ذخیره شد' : isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Metric Cards                                                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#BFDDF0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">کل برگزیدگان هفته</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">
              {formatPersianNumber(totalCount)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#BFDDF0] shadow-xs flex items-center justify-between">
          <div className="max-w-[160px] truncate">
            <span className="text-[11px] text-gray-500 block font-medium">رتبه ۱ این هفته</span>
            <span className="text-sm font-bold text-gray-900 mt-1 block truncate">
              {top1Item ? top1Item.name : '—'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            #۱
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#BFDDF0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">بیشترین رضایت خریداران</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block flex items-center gap-1">
              <span>{toPersianDigits(maxSatisfaction)}٪</span>
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ThumbsUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#BFDDF0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">نشان‌های افتخار فعال</span>
            <span className="text-2xl font-black text-purple-700 mt-1 block">
              {formatPersianNumber(awardsCount)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Controls: Search, Timeframe & Categories                          */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-white border border-[#BFDDF0] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder=""
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:bg-white focus:border-amber-500 focus:outline-hidden text-[#111110]"
            />
          </div>

          {/* Timeframe switch */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl self-stretch sm:self-auto justify-center">
            <button
              type="button"
              onClick={() => setTimeframe('thisWeek')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'thisWeek'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              رتبه‌بندی این هفته
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('lastWeek')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'lastWeek'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              رتبه‌بندی هفته گذشته
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-400 shrink-0 ml-1">دسته‌بندی:</span>
          {availableChips.map((chip) => {
            const count = chip.id === 'all'
              ? items.length
              : items.filter((i) => i.category === chip.id || i.category === chip.label).length;
            const isSelected = activeChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveChip(chip.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#111110] text-white font-bold shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                }`}
              >
                <span>{chip.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {formatPersianNumber(count)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Items List                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#BFDDF0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#BFDDF0]/60 flex items-center justify-between text-xs font-bold text-gray-700 bg-gray-50/70">
          <span>نمایش {formatPersianNumber(sortedItems.length)} کالا در رتبه‌بندی هفتگی</span>
          <span className="text-[11px] text-gray-400 font-normal">امکان ویرایش مشخصات، نشان افتخار و رتبه هر محصول</span>
        </div>

        {sortedItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            هیچ کالایی با این فیلتر یافت نشد.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedItems.map((item, index) => {
              const currentRank = item.rankThisWeek;
              const lastRank = item.rankLastWeek;
              const rankDiff = lastRank - currentRank; // positive = improved

              const hasDiscount = item.discountPrice && item.discountPrice < item.price;
              const discountPercent = hasDiscount
                ? Math.round(((item.price - (item.discountPrice || 0)) / item.price) * 100)
                : 0;

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-neutral-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  {/* Rank + Trend + Image + Details */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Rank Badge with Trend */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-2xs ${
                          currentRank === 1
                            ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                            : currentRank === 2
                            ? 'bg-slate-300 text-slate-800 ring-2 ring-slate-200'
                            : currentRank === 3
                            ? 'bg-amber-700 text-white ring-2 ring-amber-600'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {toPersianDigits(currentRank)}
                      </div>

                      {/* Trend Indicator */}
                      <div className="flex items-center text-[10px] font-bold">
                        {rankDiff > 0 ? (
                          <span className="text-emerald-600 flex items-center">
                            <TrendingUp className="w-3 h-3" />
                            <span>+{toPersianDigits(rankDiff)}</span>
                          </span>
                        ) : rankDiff < 0 ? (
                          <span className="text-rose-600 flex items-center">
                            <TrendingDown className="w-3 h-3" />
                            <span>{toPersianDigits(rankDiff)}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 flex items-center">
                            <Minus className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="w-14 h-14 rounded-xl border border-gray-200 bg-white overflow-hidden p-1 shrink-0 flex items-center justify-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/brand/morico-logo.jpg';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-1">
                          {item.name}
                        </span>
                        {item.awardTitle && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-600" />
                            <span>{item.awardTitle}</span>
                          </span>
                        )}
                        {item.tag && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                            {item.tag}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                        <span>دسته‌بندی: <strong className="text-gray-700">{item.category}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{toPersianDigits(item.satisfactionPercent || 98)}٪ رضایت</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-600 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{toPersianDigits(item.rating || 4.9)}</span>
                          <span className="text-gray-400 font-normal">({formatPersianNumber(item.reviewsCount || 0)} نظر)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action buttons */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                    {/* Price info */}
                    <div className="text-left md:text-right">
                      {hasDiscount ? (
                        <div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="px-1.5 py-0.2 rounded-md bg-[#ef394a] text-white text-[10px] font-bold">
                              {toPersianDigits(discountPercent)}٪
                            </span>
                            <span className="text-[11px] text-gray-400 line-through">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            {formatPrice(item.discountPrice!)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-gray-900">
                          {formatPrice(item.price)}
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveRank(item.id, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 disabled:opacity-30 cursor-pointer"
                        title="افزایش رتبه (حرکت به بالا)"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveRank(item.id, 'down')}
                        disabled={index === sortedItems.length - 1}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 disabled:opacity-30 cursor-pointer"
                        title="کاهش رتبه (حرکت به پایین)"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-blue-50 text-blue-600 hover:border-blue-200 transition-colors cursor-pointer"
                        title="ویرایش کالا"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-red-50 text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                        title="حذف از برترین‌های هفته"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Modal: Add / Edit Top Weekly Item                                 */}
      {/* ----------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-right space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  {editingItem ? 'ویرایش مشخصات کالای برتر هفته' : 'افزودن کالا به لیست برترین‌های هفته'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode selection tabs if creating new */}
            {!editingItem && (
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <button
                  type="button"
                  onClick={() => setModalMode('catalog')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    modalMode === 'catalog'
                      ? 'bg-[#111110] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  انتخاب از محصولات کاتالوگ فروشگاه
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('manual')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    modalMode === 'manual'
                      ? 'bg-[#111110] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ورود دستی و اطلاعات دلخواه
                </button>
              </div>
            )}

            <form onSubmit={handleSaveModalItem} className="space-y-4 text-xs">
              {/* Option to pick from catalog */}
              {modalMode === 'catalog' && !editingItem && (
                <div className="p-4 rounded-2xl bg-neutral-50 border border-gray-200 space-y-3">
                  <label className="block font-bold text-gray-800">
                    انتخاب کالا از میان محصولات فعال فروشگاه:
                  </label>
                  <select
                    value={selectedCatalogProductId}
                    onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white font-medium text-xs focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="">-- لطفاً یک محصول را انتخاب کنید --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatPrice(p.price)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  نام کامل کالا <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-medium focus:border-amber-500 focus:outline-hidden text-[#111110]"
                />
              </div>

              {/* Category & Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    دسته‌بندی مرتبط:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white font-medium focus:border-amber-500 focus:outline-hidden text-[#111110]"
                  >
                    {categories && categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id} value={c.slug || c.id}>
                          {c.title}
                        </option>
                      ))
                    ) : (
                      availableChips.filter((c) => c.id !== 'all').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    نشان افتخار برگزیده (Award Title):
                  </label>
                  <input
                    type="text"
                    value={formAwardTitle}
                    onChange={(e) => setFormAwardTitle(e.target.value)}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-medium focus:border-amber-500 focus:outline-hidden text-[#111110]"
                  />
                </div>
              </div>

              {/* Tag & Satisfaction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    برچسب تبلیغاتی (Tag):
                  </label>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    placeholder="مثال: منتخب برتر هفته"
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-medium focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    درصد رضایت خریداران (۰ تا ۱۰۰٪):
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={formSatisfactionPercent}
                    onChange={(e) => setFormSatisfactionPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-mono focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Image Uploader */}
              <ImageUploader
                label="تصویر محصول:"
                value={formImage}
                onChange={(url) => setFormImage(url)}
                onRemove={() => setFormImage('')}
              />

              {/* Price & Discount Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    قیمت اصلی (تومان) <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-mono focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    قیمت پس از تخفیف (تومان - اختیاری):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formDiscountPrice || ''}
                    onChange={(e) =>
                      setFormDiscountPrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="در صورت داشتن تخفیف وارد کنید"
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-mono focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Ranks & Reviews */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">رتبه این هفته:</label>
                  <input
                    type="number"
                    min="1"
                    value={formRankThisWeek}
                    onChange={(e) => setFormRankThisWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border rounded-xl bg-white font-mono text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">رتبه هفته قبل:</label>
                  <input
                    type="number"
                    min="1"
                    value={formRankLastWeek}
                    onChange={(e) => setFormRankLastWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border rounded-xl bg-white font-mono text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">امتیاز (۱ تا ۵):</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    max="5"
                    value={formRating}
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border rounded-xl bg-white font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">تعداد نظرات:</label>
                  <input
                    type="number"
                    min="0"
                    value={formReviewsCount}
                    onChange={(e) => setFormReviewsCount(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border rounded-xl bg-white font-mono text-center"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-xs cursor-pointer"
                >
                  {editingItem ? 'ثبت ویرایش کالا' : 'افزودن به برترین‌های هفته'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
