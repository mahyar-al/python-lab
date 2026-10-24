import React, { useState } from 'react';
import { Order, AdminUser } from '../../lib/types';
import { formatPrice, formatPersianNumber, formatPersianPhone } from '../../lib/currency';
import { formatJalaliDate, formatJalaliDateTime } from '../../lib/dateUtils';
import { Users, ShoppingBag, Eye, Phone, Mail, MapPin, X } from 'lucide-react';

interface AdminCustomersProps {
  orders: Order[];
  users: AdminUser[];
  onSelectOrder: (order: Order) => void;
  dark?: boolean;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({
  orders,
  users,
  onSelectOrder
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<{
    name: string;
    phone: string;
    email: string;
    orders: Order[];
    totalSpent: number;
  } | null>(null);

  // Group orders by customer phone/email
  const customerMap: {
    [key: string]: {
      name: string;
      phone: string;
      email: string;
      orders: Order[];
      totalSpent: number;
      lastOrderDate: string;
    };
  } = {};

  orders.forEach((o) => {
    const key = o.customerPhone || o.customerEmail || o.customerName;
    if (!customerMap[key]) {
      customerMap[key] = {
        name: o.customerName,
        phone: o.customerPhone,
        email: o.customerEmail || '',
        orders: [],
        totalSpent: 0,
        lastOrderDate: o.date
      };
    }

    customerMap[key].orders.push(o);
    if (['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)) {
      customerMap[key].totalSpent += o.total;
    }
    if (new Date(o.date).getTime() > new Date(customerMap[key].lastOrderDate).getTime()) {
      customerMap[key].lastOrderDate = o.date;
    }
  });

  const customerList = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-[#111110]">
          تحلیل مشتریان و سوابق خرید
        </h2>
        <span className="text-xs text-[#4A5560]">
          تجمع سفارشات، مجموع خرید و تاریخ آخرین تعامل مشتریان با آتلیه
        </span>
      </div>

      {/* Customer Cards & Table */}
      <div className="rounded-2xl border bg-white border-[#BFDDF0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#E4F5FF]/50 border-b border-[#BFDDF0] text-[#4A5560]">
                <th className="py-3.5 px-4 font-semibold">مشتری</th>
                <th className="py-3.5 px-4 font-semibold">شماره تماس</th>
                <th className="py-3.5 px-4 font-semibold">تعداد سفارش‌ها</th>
                <th className="py-3.5 px-4 font-semibold">مجموع خرید موفق</th>
                <th className="py-3.5 px-4 font-semibold">تاریخ آخرین سفارش</th>
                <th className="py-3.5 px-4 font-semibold text-center">مشاهده سوابق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#BFDDF0]/60">
              {customerList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#4A5560] text-xs">
                    هنوز هیچ سفارش یا خریداری در سیستم ثبت نشده است.
                  </td>
                </tr>
              ) : (
                customerList.map((c, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-[#D3ECFA]/20 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-[#111110]">
                    {c.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono dir-ltr text-right text-[#4A5560]">
                    {formatPersianPhone(c.phone)}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#111110]">
                    {formatPersianNumber(c.orders.length)} سفارش
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#2F6B4F]">
                    {formatPrice(c.totalSpent)}
                  </td>
                  <td className="py-3.5 px-4 text-[#4A5560]">
                    {formatJalaliDate(c.lastOrderDate)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-3 py-1.5 rounded-lg border border-[#BFDDF0] text-[#111110] hover:bg-[#D3ECFA]/60 text-xs font-medium"
                    >
                      سوابق خرید
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#BFDDF0] rounded-2xl p-6 sm:p-7 max-w-2xl w-full text-right shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#BFDDF0]">
              <div>
                <h3 className="text-base font-bold text-[#111110]">
                  سوابق سفارشات خریدار: {selectedCustomer.name}
                </h3>
                <span className="text-xs text-[#4A5560]">
                  {formatPersianPhone(selectedCustomer.phone)} · مجموع کل خرید: {formatPrice(selectedCustomer.totalSpent)}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-gray-500 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedCustomer.orders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => {
                    setSelectedCustomer(null);
                    onSelectOrder(ord);
                  }}
                  className="p-3.5 rounded-xl border border-[#BFDDF0] hover:bg-[#D3ECFA]/30 cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-[#111110]">
                      {ord.orderNumber || ord.id}
                    </span>
                    <div className="text-[11px] text-[#4A5560] mt-0.5">
                      {formatJalaliDateTime(ord.date)} · {formatPersianNumber(ord.items.length)} قلم کالا
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[#111110]">
                      {formatPrice(ord.total)}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#111110] text-white">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
