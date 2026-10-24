import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Search,
  X,
  Crosshair,
  Plus,
  Minus,
  MapPin,
  User,
  Phone,
  Mail,
  Home,
  Building,
  Hash,
  ArrowRight,
  CheckCircle2,
  Navigation,
  Edit3,
  Radio,
  AlertCircle,
  Loader2
} from 'lucide-react';

export interface LocationData {
  city: string;
  province?: string;
  address?: string;
  lat: number;
  lng: number;
  fullName?: string;
  phone?: string;
  postalCode?: string;
  pelak?: string;
  block?: string;
  unit?: string;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: LocationData) => void;
  initialCity?: string;
}

// User-provided Parsimap Token
const PARSIMAP_TOKEN = 'p1eab7d89a70cc447b8cb3fae84daf7765260506dc';
// Default direct Parsimap raster tile url with session key derived from styles API
const PARSIMAP_DIRECT_TILE = `https://api.parsimap.ir/tile/parsimap-streets-v11-raster/{z}/{x}/{y}?key=${PARSIMAP_TOKEN}84aea9ac`;

// Major cities in Iran with precise coordinates
const IRAN_CITIES = [
  { city: 'تهران', province: 'تهران', lat: 35.6892, lng: 51.3890 },
  { city: 'اصفهان', province: 'اصفهان', lat: 32.6546, lng: 51.6680 },
  { city: 'مشهد', province: 'خراسان رضوی', lat: 36.2972, lng: 59.6067 },
  { city: 'شیراز', province: 'فارس', lat: 29.5918, lng: 52.5837 },
  { city: 'تبریز', province: 'آذربایجان شرقی', lat: 38.0800, lng: 46.2919 },
  { city: 'کرج', province: 'البرز', lat: 35.8400, lng: 50.9391 },
  { city: 'قم', province: 'قم', lat: 34.6401, lng: 50.8764 },
  { city: 'اهواز', province: 'خوزستان', lat: 31.3183, lng: 48.6706 },
  { city: 'رشت', province: 'گیلان', lat: 37.2808, lng: 49.5832 },
  { city: 'کرمانشاه', province: 'کرمانشاه', lat: 34.3142, lng: 47.0650 },
  { city: 'ارومیه', province: 'آذربایجان غربی', lat: 37.5528, lng: 45.0761 },
  { city: 'یزد', province: 'یزد', lat: 31.8974, lng: 54.3569 },
  { city: 'زنجان', province: 'زنجان', lat: 36.6736, lng: 48.4787 },
  { city: 'سنندج', province: 'کردستان', lat: 35.3219, lng: 46.9862 },
  { city: 'قزوین', province: 'قزوین', lat: 36.2797, lng: 50.0049 },
  { city: 'ساری', province: 'مازندران', lat: 36.5633, lng: 53.0601 },
  { city: 'گرگان', province: 'گلستان', lat: 36.8427, lng: 54.4439 },
  { city: 'بوشهر', province: 'بوشهر', lat: 28.9220, lng: 50.8338 },
  { city: 'بندرعباس', province: 'هرمزگان', lat: 27.1832, lng: 56.2666 },
  { city: 'کرمان', province: 'کرمان', lat: 30.2839, lng: 57.0834 },
  { city: 'همدان', province: 'همدان', lat: 34.7982, lng: 48.5146 },
  { city: 'اراک', province: 'مرکزی', lat: 34.0954, lng: 49.7013 },
  { city: 'بیرجند', province: 'خراسان جنوبی', lat: 32.8663, lng: 59.2211 },
  { city: 'بجنورد', province: 'خراسان شمالی', lat: 37.4747, lng: 57.3290 },
  { city: 'خرم‌آباد', province: 'لرستان', lat: 33.4878, lng: 48.3558 },
  { city: 'سمنان', province: 'سمنان', lat: 35.5769, lng: 53.3972 },
  { city: 'یاسوج', province: 'کهگیلویه و بویراحمد', lat: 30.6684, lng: 51.5876 },
  { city: 'شهرکرد', province: 'چهارمحال و بختیاری', lat: 32.3256, lng: 50.8644 },
  { city: 'ایلام', province: 'ایلام', lat: 33.6374, lng: 46.4227 },
  { city: 'زاهدان', province: 'سیستان و بلوچستان', lat: 29.4963, lng: 60.8629 },
  { city: 'اردبیل', province: 'اردبیل', lat: 38.2498, lng: 48.2973 },
  { city: 'کیش', province: 'هرمزگان', lat: 26.5578, lng: 53.9790 },
  { city: 'قشم', province: 'هرمزگان', lat: 26.9585, lng: 56.2718 },
  { city: 'کاشان', province: 'اصفهان', lat: 33.9850, lng: 51.4100 },
  { city: 'نیشابور', province: 'خراسان رضوی', lat: 36.2133, lng: 58.7958 },
  { city: 'بابل', province: 'مازندران', lat: 36.5513, lng: 52.6800 },
  { city: 'آمل', province: 'مازندران', lat: 36.4676, lng: 52.3587 },
  { city: 'دزفول', province: 'خوزستان', lat: 32.3811, lng: 48.4058 },
  { city: 'شهریار', province: 'تهران', lat: 35.6597, lng: 51.0589 },
  { city: 'ورامین', province: 'تهران', lat: 35.3242, lng: 51.6492 }
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialCity = 'تهران'
}) => {
  // Step 1: Map Picker, Step 2: Recipient Details (نام، شماره، کد پستی، پلاک، بلوک، واحد)
  const [modalStep, setModalStep] = useState<1 | 2>(1);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geocodeTimerRef = useRef<any>(null);

  // Find initial city coords
  const matchedInitial = IRAN_CITIES.find(
    (c) => c.city === initialCity || initialCity.includes(c.city)
  ) || IRAN_CITIES[0];

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: matchedInitial.lat,
    lng: matchedInitial.lng
  });
  const [selectedCityName, setSelectedCityName] = useState<string>(matchedInitial.city);
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>(matchedInitial.province);
  const [detectedAddress, setDetectedAddress] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // High-accuracy device GPS tracking states
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string>('');
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'checking' | 'unknown'>('unknown');

  // Step 2 Form States (Pre-filled from localStorage if previously stored)
  const [fullName, setFullName] = useState<string>(() => localStorage.getItem('morico_chk_name') || '');
  const [phone, setPhone] = useState<string>(() => localStorage.getItem('morico_chk_phone') || '');
  const [postalCode, setPostalCode] = useState<string>(() => localStorage.getItem('morico_chk_postal') || '');
  const [pelak, setPelak] = useState<string>(() => localStorage.getItem('morico_chk_pelak') || '');
  const [block, setBlock] = useState<string>(() => localStorage.getItem('morico_chk_block') || '');
  const [unit, setUnit] = useState<string>(() => localStorage.getItem('morico_chk_unit') || '');
  const [detailedStreet, setDetailedStreet] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Reset step to 1 and automatically inspect & request GPS permission when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalStep(1);
      setFormErrors({});
      try {
        const savedRaw = localStorage.getItem('morico_selected_location');
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          if (parsed.fullName) setFullName(parsed.fullName);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.postalCode) setPostalCode(parsed.postalCode);
          if (parsed.pelak) setPelak(parsed.pelak);
          if (parsed.block) setBlock(parsed.block);
          if (parsed.unit) setUnit(parsed.unit);
          if (parsed.lat && parsed.lng) {
            setCurrentCoords({ lat: parsed.lat, lng: parsed.lng });
          }
        }
      } catch {}

      // Auto-inspect GPS permission and trigger location request immediately
      const autoGpsTimer = setTimeout(() => {
        checkAndRequestGps(true);
      }, 300);

      return () => clearTimeout(autoGpsTimer);
    }
  }, [isOpen]);

  // Reverse Geocoding helper
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.city) setSelectedCityName(data.city);
          if (data.province) setSelectedProvinceName(data.province);
          if (data.road) {
            setDetectedAddress(data.road);
            if (!detailedStreet) setDetailedStreet(data.road);
          } else if (data.displayName) {
            const shortName = data.displayName.split(',').slice(0, 3).join('، ');
            setDetectedAddress(shortName);
            if (!detailedStreet) setDetailedStreet(shortName);
          }
          if (data.postcode && !postalCode) {
            const cleanPost = data.postcode.replace(/\D/g, '').slice(0, 10);
            if (cleanPost.length === 10) setPostalCode(cleanPost);
          }
        }
      }
    } catch {
      // Ignore geocode error
    } finally {
      setIsGeocoding(false);
    }
  };

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize or re-render Leaflet map with Parsimap integration
  useEffect(() => {
    if (!isOpen || modalStep !== 1) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialLat = currentCoords.lat || 35.6892;
      const initialLng = currentCoords.lng || 51.3890;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        minZoom: 5,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: false
      });

      // 1. Initial tile layer using authenticated Parsimap raster tiles
      const tileLayer = L.tileLayer(PARSIMAP_DIRECT_TILE, {
        maxZoom: 19,
        attribution: '© Parsimap'
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // 2. Fetch fresh session styles from Parsimap API to guarantee active tile token
      fetch(`https://api.parsimap.ir/styles/parsimap-streets-v11-raster?key=${PARSIMAP_TOKEN}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((styleJson) => {
          if (styleJson?.sources?.composite?.tiles?.[0]) {
            const freshTileUrl = styleJson.sources.composite.tiles[0];
            if (freshTileUrl !== PARSIMAP_DIRECT_TILE && tileLayerRef.current) {
              tileLayerRef.current.setUrl(freshTileUrl);
            }
          }
        })
        .catch(() => {
          // If network glitch occurs with Parsimap API, fallback gracefully to clean OSM/Carto tiles
          tileLayer.on('tileerror', () => {
            tileLayer.setUrl('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png');
          });
        });

      // Track center as user drags or zooms
      const updateLocation = () => {
        const center = map.getCenter();
        setCurrentCoords({ lat: center.lat, lng: center.lng });

        // Nearest Iranian city fallback check
        let closestCity = IRAN_CITIES[0];
        let minDistance = Infinity;
        for (const c of IRAN_CITIES) {
          const d = Math.hypot(c.lat - center.lat, c.lng - center.lng);
          if (d < minDistance) {
            minDistance = d;
            closestCity = c;
          }
        }
        if (minDistance < 1.2) {
          setSelectedCityName(closestCity.city);
          setSelectedProvinceName(closestCity.province);
        }

        // Debounced reverse geocoding to retrieve street/alley in Persian
        if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
        geocodeTimerRef.current = setTimeout(() => {
          reverseGeocode(center.lat, center.lng);
        }, 400);
      };

      map.on('move', updateLocation);
      map.on('zoomend', updateLocation);

      mapInstanceRef.current = map;

      // Initial reverse geocode
      reverseGeocode(initialLat, initialLng);

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, modalStep]);

  // Handle city search selection
  const handleSelectSearchedCity = (cityItem: typeof IRAN_CITIES[0]) => {
    setSelectedCityName(cityItem.city);
    setSelectedProvinceName(cityItem.province);
    setSearchQuery(cityItem.city);
    setIsSearchFocused(false);
    setCurrentCoords({ lat: cityItem.lat, lng: cityItem.lng });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([cityItem.lat, cityItem.lng], 13, {
        duration: 1.2
      });
    }
  };

  // Filter cities by search term
  const filteredCities = searchQuery.trim()
    ? IRAN_CITIES.filter(
        (c) =>
          c.city.includes(searchQuery.trim()) ||
          c.province.includes(searchQuery.trim())
      )
    : IRAN_CITIES.slice(0, 8);

  // Automated GPS Permission Check and Trigger
  const checkAndRequestGps = (autoPrompt: boolean = true) => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsErrorMsg('مرورگر یا دستگاه شما از موقعیت‌یاب GPS پشتیبانی نمی‌کند.');
      return;
    }

    setGpsStatus('locating');
    setGpsErrorMsg('');

    // Check navigator.permissions API
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          setPermissionState(permissionStatus.state as any);
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state as any);
            if (permissionStatus.state === 'granted') {
              handleLocateMe();
            }
          };

          if (permissionStatus.state === 'denied') {
            setGpsStatus('error');
            setGpsErrorMsg(
              'دسترسی GPS در مرورگر مسدود است. لطفاً روی علامت قفل در نوار آدرس کلیک کرده و گزینه موقعیت مکانی (Location) را مجاز (Allow) کنید.'
            );
            return;
          }

          // If granted or prompt, execute locate (which automatically opens permission prompt if not yet granted)
          if (autoPrompt || permissionStatus.state === 'granted') {
            handleLocateMe();
          }
        })
        .catch(() => {
          if (autoPrompt) handleLocateMe();
        });
    } else {
      if (autoPrompt) handleLocateMe();
    }
  };

  // High-accuracy device GPS Location Handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsErrorMsg('مرورگر یا دستگاه شما از موقعیت‌یاب GPS پشتیبانی نمی‌کند.');
      return;
    }

    setGpsStatus('locating');
    setGpsErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
        }
        reverseGeocode(lat, lng);
        setGpsStatus('success');
        setPermissionState('granted');
        setTimeout(() => setGpsStatus('idle'), 4000);
      },
      (err) => {
        setGpsStatus('error');
        if (err.code === 1) { // PERMISSION_DENIED
          setPermissionState('denied');
          setGpsErrorMsg('مجوز دسترسی به GPS داده نشد. لطفاً در پنجره تایید مرورگر، دکمه «اجازه دادن» (Allow) را بزنید.');
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          setGpsErrorMsg('موقعیت مکانی دستگاه شما (GPS) خاموش است. حتماً GPS گوشی یا سیستم خود را روشن نمایید.');
        } else if (err.code === 3) { // TIMEOUT
          setGpsErrorMsg('زمان دریافت پاسخ از GPS به پایان رسید. لطفاً مطمئن شوید GPS دستگاه روشن است و مجدداً امتحان کنید.');
        } else {
          setGpsErrorMsg('حتماً GPS دستگاه روشن باشد تا موقعیت دقیق شما روی نقشه دریافت گردد.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Zoom controls
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  // Step 1: User completes map selection and moves to Step 2
  const handleProceedToStep2 = () => {
    setModalStep(2);
  };

  // Step 2 Form Validation (all fields in step 2 are mandatory)
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      errors.fullName = 'لطفاً نام و نام خانوادگی تحویل‌گیرنده را وارد کنید.';
    }

    if (!phone.trim()) {
      errors.phone = 'لطفاً شماره تلفن همراه را وارد کنید.';
    } else {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.phone = 'شماره تلفن وارد شده نامعتبر است (حداقل ۱۰ رقم).';
      }
    }

    if (!pelak.trim()) {
      errors.pelak = 'وارد کردن پلاک الزامی است.';
    }

    if (!block.trim()) {
      errors.block = 'وارد کردن بلوک الزامی است.';
    }

    if (!unit.trim()) {
      errors.unit = 'وارد کردن واحد الزامی است.';
    }

    if (!postalCode.trim()) {
      errors.postalCode = 'وارد کردن کد پستی الزامی است.';
    } else {
      const cleanPost = postalCode.replace(/\D/g, '');
      if (cleanPost.length !== 10) {
        errors.postalCode = 'کد پستی باید دقیقاً ۱۰ رقم باشد.';
      }
    }

    if (!detailedStreet.trim() && !detectedAddress.trim()) {
      errors.detailedStreet = 'وارد کردن نشانی دقیق خیابان و کوچه الزامی است.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Final Confirmation: Save & Emit LocationData
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Build complete street address string
    const streetPart = detailedStreet.trim() || detectedAddress || 'خیابان اصلی';
    const addressDetails = [
      selectedProvinceName ? `استان ${selectedProvinceName}` : '',
      selectedCityName,
      streetPart,
      `پلاک ${pelak.trim()}`,
      block.trim() ? `بلوک ${block.trim()}` : '',
      unit.trim() ? `واحد ${unit.trim()}` : ''
    ]
      .filter(Boolean)
      .join('، ');

    const locationData: LocationData = {
      city: selectedCityName || 'تهران',
      province: selectedProvinceName || 'تهران',
      address: addressDetails,
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      fullName: fullName.trim(),
      phone: phone.trim(),
      postalCode: postalCode.trim(),
      pelak: pelak.trim(),
      block: block.trim(),
      unit: unit.trim()
    };

    // Store in localStorage for seamless checkout persistence
    try {
      localStorage.setItem('morico_selected_city', locationData.city);
      localStorage.setItem('morico_selected_location', JSON.stringify(locationData));
      localStorage.setItem('morico_chk_name', locationData.fullName || '');
      localStorage.setItem('morico_chk_phone', locationData.phone || '');
      localStorage.setItem('morico_chk_province', locationData.province || '');
      localStorage.setItem('morico_chk_city', locationData.city);
      localStorage.setItem('morico_chk_address', addressDetails);
      localStorage.setItem('morico_chk_postal', locationData.postalCode || '');
      localStorage.setItem('morico_chk_pelak', locationData.pelak || '');
      localStorage.setItem('morico_chk_block', locationData.block || '');
      localStorage.setItem('morico_chk_unit', locationData.unit || '');
    } catch {}

    onConfirm(locationData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/25 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-[820px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col p-5 sm:p-7 text-right animate-in zoom-in-95 duration-150 border border-gray-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        
        {/* =============================================================== */}
        {/* Modal Header: Title on Right (first in RTL), Close button (x) on Left */}
        {/* =============================================================== */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-gray-100">
          
          {/* Right side: Title and Subtitle */}
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-[#ef394a]">
                {modalStep === 1 ? 'مرحله ۱: انتخاب روی نقشه' : 'مرحله ۲: مشخصات تحویل‌گیرنده'}
              </span>
            </div>
            <h2
              id="modal-title"
              className="text-base sm:text-lg font-bold text-gray-900 leading-tight"
            >
              {modalStep === 1 ? 'انتخاب موقعیت مکانی تحویل کالا' : 'مشخصات تکمیلی و آدرس پستی'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-700 font-normal mt-0.5">
              {modalStep === 1
                ? 'پین نقشه را روی نشانی دقیق تحویل تنظیم کنید.'
                : 'اطلاعات گیرنده، پلاک، بلوک، واحد و آدرس را تکمیل فرمایید.'}
            </p>
          </div>

          {/* Left side: Close Button (x) */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>

        </div>

        {/* =============================================================== */}
        {/* STEP 1: PARSIMAP INTERACTIVE MAP VIEW                           */}
        {/* =============================================================== */}
        {modalStep === 1 ? (
          <>
            {/* GPS Guidance & Automatic Permission Banner */}
            <div className="mt-3.5 mb-1 p-2.5 sm:p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`p-1.5 rounded-xl shrink-0 ${
                  permissionState === 'granted'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-200/80 text-amber-800'
                }`}>
                  <Radio className="w-4 h-4 animate-pulse" />
                </span>
                <div className="min-w-0">
                  <div className="font-bold flex items-center gap-1.5 flex-wrap">
                    <span>بررسی خودکار GPS:</span>
                    <span className="font-normal text-amber-950">
                      حتماً GPS دستگاه شما روشن باشد تا موقعیت تحویل سفارش به صورت دقیق ثبت گردد.
                    </span>
                  </div>
                  {permissionState === 'granted' && (
                    <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>مجوز GPS توسط مرورگر تایید و موقعیت فعال است.</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => checkAndRequestGps(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 hover:border-amber-400 text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs self-end sm:self-auto"
              >
                {gpsStatus === 'locating' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    <span>در حال بررسی و دریافت GPS...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-3.5 h-3.5 text-amber-600" />
                    <span>بررسی و صدور درخواست مجوز GPS</span>
                  </>
                )}
              </button>
            </div>

            {/* GPS Error Message Alert */}
            {gpsStatus === 'error' && gpsErrorMsg && (
              <div className="mt-1.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="font-semibold">{gpsErrorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => checkAndRequestGps(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#ef394a] text-white font-bold text-[11px] hover:bg-[#d72c41] transition-colors shrink-0 cursor-pointer"
                >
                  درخواست مجدد مجوز GPS
                </button>
              </div>
            )}

            {/* GPS Success Message */}
            {gpsStatus === 'success' && (
              <div className="mt-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">موقعیت دقیق شما از طریق GPS دستگاه با موفقیت شناسایی شد.</span>
              </div>
            )}

            <div className="relative mt-2.5 w-full h-[360px] sm:h-[440px] rounded-2xl overflow-hidden border border-gray-200/80 bg-[#f4efe7]">
              
              {/* Floating Search Box at Top of Map */}
              <div
                ref={searchWrapperRef}
                className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-8 z-[1000] max-w-md mx-auto"
              >
                <div className="relative">
                  <div
                    className={`flex items-center w-full h-11 sm:h-12 bg-white rounded-2xl px-4 shadow-md transition-all border ${
                      isSearchFocused
                        ? 'border-[#ef394a] ring-2 ring-[#ef394a]/15'
                        : 'border-gray-100/90'
                    }`}
                  >
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      placeholder=""
                      className="w-full bg-transparent text-xs sm:text-sm text-[#111110] focus:outline-none text-right"
                    />
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0 mr-2" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                        aria-label="پاک کردن جستجو"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* City Suggestions Dropdown */}
                  {isSearchFocused && (
                    <div className="absolute top-full mt-1.5 right-0 left-0 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-56 overflow-y-auto p-2 z-[1050] text-right animate-in fade-in duration-150">
                      {filteredCities.length > 0 ? (
                        filteredCities.map((item) => (
                          <button
                            key={`${item.city}-${item.province}`}
                            type="button"
                            onClick={() => handleSelectSearchedCity(item)}
                            className="w-full text-right px-3 py-2 rounded-xl text-xs sm:text-sm text-gray-800 hover:bg-neutral-50 hover:text-[#ef394a] transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span className="font-semibold">{item.city}</span>
                            <span className="text-[11px] text-gray-500">استان {item.province}</span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-gray-500">
                          شهری با این نام یافت نشد
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Leaflet Map Div */}
              <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

              {/* Centered Blue Location Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[1000] flex flex-col items-center">
                <div className="bg-[#1070e5] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-bounce-subtle">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>موقعیت تحویل سفارش</span>
                </div>
                <div className="w-[2px] h-4 bg-[#1070e5]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#1070e5] ring-4 ring-[#1070e5]/30 shadow-xs" />
              </div>

              {/* Map Controls: Locate me & Zoom in/out - z-[1000] ensures they stay on top of map tiles */}
              <div className="absolute bottom-4 left-3 z-[1000] flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={handleLocateMe}
                  className={`w-10 h-10 rounded-xl bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all cursor-pointer hover:shadow-xl active:scale-95 ${
                    gpsStatus === 'locating' ? 'text-[#ef394a] ring-2 ring-[#ef394a]/30' : 'text-gray-800 hover:text-[#ef394a] hover:bg-neutral-50'
                  }`}
                  title="موقعیت دقیق با GPS دستگاه"
                  aria-label="موقعیت دقیق با GPS دستگاه"
                >
                  {gpsStatus === 'locating' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#ef394a]" />
                  ) : (
                    <Crosshair className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="w-10 h-10 rounded-xl bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-800 hover:text-[#ef394a] hover:bg-neutral-50 transition-all cursor-pointer hover:shadow-xl active:scale-95"
                  title="بزرگنمایی"
                  aria-label="بزرگنمایی"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="w-10 h-10 rounded-xl bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-800 hover:text-[#ef394a] hover:bg-neutral-50 transition-all cursor-pointer hover:shadow-xl active:scale-95"
                  title="کوچک‌نمایی"
                  aria-label="کوچک‌نمایی"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              {/* Parsimap Attribution Badge */}
              <div className="absolute bottom-2 right-3 z-[1000] px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-[10px] text-gray-700 font-sans pointer-events-none select-none border border-gray-200/60 shadow-2xs">
                نقشه پارسی مپ © Parsimap
              </div>

            </div>

            {/* Detected Address Preview Pill */}
            <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 text-[#ef394a] shrink-0" />
                <span className="font-bold text-gray-900">
                  {selectedProvinceName}، {selectedCityName}
                </span>
                {detectedAddress && (
                  <span className="text-gray-500 truncate mr-1.5">
                    ({detectedAddress})
                  </span>
                )}
                {isGeocoding && (
                  <span className="text-[11px] text-gray-400 animate-pulse">در حال خواندن نشانی...</span>
                )}
              </div>
              <span className="text-[11px] text-gray-400 shrink-0 font-persian-nums">
                مختصات: {currentCoords.lat.toFixed(3)}, {currentCoords.lng.toFixed(3)}
              </span>
            </div>

            {/* Modal Footer: Proceed to Step 2 Button */}
            <div className="mt-4 pt-1">
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="w-full py-3.5 sm:py-4 rounded-2xl bg-[#ef394a] hover:bg-[#d72c41] active:scale-[0.99] text-white font-bold text-sm sm:text-base transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>ثبت موقعیت مکانی و ورود اطلاعات تحویل</span>
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </>
        ) : (
          /* =============================================================== */
          /* STEP 2: RECIPIENT & DETAILED ADDRESS FORM                       */
          /* =============================================================== */
          <form onSubmit={handleFinalSubmit} className="mt-4 space-y-4 animate-in fade-in duration-150">
            
            {/* Top Location Summary Card with "ویرایش نقشه" action */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/70 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#ef394a] text-white flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 truncate">
                    موقعیت مکانی روی نقشه: {selectedProvinceName}، {selectedCityName}
                  </div>
                  <div className="text-[11px] text-gray-600 truncate mt-0.5">
                    {detectedAddress || 'نشانی بر اساس موقعیت پین شده روی نقشه پارسی مپ'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalStep(1)}
                className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-[#ef394a] hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تغییر روی نقشه</span>
              </button>
            </div>

            {/* Row 1: نام و نام خانوادگی + شماره تلفن */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  نام و نام خانوادگی تحویل‌گیرنده <span className="text-[#ef394a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (formErrors.fullName) setFormErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    className={`w-full pr-9 pl-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all ${
                      formErrors.fullName
                        ? 'border-red-400 bg-red-50/30'
                        : 'border-gray-200 focus:border-[#ef394a] focus:ring-1 focus:ring-[#ef394a]/20'
                    }`}
                  />
                  <User className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {formErrors.fullName && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">
                    {formErrors.fullName}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  شماره تلفن همراه تحویل‌گیرنده <span className="text-[#ef394a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    className={`w-full pr-9 pl-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all dir-ltr text-right font-persian-nums ${
                      formErrors.phone
                        ? 'border-red-400 bg-red-50/30'
                        : 'border-gray-200 focus:border-[#ef394a] focus:ring-1 focus:ring-[#ef394a]/20'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {formErrors.phone && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">
                    {formErrors.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: پلاک، بلوک، واحد، کد پستی (تمامی فیلدها اجباری) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  پلاک <span className="text-[#ef394a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pelak}
                    onChange={(e) => {
                      setPelak(e.target.value);
                      if (formErrors.pelak) setFormErrors((prev) => ({ ...prev, pelak: '' }));
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all text-center font-persian-nums ${
                      formErrors.pelak
                        ? 'border-red-400 bg-red-50/30'
                        : 'border-gray-200 focus:border-[#ef394a] focus:ring-1 focus:ring-[#ef394a]/20'
                    }`}
                  />
                </div>
                {formErrors.pelak && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">
                    {formErrors.pelak}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  بلوک <span className="text-[#ef394a]">*</span>
                </label>
                <input
                  type="text"
                  value={block}
                  onChange={(e) => {
                    setBlock(e.target.value);
                    if (formErrors.block) setFormErrors((prev) => ({ ...prev, block: '' }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all text-center ${
                    formErrors.block
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-gray-200 focus:border-[#ef394a] focus:ring-1 focus:ring-[#ef394a]/20'
                  }`}
                />
                {formErrors.block && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">
                    {formErrors.block}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  واحد <span className="text-[#ef394a]">*</span>
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => {
                    setUnit(e.target.value);
                    if (formErrors.unit) setFormErrors((prev) => ({ ...prev, unit: '' }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all text-center font-persian-nums ${
                    formErrors.unit
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-gray-200 focus:border-[#ef394a] focus:ring-1 focus:ring-[#ef394a]/20'
                  }`}
                />
                {formErrors.unit && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">
                    {formErrors.unit}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  کد پستی ۱۰ رقمی <span className="text-[#ef394a]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={postalCode}
                  onChange={(e) => {
                    setPostalCode(e.target.value);
                    if (formErrors.postalCode) setFormErrors((prev) => ({ ...prev, postalCode: '' }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all dir-ltr text-right font-persian-nums ${
                    formErrors.postalCode
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-gray-200 focus:border-[#ef394a] focus:ring-1 focus:ring-[#ef394a]/20'
                  }`}
                />
                {formErrors.postalCode && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">
                    {formErrors.postalCode}
                  </span>
                )}
              </div>
            </div>

            {/* Row 3: نشانی دقیق خیابان و کوچه */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                نشانی دقیق خیابان و کوچه <span className="text-[#ef394a]">*</span>
              </label>
              <textarea
                rows={2}
                value={detailedStreet}
                onChange={(e) => {
                  setDetailedStreet(e.target.value);
                  if (formErrors.detailedStreet) setFormErrors((prev) => ({ ...prev, detailedStreet: '' }));
                }}
                className={`w-full p-3 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all resize-none ${
                  formErrors.detailedStreet
                    ? 'border-red-400 bg-red-50/30'
                    : 'border-gray-200 focus:border-[#ef394a] focus:ring-1 focus:ring-[#ef394a]/20'
                }`}
              />
              {formErrors.detailedStreet && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                  {formErrors.detailedStreet}
                </span>
              )}
            </div>

            {/* Action Buttons: Back to Map & Confirm and Save */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModalStep(1)}
                className="px-5 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                بازگشت به نقشه
              </button>

              <button
                type="submit"
                className="flex-1 py-3.5 rounded-2xl bg-[#ef394a] hover:bg-[#d72c41] active:scale-[0.99] text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تایید نهایی و ثبت آدرس</span>
              </button>
            </div>

          </form>
        )}

      </div>

    </div>
  );
};
