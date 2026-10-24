import React, { useState, useMemo } from 'react';
import { Category, CategoryAttribute, AttributeType, Product } from '../../lib/types';
import { formatPersianNumber } from '../../lib/currency';
import { ImageUploader } from './ImageUploader';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Package,
  Layers,
  FolderTree,
  Sliders,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Menu as MenuIcon,
  Home as HomeIcon,
  ArrowRight,
  Info,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Globe,
  Sparkles,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Home,
  Lamp,
  Shirt,
  Book,
  Gift,
  Heart,
  Coffee,
  Camera,
  Music,
  Palette,
  Scissors,
  Shield,
  Compass,
  Tag,
  Cpu,
  Box,
  ShoppingBag,
  ExternalLink,
  Grid
} from 'lucide-react';

interface AdminCategoriesProps {
  categories: Category[];
  products: Product[];
  categoryAttributes: CategoryAttribute[];
  onCreateCategory: (cat: Omit<Category, 'id' | 'productCount'>) => Promise<void>;
  onUpdateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string, reassignTo?: string) => Promise<void>;
  onCreateAttribute: (attr: Omit<CategoryAttribute, 'id'>) => Promise<void>;
  onUpdateAttribute: (id: string, attr: Partial<CategoryAttribute>) => Promise<void>;
  onDeleteAttribute: (id: string) => Promise<void>;
  onFilterProductsByCategory: (categoryId: string) => void;
  onNavigateQuickCategories?: () => void;
  dark?: boolean;
}

// Curated list of selectable icon presets
const ICON_PRESETS: Array<{ id: string; name: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'ShoppingBag', name: 'خرید عمومی', icon: ShoppingBag },
  { id: 'Smartphone', name: 'موبایل و گجت', icon: Smartphone },
  { id: 'Laptop', name: 'لپ‌تاپ و کامپیوتر', icon: Laptop },
  { id: 'Headphones', name: 'صوتی و هدفون', icon: Headphones },
  { id: 'Watch', name: 'ساعت و مچ‌بند', icon: Watch },
  { id: 'Home', name: 'خانه و دکوراسیون', icon: Home },
  { id: 'Lamp', name: 'روشنایی و آباژور', icon: Lamp },
  { id: 'Shirt', name: 'مد و پوشاک', icon: Shirt },
  { id: 'Palette', name: 'محصولات هنری', icon: Palette },
  { id: 'Sparkles', name: 'خاص و لوکس', icon: Sparkles },
  { id: 'Book', name: 'کتاب و تحریر', icon: Book },
  { id: 'Gift', name: 'هدیه و اکسسوری', icon: Gift },
  { id: 'Heart', name: 'سلامت و زیبایی', icon: Heart },
  { id: 'Coffee', name: 'آشپزخانه و کافی', icon: Coffee },
  { id: 'Camera', name: 'دوربین و عکاسی', icon: Camera },
  { id: 'Music', name: 'ساز و آلات موسیقی', icon: Music },
  { id: 'Scissors', name: 'خیاطی و طراحی', icon: Scissors },
  { id: 'Shield', name: 'امنیتی و حفاظتی', icon: Shield },
  { id: 'Compass', name: 'سفر و کمپینگ', icon: Compass },
  { id: 'Tag', name: 'تخفیف و پیشنهاد', icon: Tag },
  { id: 'Cpu', name: 'تجهیزات سخت‌افزاری', icon: Cpu },
  { id: 'Box', name: 'بسته‌بندی و سفارش', icon: Box },
  { id: 'Globe', name: 'بین‌المللی', icon: Globe },
  { id: 'Sliders', name: 'سفارشی و متغیر', icon: Sliders }
];

export const CategoryIconViewer: React.FC<{ icon?: string; className?: string }> = ({
  icon,
  className = 'w-4 h-4'
}) => {
  if (!icon) return <FolderTree className={className} />;
  const preset = ICON_PRESETS.find((p) => p.id === icon);
  if (preset) {
    const IconComp = preset.icon;
    return <IconComp className={className} />;
  }
  // If it's emoji or single text character
  return <span className="text-sm select-none">{icon}</span>;
};

