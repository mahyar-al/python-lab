const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toPersianDigits(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)] || d);
}

export function toAsciiDigits(val: string | null | undefined): string {
  if (!val) return '';
  let str = String(val);
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(PERSIAN_DIGITS[i], 'g'), String(i));
    str = str.replace(new RegExp(ARABIC_DIGITS[i], 'g'), String(i));
  }
  return str;
}

export function formatPersianNumber(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '';
  const num = typeof val === 'number' ? val : Number(toAsciiDigits(val));
  if (isNaN(num)) return toPersianDigits(val);
  const formatted = num.toLocaleString('fa-IR');
  return formatted;
}

export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '۰ تومان';
  const num = Math.round(amount);
  const formatted = num.toLocaleString('fa-IR');
  return `${formatted} تومان`;
}

export function formatPersianPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const clean = toAsciiDigits(phone).replace(/\s+/g, '');
  if (clean.length === 11 && clean.startsWith('09')) {
    const formatted = `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
    return toPersianDigits(formatted);
  }
  return toPersianDigits(phone);
}

export function formatDiscountPercent(percent: number | null | undefined): string {
  if (percent === null || percent === undefined || isNaN(percent) || percent <= 0) return '';
  return `${toPersianDigits(Math.round(percent))}٪ تخفیف`;
}
