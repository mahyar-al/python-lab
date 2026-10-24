export function parseDate(dateInput: string | Date | null | undefined): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatJalaliDateTime(dateInput: string | Date | null | undefined): string {
  const d = parseDate(dateInput);
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      calendar: 'persian',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

export function formatJalaliDate(dateInput: string | Date | null | undefined): string {
  const d = parseDate(dateInput);
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      calendar: 'persian',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

export function formatJalaliDateText(dateInput: string | Date | null | undefined): string {
  const d = parseDate(dateInput);
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      calendar: 'persian',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  } catch {
    return d.toDateString();
  }
}