// Helper to recursively collect all descendant category IDs (prevents circular hierarchies)
function getDescendantIds(targetId: string, allCats: Category[]): Set<string> {
  const result = new Set<string>();
  const stack = [targetId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const cat of allCats) {
      if (cat.parentId === current && !result.has(cat.id)) {
        result.add(cat.id);
        stack.push(cat.id);
      }
    }
  }
  return result;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  categories,
  products,
  categoryAttributes,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCreateAttribute,
  onUpdateAttribute,
  onDeleteAttribute,
  onFilterProductsByCategory,
  onNavigateQuickCategories
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'attributes'>('categories');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'root' | 'sub'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [menuFilter, setMenuFilter] = useState<'all' | 'mainMenu' | 'home' | 'footer'>('all');

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catTitle, setCatTitle] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParentId, setCatParentId] = useState<string>('');
  const [catDescription, setCatDescription] = useState('');
  const [catIcon, setCatIcon] = useState<string>('');
  const [catImage, setCatImage] = useState('');
  const [catBanner, setCatBanner] = useState('');
  const [catSortOrder, setCatSortOrder] = useState<number>(0);
  const [catActive, setCatActive] = useState(true);
  const [catShowInMainMenu, setCatShowInMainMenu] = useState(true);
  const [catShowInHome, setCatShowInHome] = useState(true);
  const [catShowInFooter, setCatShowInFooter] = useState(true);
  const [catSeoTitle, setCatSeoTitle] = useState('');
  const [catSeoDescription, setCatSeoDescription] = useState('');
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'seo'>('general');

  // Safe Deletion & Product Reassignment Modal
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignTargetCatId, setReassignTargetCatId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Attribute Modal State
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<CategoryAttribute | null>(null);
  const [attrCategoryId, setAttrCategoryId] = useState<string>('all');
  const [attrName, setAttrName] = useState('');
  const [attrKey, setAttrKey] = useState('');
  const [attrType, setAttrType] = useState<AttributeType>('text');
  const [attrOptionsText, setAttrOptionsText] = useState('');
  const [attrUnit, setAttrUnit] = useState('');
  const [attrFilterable, setAttrFilterable] = useState(true);
  const [attrShowInProductPage, setAttrShowInProductPage] = useState(true);
  const [attrRequired, setAttrRequired] = useState(false);
  const [attrSortOrder, setAttrSortOrder] = useState<number>(0);
  const [attrFilterCategory, setAttrFilterCategory] = useState<string>('all');

  // -------------------------------------------------------------
  // Dynamic Circular Loop Prevention for Parent Selection
  // -------------------------------------------------------------
  const invalidParentIds = useMemo(() => {
    if (!editingCategory) return new Set<string>();
    const descendants = getDescendantIds(editingCategory.id, categories);
    descendants.add(editingCategory.id);
    return descendants;
  }, [editingCategory, categories]);

  // -------------------------------------------------------------
  // Category Handlers
  // -------------------------------------------------------------
  const openCreateCategory = (presetParentId?: string) => {
    setEditingCategory(null);
    setCatTitle('');
    setCatSlug('');
    setCatParentId(presetParentId || '');
    setCatDescription('');
    setCatIcon('');
    setCatImage('');
    setCatBanner('');
    setCatSortOrder(categories.length + 1);
    setCatActive(true);
    setCatShowInMainMenu(true);
    setCatShowInHome(true);
    setCatShowInFooter(true);
    setCatSeoTitle('');
    setCatSeoDescription('');
    setActiveModalTab('general');
    setIsCatModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatTitle(cat.title);
    setCatSlug(cat.slug);
    setCatParentId(cat.parentId || '');
    setCatDescription(cat.description || '');
    setCatIcon(cat.icon || '');
    setCatImage(cat.image || '');
    setCatBanner(cat.banner || '');
    setCatSortOrder(cat.sortOrder || 0);
    setCatActive(cat.active !== false);
    setCatShowInMainMenu(cat.showInMainMenu !== false);
    setCatShowInHome(cat.showInHome !== false);
    setCatShowInFooter(cat.showInFooter !== false);
    setCatSeoTitle(cat.seoTitle || '');
    setCatSeoDescription(cat.seoDescription || '');
    setActiveModalTab('general');
    setIsCatModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setCatTitle(val);
    if (!editingCategory) {
      const generatedSlug = val
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9آ-ی\s-]/g, '')
        .replace(/\s+/g, '-');
      setCatSlug(generatedSlug);
      if (!catSeoTitle) {
        setCatSeoTitle(`خرید و قیمت ${val} | فروشگاه موریکو`);
      }
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catTitle.trim()) return;

    // Validate parent hierarchy to avoid loops
    if (editingCategory && catParentId && invalidParentIds.has(catParentId)) {
      alert('امکان انتخاب این دسته‌بندی به عنوان والد وجود ندارد، زیرا باعث ایجاد حلقه در ساختار درختی می‌شود.');
      return;
    }

    const payload: Omit<Category, 'id' | 'productCount'> = {
      title: catTitle.trim(),
      slug: catSlug.trim() || `cat-${Date.now()}`,
      parentId: catParentId ? catParentId : null,
      description: catDescription.trim() || undefined,
      icon: catIcon.trim() || undefined,
      image: catImage.trim() || undefined,
      banner: catBanner.trim() || undefined,
      sortOrder: Number(catSortOrder) || 0,
      active: catActive,
      showInMainMenu: catShowInMainMenu,
      showInHome: catShowInHome,
      showInFooter: catShowInFooter,
      seoTitle: catSeoTitle.trim() || undefined,
      seoDescription: catSeoDescription.trim() || undefined
    };

    if (editingCategory) {
      await onUpdateCategory(editingCategory.id, payload);
    } else {
      await onCreateCategory(payload);
    }
    setIsCatModalOpen(false);
  };

  // Quick Inline Status Toggle
  const handleToggleActive = async (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = cat.active === false ? true : false;
    await onUpdateCategory(cat.id, { active: newStatus });
  };

  // Quick Move Up / Down between siblings
  const handleMoveSort = async (cat: Category, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const siblings = categories
      .filter((c) => (c.parentId || null) === (cat.parentId || null))
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const currentIndex = siblings.findIndex((c) => c.id === cat.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const target = siblings[targetIndex];
    const currentOrder = cat.sortOrder || 0;
    const targetOrder = target.sortOrder || 0;

    const newCurrentOrder = targetOrder === currentOrder ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1) : targetOrder;
    const newTargetOrder = currentOrder;

    await onUpdateCategory(cat.id, { sortOrder: newCurrentOrder });
    await onUpdateCategory(target.id, { sortOrder: newTargetOrder });
  };

  const promptDeleteCategory = (cat: Category) => {
    setCategoryToDelete(cat);
    const alternative = categories.find((c) => c.id !== cat.id && !invalidParentIds.has(c.id));
    setReassignTargetCatId(alternative ? alternative.id : '');
  };

  const handleExecuteDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      const matchingCount = products.filter(
        (p) => p.categoryId === categoryToDelete.id && p.status !== 'archived'
      ).length;
      const reassign = matchingCount > 0 ? reassignTargetCatId : undefined;
      await onDeleteCategory(categoryToDelete.id, reassign);
      setCategoryToDelete(null);
    } catch (err: any) {
      alert(err.message || 'خطا در حذف دسته‌بندی');
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // Attribute Handlers
  // -------------------------------------------------------------
  const openCreateAttribute = () => {
    setEditingAttribute(null);
    setAttrCategoryId('all');
    setAttrName('');
    setAttrKey('');
    setAttrType('text');
    setAttrOptionsText('');
    setAttrUnit('');
    setAttrFilterable(true);
    setAttrShowInProductPage(true);
    setAttrRequired(false);
    setAttrSortOrder(categoryAttributes.length + 1);
    setIsAttrModalOpen(true);
  };

  const openEditAttribute = (attr: CategoryAttribute) => {
    setEditingAttribute(attr);
    setAttrCategoryId(attr.categoryId || 'all');
    setAttrName(attr.name);
    setAttrKey(attr.key);
    setAttrType(attr.type);
    setAttrOptionsText(attr.options ? attr.options.join('\n') : '');
    setAttrUnit(attr.unit || '');
    setAttrFilterable(attr.filterable !== false);
    setAttrShowInProductPage(attr.showInProductPage !== false);
    setAttrRequired(Boolean(attr.required));
    setAttrSortOrder(attr.sortOrder || 0);
    setIsAttrModalOpen(true);
  };

  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrName.trim() || !attrKey.trim()) return;

    const parsedOptions =
      attrType === 'select' || attrType === 'multiselect'
        ? attrOptionsText
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const payload: Omit<CategoryAttribute, 'id'> = {
      name: attrName.trim(),
      key: attrKey.trim(),
      categoryId: attrCategoryId,
      type: attrType,
      options: parsedOptions,
      unit: attrUnit.trim() || undefined,
      filterable: attrFilterable,
      showInProductPage: attrShowInProductPage,
      required: attrRequired,
      sortOrder: Number(attrSortOrder) || 0
    };

    if (editingAttribute) {
      await onUpdateAttribute(editingAttribute.id, payload);
    } else {
      await onCreateAttribute(payload);
    }
    setIsAttrModalOpen(false);
  };

  const handleDeleteAttribute = async (attr: CategoryAttribute) => {
    if (window.confirm(`آیا از حذف ویژگی «${attr.name}» اطمینان دارید؟`)) {
      await onDeleteAttribute(attr.id);
    }
  };

  // -------------------------------------------------------------
  // Hierarchical Computation & Search Filter
  // -------------------------------------------------------------
  const getSubcategories = (parentId: string) =>
    categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Compute total product count for a category including all its descendants
  const getSubtreeProductCount = (catId: string): number => {
    const descendantIds = getDescendantIds(catId, categories);
    descendantIds.add(catId);
    return products.filter(
      (p) => p.status !== 'archived' && (descendantIds.has(p.categoryId) || p.relatedCategoryIds?.some((id) => descendantIds.has(id)))
    ).length;
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = cat.title.toLowerCase().includes(q);
        const matchesSlug = cat.slug.toLowerCase().includes(q);
        const matchesDesc = cat.description ? cat.description.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesSlug && !matchesDesc) return false;
      }
      // 2. Level filter
      if (levelFilter === 'root' && cat.parentId) return false;
      if (levelFilter === 'sub' && !cat.parentId) return false;
      // 3. Status filter
      if (statusFilter === 'active' && cat.active === false) return false;
      if (statusFilter === 'inactive' && cat.active !== false) return false;
      // 4. Menu filter
      if (menuFilter === 'mainMenu' && cat.showInMainMenu === false) return false;
      if (menuFilter === 'home' && cat.showInHome === false) return false;
      if (menuFilter === 'footer' && cat.showInFooter === false) return false;

      return true;
    });
  }, [categories, searchQuery, levelFilter, statusFilter, menuFilter]);

  const rootCategories = useMemo(() => {
    return categories
      .filter((c) => !c.parentId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [categories]);

  // Multi-level recursive category tree item renderer
  const renderCategoryNode = (cat: Category, depth: number = 0, isLastChild: boolean = false) => {
    const directProductCount = products.filter(
      (p) => p.categoryId === cat.id && p.status !== 'archived'
    ).length;
    const totalSubtreeProducts = getSubtreeProductCount(cat.id);
    const subcats = getSubcategories(cat.id);
    const isRoot = !cat.parentId;

    return (
      <div key={cat.id} className="relative group">
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
            isRoot
              ? 'bg-white border-[#BFDDF0] shadow-xs hover:border-[#111110]/40'
              : depth === 1
              ? 'bg-[#F4FAFE]/80 border-[#BFDDF0]/80 mr-4 sm:mr-8 my-1.5'
              : 'bg-white border-[#BFDDF0]/60 mr-8 sm:mr-16 my-1.5'
          } ${cat.active === false ? 'opacity-65 bg-gray-50/70 border-dashed' : ''}`}
        >
          {/* Category Info & Hierarchy Guide */}
          <div className="flex items-center gap-3">
            {/* Tree Indentation Marker */}
            {depth > 0 && (
              <span className="text-[#4A5560]/60 text-xs font-mono select-none hidden sm:inline">
                {depth === 1 ? '↳' : '↳↳'}
              </span>
            )}

            {/* Thumbnail / Icon */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-[#BFDDF0] bg-white shrink-0 flex items-center justify-center relative shadow-2xs">
              {cat.image ? (
                <img src={cat.image} alt={cat.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#E4F5FF] text-[#111110]">
                  <CategoryIconViewer icon={cat.icon} className="w-5 h-5 text-[#111110]" />
                </div>
              )}
            </div>

            {/* Title, Badges & Slug */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[#111110] flex items-center gap-1.5">
                  <CategoryIconViewer icon={cat.icon} className="w-4 h-4 text-[#4A5560]" />
                  <span>{cat.title}</span>
                </span>

                <span className="text-[10px] font-mono text-[#4A5560] bg-white/90 px-2 py-0.5 rounded-md border border-[#BFDDF0] dir-ltr">
                  /{cat.slug}
                </span>

                {/* Level Badge with MegaMenu role */}
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                  depth === 0
                    ? 'bg-rose-50 text-[#ef4056] border border-rose-200'
                    : depth === 1
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'bg-gray-100 text-[#4A5560]'
                }`}>
                  {depth === 0
                    ? 'دسته اصلی (ستون راست مگامنو)'
                    : depth === 1
                    ? 'عنوان ستون (خط قرمز مگامنو)'
                    : 'لینک زیرمجموعه مگامنو'}
                </span>

                {/* Status Badge */}
                {cat.active === false ? (
                  <span className="text-[10px] bg-[#A33A3A]/10 text-[#A33A3A] px-2 py-0.5 rounded-md font-medium border border-[#A33A3A]/20">
                    غیرفعال
                  </span>
                ) : (
                  <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-medium border border-green-200">
                    فعال و منتشر
                  </span>
                )}
              </div>

              {/* Sub-line: Products, Menu Badges, SEO title */}
              <div className="flex items-center gap-2.5 text-[11px] text-[#4A5560] flex-wrap">
                <span className="flex items-center gap-1 font-persian-nums text-[#111110] font-medium">
                  <Package className="w-3.5 h-3.5 text-[#4A5560]" />
                  <span>{formatPersianNumber(directProductCount)} محصول مستقیم</span>
                  {subcats.length > 0 && directProductCount !== totalSubtreeProducts && (
                    <span className="text-[#4A5560] text-[10px]">
                      (مجموع زیردسته‌ها: {formatPersianNumber(totalSubtreeProducts)})
                    </span>
                  )}
                </span>

                {subcats.length > 0 && (
                  <span className="text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                    {formatPersianNumber(subcats.length)} زیر‌دسته
                  </span>
                )}

                {cat.showInMainMenu !== false && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-700 bg-white px-1.5 py-0.5 rounded border border-gray-200" title="نمایش در منوی بالای سایت">
                    <MenuIcon className="w-3 h-3 text-green-600" /> منو
                  </span>
                )}

                {cat.showInHome !== false && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-700 bg-white px-1.5 py-0.5 rounded border border-gray-200" title="نمایش در صفحه اصلی">
                    <HomeIcon className="w-3 h-3 text-blue-600" /> صفحه اول
                  </span>
                )}

                {cat.showInFooter !== false && (
                  <span className="text-[10px] text-gray-500 hidden md:inline">
                    · فوتر
                  </span>
                )}

                {cat.seoTitle && (
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 hidden lg:inline truncate max-w-[180px]" title={`سئو: ${cat.seoTitle}`}>
                    سئو تنظیم‌شده
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            
            {/* Quick Reorder Up / Down */}
            <div className="flex items-center border border-[#BFDDF0] rounded-xl bg-white overflow-hidden shadow-2xs">
              <button
                onClick={(e) => handleMoveSort(cat, 'up', e)}
                className="p-1.5 text-[#4A5560] hover:text-[#111110] hover:bg-gray-100 transition-colors cursor-pointer"
                title="افزایش اولویت (حرکت به بالا)"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <div className="w-[1px] h-3.5 bg-[#BFDDF0]" />
              <button
                onClick={(e) => handleMoveSort(cat, 'down', e)}
                className="p-1.5 text-[#4A5560] hover:text-[#111110] hover:bg-gray-100 transition-colors cursor-pointer"
                title="کاهش اولویت (حرکت به پایین)"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Active Toggle */}
            <button
              onClick={(e) => handleToggleActive(cat, e)}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs ${
                cat.active === false
                  ? 'border-[#A33A3A]/40 text-[#A33A3A] bg-red-50 hover:bg-red-100'
                  : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
              }`}
              title={cat.active === false ? 'فعال‌سازی دسته‌بندی' : 'غیرفعال‌سازی دسته‌بندی'}
            >
              {cat.active === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {/* Add Subcategory Directly Under This Category */}
            <button
              onClick={() => openCreateCategory(cat.id)}
              className="px-2.5 py-1.5 rounded-xl border border-[#BFDDF0] bg-white text-xs text-[#111110] hover:bg-gray-50 flex items-center gap-1 cursor-pointer shadow-2xs"
              title={`افزودن زیردسته مستقیم به «${cat.title}»`}
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden xl:inline text-[11px]">زیر‌دسته جدید</span>
            </button>

            {/* Filter Products */}
            <button
              onClick={() => onFilterProductsByCategory(cat.id)}
              className="px-2.5 py-1.5 rounded-xl border border-[#BFDDF0] bg-white text-xs text-[#111110] hover:bg-gray-50 flex items-center gap-1 cursor-pointer shadow-2xs"
              title="مشاهده کالاهای اختصاصی این دسته در پنل کالاها"
            >
              <Package className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">کالاها</span>
            </button>

            {/* Edit Category */}
            <button
              onClick={() => openEditCategory(cat)}
              className="p-2 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] hover:bg-gray-100 transition-colors cursor-pointer shadow-2xs"
              title="ویرایش کامل دسته‌بندی و سئو"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Safe Delete Category */}
            <button
              onClick={() => promptDeleteCategory(cat)}
              className="p-2 rounded-xl border border-[#A33A3A]/30 text-[#A33A3A] bg-white hover:bg-[#A33A3A]/10 transition-colors cursor-pointer shadow-2xs"
              title="حذف دسته‌بندی با امکان انتقال امن کالاها"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recursive Subcategories Container */}
        {subcats.length > 0 && (
          <div className="relative pr-3 border-r-2 border-[#BFDDF0]/70 mr-3 my-1">
            {subcats.map((child, index) =>
              renderCategoryNode(child, depth + 1, index === subcats.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Filtered attributes
  const filteredAttributes =
    attrFilterCategory === 'all'
      ? categoryAttributes
      : categoryAttributes.filter((a) => a.categoryId === 'all' || a.categoryId === attrFilterCategory);

  const TYPE_LABELS: Record<AttributeType, string> = {
    text: 'متن ساده',
    number: 'عددی',
    select: 'تک‌انتخابی (Dropdown)',
    multiselect: 'چندانتخابی',
    color: 'انتخاب رنگ',
    boolean: 'بولی (بله/خیر)'
  };

  return (
    <div className="space-y-6 text-right font-sans">
      
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#BFDDF0]">
        <div>
          <h2 className="text-xl font-bold text-[#111110] flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#111110]" />
            <span>مدیریت ساختار دسته‌ها و ویژگی‌های چندمنظوره MORICO</span>
          </h2>
          <span className="text-xs text-[#4A5560] mt-1 block">
            تعریف دسته‌بندی‌های چندسطحی پویا برای کالای دیجیتال، دکوراسیون، مد، اکسسوری و هر گروه دلخواه بدون محدودیت در کد
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateQuickCategories && (
            <button
              type="button"
              onClick={onNavigateQuickCategories}
              className="px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="تنظیم ردیف آیکون‌های گرد دسته‌بندی در صفحه اصلی"
            >
              <Grid className="w-4 h-4" />
              <span>ردیف دسته‌بندی‌های صفحه اصلی</span>
            </button>
          )}

          {activeSubTab === 'categories' ? (
            <button
              onClick={() => openCreateCategory()}
              className="px-4 py-2.5 rounded-xl bg-[#111110] text-[#FFFFFF] text-xs font-semibold hover:bg-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن دسته‌بندی جدید</span>
            </button>
          ) : (
            <button
              onClick={openCreateAttribute}
              className="px-4 py-2.5 rounded-xl bg-[#111110] text-[#FFFFFF] text-xs font-semibold hover:bg-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن ویژگی جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtabs navigation: Categories Tree vs Custom Attributes */}
      <div className="flex items-center gap-2 border-b border-[#BFDDF0]">
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'categories'
              ? 'border-[#111110] text-[#111110]'
              : 'border-transparent text-[#4A5560] hover:text-[#111110]'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>دسته‌بندی‌ها و درخت محصولات ({formatPersianNumber(categories.length)})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('attributes')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'attributes'
              ? 'border-[#111110] text-[#111110]'
              : 'border-transparent text-[#4A5560] hover:text-[#111110]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>ویژگی‌های فنی و فیلترهای اختصاصی ({formatPersianNumber(categoryAttributes.length)})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CATEGORIES TREE & LIST                             */}
      {/* ========================================================= */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          
          {/* MegaMenu Digikala Architecture Guide */}
          <div className="bg-gradient-to-r from-rose-50/70 via-white to-amber-50/50 rounded-2xl border border-rose-200/80 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-right">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4056] animate-pulse" />
                <h4 className="text-xs sm:text-sm font-black text-neutral-900">
                  راهنمای ساختار مگامنو دیجیکالایی فروشگاه موریکو
                </h4>
                <span className="text-[10px] bg-rose-100 text-[#ef4056] px-2 py-0.5 rounded-md font-bold">
                  چندستونه هوشمند
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed max-w-4xl">
                • <strong>سطح ۱ (دسته‌های ریشه):</strong> در ستون عمودی سمت راست مگامنو با آیکون اختصاصی ظاهر شده و با هاور/کلیک به رنگ قرمز درمی‌آیند.<br />
                • <strong>سطح ۲ (زیردسته‌های سطح ۱):</strong> ستون‌های داخلی مگامنو را با عنوان درشت و خط قرمز عمودی تشکیل می‌دهند (مثل «انتخاب موبایل»، «لوازم جانبی»، «گوشی براساس قیمت»، «داغ‌ترین‌ها»).<br />
                • <strong>سطح ۳ (زیردسته‌های سطح ۲):</strong> به صورت فهرست لینک‌های خاکستری‌رنگ زیر هر عنوان ستون قرار می‌گیرند.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openCreateCategory()}
              className="px-3.5 py-2 rounded-xl bg-[#ef4056] text-white text-xs font-bold hover:bg-[#d72c41] transition-colors shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن دسته اصلی جدید</span>
            </button>
          </div>

          {/* Search, Filter Bar and Stats */}
          <div className="bg-white rounded-2xl border border-[#BFDDF0] p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#4A5560] absolute right-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در عنوان، نامک یا توضیحات..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter by Level */}
              <div>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none focus:border-[#111110]"
                >
                  <option value="all">همه سطوح (اصلی و زیر‌دسته‌ها)</option>
                  <option value="root">فقط دسته‌های اصلی (سطح ۱)</option>
                  <option value="sub">فقط زیر‌دسته‌ها (سطح ۲ و بالاتر)</option>
                </select>
              </div>

              {/* Filter by Active Status */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none focus:border-[#111110]"
                >
                  <option value="all">همه وضعیت‌ها (فعال و غیرفعال)</option>
                  <option value="active">فقط دسته‌های فعال</option>
                  <option value="inactive">فقط دسته‌های غیرفعال</option>
                </select>
              </div>

              {/* Filter by Menu placement */}
              <div>
                <select
                  value={menuFilter}
                  onChange={(e) => setMenuFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none focus:border-[#111110]"
                >
                  <option value="all">همه محل‌های نمایش</option>
                  <option value="mainMenu">فقط دارای نمایش در منوی هدر</option>
                  <option value="home">فقط دارای نمایش در صفحه اصلی</option>
                  <option value="footer">فقط دارای نمایش در فوتر</option>
                </select>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[#BFDDF0]/60 text-xs text-[#4A5560] flex-wrap gap-2">
              <div className="flex items-center gap-4 flex-wrap font-persian-nums">
                <span>
                  کل دسته‌ها: <strong className="text-[#111110]">{formatPersianNumber(categories.length)}</strong>
                </span>
                <span>
                  دسته‌های ریشه: <strong className="text-[#111110]">{formatPersianNumber(rootCategories.length)}</strong>
                </span>
                <span>
                  زیر‌دسته‌ها: <strong className="text-[#111110]">{formatPersianNumber(categories.length - rootCategories.length)}</strong>
                </span>
                <span>
                  فعال: <strong className="text-green-700">{formatPersianNumber(categories.filter((c) => c.active !== false).length)}</strong>
                </span>
              </div>

              {(searchQuery || levelFilter !== 'all' || statusFilter !== 'all' || menuFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setLevelFilter('all');
                    setStatusFilter('all');
                    setMenuFilter('all');
                  }}
                  className="text-xs text-blue-700 hover:underline cursor-pointer"
                >
                  پاکسازی فیلترها (نمایش {formatPersianNumber(filteredCategories.length)} نتیجه)
                </button>
              )}
            </div>
          </div>

          {/* Tree Rendering Container */}
          <div className="space-y-3">
            {filteredCategories.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#BFDDF0] p-8 text-center text-[#4A5560]">
                <FolderTree className="w-10 h-10 mx-auto text-[#4A5560]/40 mb-2" />
                <p className="text-sm font-bold text-[#111110]">هیچ دسته‌بندی مطابق با فیلترها یافت نشد.</p>
                <p className="text-xs text-[#4A5560] mt-1">می‌توانید فیلترها را ریست کنید یا دسته‌بندی جدیدی اضافه نمایید.</p>
              </div>
            ) : searchQuery || levelFilter !== 'all' || statusFilter !== 'all' || menuFilter !== 'all' ? (
              /* Flat Filtered List when searching or filtering */
              <div className="space-y-2.5">
                {filteredCategories.map((cat) => renderCategoryNode(cat, cat.parentId ? 1 : 0))}
              </div>
            ) : (
              /* Full Hierarchical Tree View */
              <div className="space-y-3">
                {rootCategories.map((root) => renderCategoryNode(root, 0))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CUSTOM ATTRIBUTES PER CATEGORY                     */}
      {/* ========================================================= */}
      {activeSubTab === 'attributes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#BFDDF0]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#111110]">فیلتر ویژگی‌ها بر اساس دسته:</span>
              <select
                value={attrFilterCategory}
                onChange={(e) => setAttrFilterCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? '↳ ' : ''}{c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-[#4A5560] font-persian-nums">
              نمایش {formatPersianNumber(filteredAttributes.length)} ویژگی اختصاصی
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAttributes.map((attr) => {
              const catObj = categories.find((c) => c.id === attr.categoryId);
              const catTitle = attr.categoryId === 'all' ? 'عمومی (تمام دسته‌ها)' : catObj?.title || attr.categoryId;

              return (
                <div
                  key={attr.id}
                  className="bg-white rounded-2xl border border-[#BFDDF0] p-4 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#111110]">{attr.name}</span>
                      <span className="text-[10px] font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                        {attr.key}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#4A5560] space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-700">دسته مربوطه:</span>
                        <span className="bg-[#E4F5FF] text-[#111110] px-2 py-0.5 rounded-md font-medium text-[10px]">
                          {catTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-700">نوع داده:</span>
                        <span>{TYPE_LABELS[attr.type] || attr.type}</span>
                        {attr.unit && <span className="text-gray-400">({attr.unit})</span>}
                      </div>
                    </div>

                    {attr.options && attr.options.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1">
                        {attr.options.map((opt, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#BFDDF0]/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      {attr.filterable && (
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium border border-green-200">
                          فیلترپذیر
                        </span>
                      )}
                      {attr.showInProductPage && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-200">
                          صفحه محصول
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditAttribute(attr)}
                        className="p-1.5 rounded-lg border border-[#BFDDF0] text-[#111110] hover:bg-gray-50 cursor-pointer"
                        title="ویرایش ویژگی"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAttribute(attr)}
                        className="p-1.5 rounded-lg border border-[#A33A3A]/30 text-[#A33A3A] hover:bg-[#A33A3A]/10 cursor-pointer"
                        title="حذف ویژگی"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT CATEGORY WITH PREVENT CIRCULAR LOOPS */}
      {/* ========================================================= */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#BFDDF0] max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative text-right flex flex-col">
            
            <button
              onClick={() => setIsCatModalOpen(false)}
              className="absolute top-4 left-4 p-1.5 rounded-xl border border-[#BFDDF0] hover:bg-gray-100 text-[#111110] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-[#111110] mb-3">
              {editingCategory ? `ویرایش دسته‌بندی «${editingCategory.title}»` : 'تعریف دسته‌بندی جدید در MORICO'}
            </h3>

            {/* Modal Tabs: General vs SEO */}
            <div className="flex items-center gap-2 border-b border-[#BFDDF0] pb-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveModalTab('general')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  activeModalTab === 'general' ? 'bg-[#111110] text-white' : 'text-[#4A5560] hover:bg-gray-100'
                }`}
              >
                مشخصات اصلی و والد
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('seo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeModalTab === 'seo' ? 'bg-[#111110] text-white' : 'text-[#4A5560] hover:bg-gray-100'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>سئو و پیش‌نمایش در گوگل</span>
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              {activeModalTab === 'general' && (
                <div className="space-y-4">
                  
                  {/* Category Title */}
                  <div>
                    <label className="text-xs font-bold text-[#111110] block mb-1">
                      عنوان دسته‌بندی
                    </label>
                    <input
                      type="text"
                      required
                      value={catTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="مثال: کالای دیجیتال، تجهیزات صوتی، دکوراسیون، ساعت هوشمند..."
                      className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none"
                    />
                  </div>

                  {/* Slug and Parent Hierarchy */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#111110] block mb-1">
                        نامک و آدرس اختصاصی (Slug)
                      </label>
                      <input
                        type="text"
                        required
                        value={catSlug}
                        onChange={(e) => setCatSlug(e.target.value)}
                        placeholder="audio-headphones"
                        className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs font-mono focus:border-[#111110] outline-none dir-ltr"
                      />
                      <span className="text-[10px] text-[#4A5560] mt-0.5 block">
                        مسیر دسترسی: /catalog?cat={catSlug || 'slug'}
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#111110] block mb-1">
                        دسته‌بندی والد (ساختار درختی چندسطحی)
                      </label>
                      <select
                        value={catParentId}
                        onChange={(e) => setCatParentId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] focus:border-[#111110] outline-none"
                      >
                        <option value="">دسته اصلی و ریشه (بدون والد)</option>
                        {categories.map((c) => {
                          const isInvalid = invalidParentIds.has(c.id);
                          return (
                            <option
                              key={c.id}
                              value={c.id}
                              disabled={isInvalid}
                            >
                              {c.parentId ? '↳ ' : ''}{c.title}
                              {isInvalid ? ' (غیرقابل انتخاب - ایجاد حلقه)' : ''}
                            </option>
                          );
                        })}
                      </select>
                      {editingCategory && (
                        <span className="text-[10px] text-blue-700 mt-0.5 block">
                          برای جلوگیری از حلقه در درخت، خود دسته و زیردسته‌های آن غیرفعال هستند.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Icon Selector Grid */}
                  <div>
                    <label className="text-xs font-bold text-[#111110] block mb-1.5 flex items-center justify-between">
                      <span>انتخاب آیکون دسته‌بندی (اختیاری)</span>
                      {catIcon && (
                        <button
                          type="button"
                          onClick={() => setCatIcon('')}
                          className="text-[10px] text-red-600 hover:underline cursor-pointer"
                        >
                          حذف آیکون
                        </button>
                      )}
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2.5 rounded-xl border border-[#BFDDF0] bg-gray-50/60 max-h-36 overflow-y-auto">
                      {ICON_PRESETS.map((p) => {
                        const IconComp = p.icon;
                        const isSelected = catIcon === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setCatIcon(p.id)}
                            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#111110] text-white ring-2 ring-[#111110]'
                                : 'bg-white hover:bg-[#E4F5FF] text-[#4A5560] border border-[#BFDDF0]/60'
                            }`}
                            title={p.name}
                          >
                            <IconComp className="w-4 h-4" />
                            <span className="text-[8px] truncate max-w-full">{p.name.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold text-[#111110] block mb-1">توضیحات دسته‌بندی</label>
                    <textarea
                      rows={2}
                      value={catDescription}
                      onChange={(e) => setCatDescription(e.target.value)}
                      placeholder="توضیح کوتاه درباره کالاهای این گروه برای سئو و هدر صفحه دسته‌بندی..."
                      className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none resize-none"
                    />
                  </div>

                  {/* Media Uploaders */}
                  <div className="space-y-3">
                    <ImageUploader
                      label="تصویر شاخص یا کاور دسته‌بندی (مربع یا مستطیل)"
                      currentImage={catImage}
                      onChange={(url) => setCatImage(url)}
                    />

                    <ImageUploader
                      label="بنر عریض هدر صفحه دسته‌بندی (اختیاری)"
                      currentImage={catBanner}
                      onChange={(url) => setCatBanner(url)}
                    />
                  </div>

                  {/* Sort order & Display Checkboxes */}
                  <div className="pt-2 border-t border-[#BFDDF0]/60 space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-[#111110] shrink-0">
                        ترتیب و اولویت نمایش:
                      </label>
                      <input
                        type="number"
                        value={catSortOrder}
                        onChange={(e) => setCatSortOrder(Number(e.target.value))}
                        className="w-24 px-3 py-1.5 rounded-xl border border-[#BFDDF0] text-xs text-center font-bold"
                      />
                      <span className="text-[11px] text-[#4A5560]">
                        (اعداد کوچک‌تر ابتدا نمایش داده می‌شوند)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#BFDDF0] text-xs cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={catActive}
                          onChange={(e) => setCatActive(e.target.checked)}
                          className="rounded text-[#111110]"
                        />
                        <span className="font-semibold">فعال بودن</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#BFDDF0] text-xs cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={catShowInMainMenu}
                          onChange={(e) => setCatShowInMainMenu(e.target.checked)}
                          className="rounded text-[#111110]"
                        />
                        <span>منوی اصلی هدر</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#BFDDF0] text-xs cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={catShowInHome}
                          onChange={(e) => setCatShowInHome(e.target.checked)}
                          className="rounded text-[#111110]"
                        />
                        <span>صفحه اصلی سایت</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#BFDDF0] text-xs cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={catShowInFooter}
                          onChange={(e) => setCatShowInFooter(e.target.checked)}
                          className="rounded text-[#111110]"
                        />
                        <span>فوتر سایت</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SEO Tab */}
              {activeModalTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#111110] block mb-1">
                      عنوان صفحه و سئو (Meta Title)
                    </label>
                    <input
                      type="text"
                      value={catSeoTitle}
                      onChange={(e) => setCatSeoTitle(e.target.value)}
                      placeholder="خرید انواع هدفون و تجهیزات صوتی اصل | فروشگاه موریکو"
                      className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none"
                    />
                    <span className="text-[10px] text-[#4A5560] mt-0.5 block">
                      طول پیشنهادی: بین ۵۰ تا ۶۰ کاراکتر
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#111110] block mb-1">
                      توضیحات متای سئو (Meta Description)
                    </label>
                    <textarea
                      rows={3}
                      value={catSeoDescription}
                      onChange={(e) => setCatSeoDescription(e.target.value)}
                      placeholder="بررسی، مشخصات فنی و خرید آنلاین انواع محصولات این دسته با بهترین قیمت و ضمانت بازگشت در فروشگاه موریکو."
                      className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none resize-none"
                    />
                    <span className="text-[10px] text-[#4A5560] mt-0.5 block">
                      طول پیشنهادی: بین ۱۲۰ تا ۱۶۰ کاراکتر
                    </span>
                  </div>

                  {/* Google SERP Preview Card */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-1 text-right">
                    <span className="text-[11px] font-bold text-gray-400 block mb-1">
                      پیش‌نمایش در نتایج جستجوی گوگل (SERP Snippet):
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-[#202124] dir-ltr text-left">
                      <span className="text-[#202124] font-medium">https://morico.style</span>
                      <span className="text-gray-400">› catalog › {catSlug || 'category'}</span>
                    </div>
                    <h4 className="text-base text-[#1a0dab] font-medium hover:underline cursor-pointer leading-snug">
                      {catSeoTitle || `${catTitle || 'دسته‌بندی جدید'} | فروشگاه موریکو`}
                    </h4>
                    <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                      {catSeoDescription ||
                        catDescription ||
                        `مشاهده و خرید جدیدترین محصولات ${catTitle || ''} با ضمانت اصالت کالا و ارسال سریع در فروشگاه جامع موریکو.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#BFDDF0]">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#BFDDF0] text-xs hover:bg-gray-100 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#111110] text-white text-xs font-semibold hover:bg-black cursor-pointer shadow-sm"
                >
                  {editingCategory ? 'ثبت تغییرات دسته‌بندی' : 'ایجاد دسته‌بندی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SAFE CATEGORY DELETION & PRODUCT REASSIGNMENT      */}
      {/* ========================================================= */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#BFDDF0] max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-right space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#A33A3A]/10 text-[#A33A3A] shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111110]">
                  حذف دسته‌بندی «{categoryToDelete.title}»
                </h3>
                <p className="text-xs text-[#4A5560] mt-1 leading-relaxed">
                  {(() => {
                    const count = products.filter(
                      (p) => p.categoryId === categoryToDelete.id && p.status !== 'archived'
                    ).length;
                    const childCats = categories.filter((c) => c.parentId === categoryToDelete.id);

                    if (count > 0 && childCats.length > 0) {
                      return `این دسته‌بندی دارای ${formatPersianNumber(count)} محصول فعال و ${formatPersianNumber(childCats.length)} زیر‌دسته است. برای جلوگیری از حذف ناخواسته محصولات، سیستم تمام محصولات این دسته را به‌طور خودکار به دسته‌بندی انتخابی شما منتقل می‌کند و زیر‌دسته‌ها را به شاخه بالاتر انتقال می‌دهد.`;
                    }
                    if (count > 0) {
                      return `این دسته‌بندی در حال حاضر دارای ${formatPersianNumber(count)} محصول فعال است. قبل از حذف، محصولات را به دسته‌بندی دیگری منتقل کنید.`;
                    }
                    if (childCats.length > 0) {
                      return `این دسته‌بندی دارای ${formatPersianNumber(childCats.length)} زیر‌دسته است. با حذف آن، زیر‌دسته‌ها به دسته بالاتر (یا ریشه) منتقل خواهند شد.`;
                    }
                    return 'این دسته‌بندی محصول فعالی ندارد و می‌توانید آن را بدون مشکل حذف نمایید.';
                  })()}
                </p>
              </div>
            </div>

            {/* If has products, show reassign dropdown */}
            {products.filter((p) => p.categoryId === categoryToDelete.id && p.status !== 'archived').length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <label className="text-xs font-bold text-amber-950 block">
                  دسته‌بندی مقصد برای انتقال خودکار محصولات:
                </label>
                <select
                  value={reassignTargetCatId}
                  onChange={(e) => setReassignTargetCatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white text-[#111110] outline-none"
                >
                  {categories
                    .filter((c) => c.id !== categoryToDelete.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parentId ? '↳ ' : ''}{c.title}
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-amber-800 block">
                  محصولات به این دسته‌بندی منتقل شده و شناسه دسته آنها بروزرسانی خواهد شد.
                </span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#BFDDF0]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#BFDDF0] text-xs hover:bg-gray-100 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-[#A33A3A] text-white text-xs font-semibold hover:bg-red-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'در حال حذف...' : 'تایید و حذف دسته‌بندی'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT CUSTOM ATTRIBUTE                     */}
      {/* ========================================================= */}
      {isAttrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#BFDDF0] max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative text-right">
            <button
              onClick={() => setIsAttrModalOpen(false)}
              className="absolute top-4 left-4 p-1.5 rounded-xl border border-[#BFDDF0] hover:bg-gray-100 text-[#111110] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-[#111110] mb-4">
              {editingAttribute ? `ویرایش ویژگی «${editingAttribute.name}»` : 'تعریف ویژگی جدید برای دسته‌بندی'}
            </h3>

            <form onSubmit={handleSaveAttribute} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#111110] block mb-1">
                  نام نمایشی ویژگی
                </label>
                <input
                  type="text"
                  required
                  value={attrName}
                  onChange={(e) => {
                    setAttrName(e.target.value);
                    if (!editingAttribute) {
                      setAttrKey(
                        e.target.value
                          .trim()
                          .toLowerCase()
                          .replace(/[^a-zA-Z0-9]/g, '_')
                      );
                    }
                  }}
                  placeholder="مثال: میزان شارژدهی، جنس بدنه، حافظه، نوع اتصال..."
                  className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111110] block mb-1">
                    کلید سیستمی (Key)
                  </label>
                  <input
                    type="text"
                    required
                    value={attrKey}
                    onChange={(e) => setAttrKey(e.target.value)}
                    placeholder="battery_life"
                    className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs font-mono focus:border-[#111110] outline-none dir-ltr"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111110] block mb-1">
                    دسته‌بندی مربوطه
                  </label>
                  <select
                    value={attrCategoryId}
                    onChange={(e) => setAttrCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] focus:border-[#111110] outline-none"
                  >
                    <option value="all">عمومی (تمام دسته‌ها)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parentId ? '↳ ' : ''}{c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111110] block mb-1">
                    نوع فیلد (Data Type)
                  </label>
                  <select
                    value={attrType}
                    onChange={(e) => setAttrType(e.target.value as AttributeType)}
                    className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] focus:border-[#111110] outline-none"
                  >
                    <option value="text">متن آزاد (Text)</option>
                    <option value="number">عدد (Number)</option>
                    <option value="select">انتخابی تک‌گزینه‌ای (Select)</option>
                    <option value="multiselect">چندگزینه‌ای (Multi-select)</option>
                    <option value="color">رنگ (Color)</option>
                    <option value="boolean">بولی / بله یا خیر (Boolean)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111110] block mb-1">
                    واحد سنجش (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={attrUnit}
                    onChange={(e) => setAttrUnit(e.target.value)}
                    placeholder="مثال: ساعت، سانتی‌متر، گیگابایت، گرم"
                    className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none"
                  />
                </div>
              </div>

              {/* Options for Select / Multiselect */}
              {(attrType === 'select' || attrType === 'multiselect') && (
                <div>
                  <label className="text-xs font-bold text-[#111110] block mb-1">
                    گزینه‌های انتخابی (هر خط یک گزینه)
                  </label>
                  <textarea
                    rows={3}
                    value={attrOptionsText}
                    onChange={(e) => setAttrOptionsText(e.target.value)}
                    placeholder="گزینه اول&#10;گزینه دوم&#10;گزینه سوم"
                    className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none resize-none font-sans"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#BFDDF0]/60">
                <label className="flex items-center gap-2 p-2 rounded-xl border border-[#BFDDF0] text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attrFilterable}
                    onChange={(e) => setAttrFilterable(e.target.checked)}
                    className="rounded text-[#111110]"
                  />
                  <span>نمایش در فیلترها</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl border border-[#BFDDF0] text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attrShowInProductPage}
                    onChange={(e) => setAttrShowInProductPage(e.target.checked)}
                    className="rounded text-[#111110]"
                  />
                  <span>مشخصات فنی کالا</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl border border-[#BFDDF0] text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attrRequired}
                    onChange={(e) => setAttrRequired(e.target.checked)}
                    className="rounded text-[#111110]"
                  />
                  <span>اجباری بودن</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#BFDDF0]">
                <button
                  type="button"
                  onClick={() => setIsAttrModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#BFDDF0] text-xs hover:bg-gray-100 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#111110] text-white text-xs font-semibold hover:bg-black cursor-pointer shadow-sm"
                >
                  {editingAttribute ? 'ثبت تغییرات ویژگی' : 'ایجاد ویژگی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
