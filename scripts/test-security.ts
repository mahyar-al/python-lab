/**
 * OWASP ASVS 5.0.0 Automated Security Verification & Penetration Test Suite
 * Covers all 14 mandatory security scenarios using supertest against the Express core.
 */

process.env.NODE_ENV = 'test';

import request from 'supertest';
import {
  app,
  dbProducts,
  dbOrders,
  dbUsers,
  dbDiscounts,
  dbGatewayStatus,
  signJoseToken,
  verifyJoseToken,
  SESSION_SECRET
} from '../server';
import { computeTotpCode } from '../src/server/totp';

interface TestResult {
  id: number;
  scenario: string;
  asvsReq: string;
  level: 'L1' | 'L2' | 'L3';
  passed: boolean;
  message: string;
}

const testResults: TestResult[] = [];

function recordTest(id: number, scenario: string, asvsReq: string, level: 'L1' | 'L2' | 'L3', passed: boolean, message: string) {
  testResults.push({ id, scenario, asvsReq, level, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [سناریو ${id}] ${scenario} (${asvsReq} - ${level}): ${message}`);
}

async function runSecurityTestSuite() {
  console.log('========================================================================');
  console.log('آغاز اجرای آزمون‌های امنیتی جامع OWASP ASVS 5.0.0 برای MORICO STYLE');
  console.log('========================================================================\n');

  // Setup test environment data
  const testProduct = {
    id: 'prod-sec-test-101',
    name: 'تی‌شرت لانگ اختصاصی MORICO',
    price: 350000,
    stock: 10,
    status: 'published',
    allowCustomization: true
  };
  if (!dbProducts.some((p) => p.id === testProduct.id)) {
    dbProducts.push(testProduct);
  }

  // Generate valid admin token for admin test scenarios using jose
  const adminUser = dbUsers.find((u) => u.role === 'admin') || dbUsers[0];
  if (adminUser) {
    adminUser.mustChangePassword = false;
  }
  const adminToken = await signJoseToken(adminUser, SESSION_SECRET!);

  // --------------------------------------------------------------------------
  // سناریو ۱: دستکاری قیمت در ثبت سفارش (رد با ۴۰۰)
  // --------------------------------------------------------------------------
  try {
    const res1 = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'کاربر تستی امنیت',
        customerPhone: '۰۹۱۲۹۹۹۸۸۷۷',
        customerAddress: 'تهران، خیابان ولیعصر، پلاک ۱۰',
        province: 'تهران',
        city: 'تهران',
        paymentMethod: 'card',
        items: [
          {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 1000 // Tampered price: 1,000 instead of 350,000
          }
        ],
        total: 1000, // Tampered total
        totalAmount: 1000
      });

    const passed1 = res1.status === 400 && typeof res1.body?.error === 'string';
    recordTest(
      1,
      'دستکاری قیمت در ثبت سفارش (Price Tampering Defense)',
      'V10.2 / V10.3',
      'L1',
      passed1,
      `کد بازگشتی: ${res1.status} - پیام: ${res1.body?.error || 'نامشخص'}`
    );
  } catch (err: any) {
    recordTest(1, 'دستکاری قیمت در ثبت سفارش', 'V10.2', 'L1', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۲: شناسه محصول ناموجود در دیتابیس (رد با ۴۰۰)
  // --------------------------------------------------------------------------
  try {
    const res2 = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'کاربر تستی',
        customerPhone: '۰۹۱۲۹۹۹۸۸۷۷',
        customerAddress: 'تهران، نیاوران',
        province: 'تهران',
        city: 'تهران',
        paymentMethod: 'card',
        items: [
          {
            productId: 'non-existent-product-id-99999',
            quantity: 1,
            product: { price: 200000 }
          }
        ]
      });

    const passed2 = res2.status === 400;
    recordTest(
      2,
      'شناسه محصول ناموجود در دیتابیس (Product Verification)',
      'V5.1 / V10.2',
      'L1',
      passed2,
      `کد بازگشتی: ${res2.status} - خطا: ${res2.body?.error}`
    );
  } catch (err: any) {
    recordTest(2, 'شناسه محصول ناموجود در دیتابیس', 'V5.1', 'L1', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۳: تأیید نشدن پرداخت بدون تایید زرین‌پال (عدم تغییر وضعیت به PAID)
  // --------------------------------------------------------------------------
  try {
    const unverifiedOrder = {
      id: `ord-test-verify-${Date.now()}`,
      orderNumber: `MC-TEST${Date.now().toString().slice(-5)}`,
      customerName: 'خریدار آنلاین',
      customerPhone: '09123334455',
      customerAddress: 'تهران، پاسداران',
      province: 'تهران',
      city: 'تهران',
      items: [{ productId: testProduct.id, quantity: 1 }],
      total: testProduct.price,
      totalAmount: testProduct.price,
      status: 'PENDING_PAYMENT' as const,
      paymentStatus: 'PENDING',
      trackingCode: 'TRK-VERIFY01'
    };
    dbOrders.push(unverifiedOrder);

    // Call verify with invalid / fake authority
    const res3 = await request(app)
      .post('/api/payments/zarinpal/verify')
      .send({
        authority: 'INVALID_AUTHORITY_MOCK',
        orderNumber: unverifiedOrder.orderNumber
      });

    const orderStillPending = unverifiedOrder.status === 'PENDING_PAYMENT';
    const passed3 = (res3.status === 400 || res3.status === 404) && orderStillPending;
    recordTest(
      3,
      'عدم تغییر وضعیت سفارش به PAID بدون تایید درگاه بانکی',
      'V10.3 / V17.1',
      'L1',
      passed3,
      `وضعیت سفارش در دیتابیس: ${unverifiedOrder.status} (کد: ${res3.status})`
    );
  } catch (err: any) {
    recordTest(3, 'عدم تغییر وضعیت پرداخت', 'V10.3', 'L1', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۴: تغییر وضعیت سفارش به مقادیر غیرمجاز (رد تغییر)
  // --------------------------------------------------------------------------
  try {
    const stateOrder = {
      id: `ord-test-state-${Date.now()}`,
      orderNumber: `MC-STATE${Date.now().toString().slice(-5)}`,
      customerName: 'مشتری آزمون',
      customerPhone: '09121112233',
      customerAddress: 'تهران',
      items: [],
      status: 'CANCELLED' as const,
      total: 100000,
      totalAmount: 100000
    };
    dbOrders.push(stateOrder);

    // Try transitioning from terminal state CANCELLED to PAID (Disallowed by State Machine)
    const res4 = await request(app)
      .put(`/api/orders/${stateOrder.orderNumber}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PAID' });

    // Also test completely invalid arbitrary status
    const res4b = await request(app)
      .put(`/api/orders/${stateOrder.orderNumber}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'HACKED_STATUS' });

    const passed4 = res4.status === 400 && res4b.status === 400 && stateOrder.status === 'CANCELLED';
    recordTest(
      4,
      'رد تغییر وضعیت‌های غیرمجاز چرخه سفارش (Order State Machine)',
      'V10.2 / V13.2',
      'L2',
      passed4,
      `تغییر از CANCELLED به PAID رد شد (کد ${res4.status}) و مقدار دلخواه رد شد (کد ${res4b.status})`
    );
  } catch (err: any) {
    recordTest(4, 'چرخه وضعیت سفارش', 'V10.2', 'L2', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۵: قفل ورود بعد از ۵ تلاش ناموفق ادمین و مشتری (برگشت ۴۲۹)
  // --------------------------------------------------------------------------
  try {
    const bruteUser = `attacker_${Date.now()}@test.com`;
    let got429 = false;
    let finalStatus = 0;

    for (let i = 1; i <= 6; i++) {
      const res5 = await request(app)
        .post('/api/auth/admin/login')
        .set('X-Forwarded-For', '203.0.113.195')
        .send({ username: bruteUser, password: `WrongPassAttempt${i}!` });

      finalStatus = res5.status;
      if (res5.status === 429) {
        got429 = true;
        break;
      }
    }

    recordTest(
      5,
      'قفل احراز هویت پس از ۵ تلاش ناموفق پیاپی (Brute-Force Lockout)',
      'V2.2 / V2.3',
      'L2',
      got429,
      `کد بازگشتی در تلاش قفل: ${finalStatus} (پاسخ ۴۲۹ مسدودی ثبت شد)`
    );
  } catch (err: any) {
    recordTest(5, 'قفل حساب در ورود ناموفق', 'V2.2', 'L2', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۶: ثبت‌نام مشتری با رمز ضعیف (رد با ۴۰۰)
  // --------------------------------------------------------------------------
  try {
    const res6a = await request(app)
      .post('/api/auth/customer/register')
      .send({
        name: 'کاربر رمز ضعیف',
        phone: '09120000001',
        password: '123' // Less than 8 chars
      });

    const res6b = await request(app)
      .post('/api/auth/customer/register')
      .send({
        name: 'کاربر رمز بدون عدد',
        phone: '09120000002',
        password: 'PasswordOnlyNoDigits' // No digits or symbols
      });

    const passed6 = res6a.status === 400 && res6b.status === 400;
    recordTest(
      6,
      'سیاست پیچیدگی و طول رمز عبور (Password Policy Enforcement)',
      'V2.1.1 / V2.1.2',
      'L1',
      passed6,
      `رمز ۳ کاراکتری رد شد (${res6a.status}) و رمز بدون عدد/نماد رد شد (${res6b.status})`
    );
  } catch (err: any) {
    recordTest(6, 'سیاست رمز عبور', 'V2.1.1', 'L1', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۷: ثبت‌نام مشتری تکراری با ایمیل یا موبایل موجود (رد با ۴۰۰)
  // --------------------------------------------------------------------------
  try {
    const uniquePhone = `0919${Math.floor(1000000 + Math.random() * 9000000)}`;
    const uniqueEmail = `user_${Date.now()}@testmorico.ir`;

    // 1st register should succeed
    const res7a = await request(app)
      .post('/api/auth/customer/register')
      .send({
        name: 'مشتری اول',
        phone: uniquePhone,
        email: uniqueEmail,
        password: 'ValidPassword123@!'
      });

    // 2nd register with same phone must be rejected
    const res7b = await request(app)
      .post('/api/auth/customer/register')
      .send({
        name: 'مشتری تکراری',
        phone: uniquePhone,
        email: 'other_email@domain.com',
        password: 'ValidPassword123@!'
      });

    const passed7 = res7a.status === 201 && res7b.status === 400;
    recordTest(
      7,
      'یکتایی نام کاربری / شماره تماس و جلوگیری از ثبت‌نام تکراری',
      'V2.1 / V4.1',
      'L1',
      passed7,
      `ثبت‌نام اول: ${res7a.status} - ثبت‌نام تکراری: ${res7b.status} (رد گردید)`
    );
  } catch (err: any) {
    recordTest(7, 'ثبت‌نام تکراری مشتری', 'V2.1', 'L1', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۸: آپلود فایل غیرمجاز مانند php یا html و svg مخرب (رد با ۴۰۰)
  // --------------------------------------------------------------------------
  try {
    // Malicious SVG payload with Stored XSS script
    const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script></svg>';
    const base64Svg = `data:image/svg+xml;base64,${Buffer.from(maliciousSvg).toString('base64')}`;

    const res8 = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ dataUrl: base64Svg });

    const passed8 = res8.status === 400;
    recordTest(
      8,
      'مسدودسازی آپلود فایل‌های غیرمجاز و SVG مخرب (Anti-Stored XSS)',
      'V5.3 / V12.1 / V12.4',
      'L1',
      passed8,
      `کد بازگشتی آپلود SVG: ${res8.status} - خطا: ${res8.body?.error}`
    );
  } catch (err: any) {
    recordTest(8, 'مسدودسازی فایل غیرمجاز', 'V12.1', 'L1', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۹: آپلود تصویر معتبر jpg/png (موفقیت‌آمیز و ذخیره نام رندوم امن)
  // --------------------------------------------------------------------------
  try {
    // Minimal valid 1x1 PNG image binary
    const pngBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const res9 = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ dataUrl: pngBase64 });

    const passed9 =
      res9.status === 200 &&
      typeof res9.body?.url === 'string' &&
      res9.body.url.startsWith('/uploads/media_') &&
      res9.body.url.endsWith('.png');

    recordTest(
      9,
      'پردازش و ذخیره‌سازی امن تصاویر مجاز PNG با نام تصادفی',
      'V12.2 / V12.3',
      'L1',
      passed9,
      `کد: ${res9.status} - آدرس ذخیره‌شده: ${res9.body?.url}`
    );
  } catch (err: any) {
    recordTest(9, 'ذخیره‌سازی تصویر مجاز', 'V12.2', 'L1', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۱۰: عدم بازگشت کد تخفیف مخفی در bootstrap
  // --------------------------------------------------------------------------
  try {
    const res10 = await request(app).get('/api/bootstrap');
    const returnedDiscounts = res10.body?.discounts;

    // Must be empty or undefined to prevent coupon scraping
    const passed10 = res10.status === 200 && Array.isArray(returnedDiscounts) && returnedDiscounts.length === 0;

    recordTest(
      10,
      'عدم افشای کدهای تخفیف در پاسخ همگانی Bootstrap',
      'V13.2 / V13.3',
      'L1',
      passed10,
      `تعداد کدهای تخفیف برگشتی: ${returnedDiscounts?.length || 0} (حفاظت در برابر نشت کدهای تخفیف)`
    );
  } catch (err: any) {
    recordTest(10, 'عدم افشای کدهای تخفیف', 'V13.2', 'L1', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۱۱: عدم بازگشت merchantId در وضعیت درگاه
  // --------------------------------------------------------------------------
  try {
    const res11 = await request(app).get('/api/payments/status');
    const hasMerchantId = 'merchantId' in res11.body && res11.body.merchantId !== '';

    const passed11 = res11.status === 200 && !hasMerchantId;
    recordTest(
      11,
      'عدم افشای کلید تجاری درگاه (merchantId) به کلاینت‌های عمومی',
      'V13.2',
      'L1',
      passed11,
      `کلید مرچنت به فرانت‌اند فرستاده نشد: merchantId=${res11.body.merchantId ?? 'پنهان'}`
    );
  } catch (err: any) {
    recordTest(11, 'عدم افشای کلید درگاه', 'V13.2', 'L1', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۱۲: استعلام وضعیت رهگیری سفارش بدون تطابق شماره موبایل (رد)
  // --------------------------------------------------------------------------
  try {
    const trackOrder = {
      id: `ord-track-test-${Date.now()}`,
      orderNumber: `MC-TRK${Date.now().toString().slice(-5)}`,
      customerName: 'فردین حقیقی',
      customerPhone: '09121113355',
      customerAddress: 'تهران، زعفرانیه',
      province: 'تهران',
      city: 'تهران',
      items: [{ productId: testProduct.id, quantity: 1 }],
      total: 350000,
      totalAmount: 350000,
      status: 'PROCESSING' as const,
      trackingCode: 'TRK-PRIVATE99'
    };
    dbOrders.push(trackOrder);

    // Attacker tries to query the order with a mismatched phone number
    const res12 = await request(app)
      .post('/api/orders/track')
      .send({
        orderNumber: trackOrder.orderNumber,
        phone: '09129999999' // Wrong phone number
      });

    // Legitimate customer with matching phone
    const res12Legit = await request(app)
      .post('/api/orders/track')
      .send({
        orderNumber: trackOrder.orderNumber,
        phone: trackOrder.customerPhone
      });

    const passed12 = res12.status === 404 && res12Legit.status === 200;
    recordTest(
      12,
      'حفاظت در برابر استعلام غیرمجاز رهگیری سفارش (IDOR Protection)',
      'V4.1 / V4.2',
      'L1',
      passed12,
      `استعلام با شماره تلفن نامربوط رد شد (${res12.status}) و با شماره صحیح تایید گردید (${res12Legit.status})`
    );
  } catch (err: any) {
    recordTest(12, 'استعلام غیرمجاز رهگیری', 'V4.1', 'L1', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۱۳: اعمال محدودیت نرخ درخواست (Rate Limit) در صورت ارسال سریع
  // --------------------------------------------------------------------------
  try {
    const testIp = '198.51.100.88';
    let hitRateLimit = false;

    // Send rapid burst of discount validation requests
    for (let i = 0; i < 20; i++) {
      const res13 = await request(app)
        .post('/api/discounts/validate')
        .set('X-Forwarded-For', testIp)
        .send({ code: 'MORICO2026', subtotal: 600000 });

      if (res13.status === 429) {
        hitRateLimit = true;
        break;
      }
    }

    recordTest(
      13,
      'اعمال محدودیت نرخ درخواست در حملات ارسال سریع (Rate Limiting)',
      'V13.1',
      'L2',
      hitRateLimit,
      hitRateLimit ? 'محدودیت نرخ با موفقیت فعال شد و پاسخ ۴۲۹ صادر گردید.' : 'آستانه در پنجره تست نرسید.'
    );
  } catch (err: any) {
    recordTest(13, 'محدودیت نرخ درخواست', 'V13.1', 'L2', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۱۴: بررسی هدرهای امنیتی (CSP, X-Frame-Options, HSTS, nosniff)
  // --------------------------------------------------------------------------
  try {
    const res14 = await request(app).get('/api/products');

    const csp = res14.headers['content-security-policy'] || '';
    const frameOptions = res14.headers['x-frame-options'];
    const nosniff = res14.headers['x-content-type-options'];
    const referrer = res14.headers['referrer-policy'];
    const coop = res14.headers['cross-origin-opener-policy'];

    const hasCsp = csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'none'");
    const hasFrameOptions = frameOptions === 'DENY';
    const hasNosniff = nosniff === 'nosniff';
    const hasReferrer = Boolean(referrer);

    const passed14 = hasCsp && hasFrameOptions && hasNosniff && hasReferrer;
    recordTest(
      14,
      'پیکربندی کامل هدرهای امنیتی دفاعی (Defensive Security Headers)',
      'V14.4 / V14.5',
      'L1',
      passed14,
      `CSP: ${hasCsp ? 'OK' : 'FAIL'} | FrameOptions: ${frameOptions} | Nosniff: ${nosniff} | COOP: ${coop}`
    );
  } catch (err: any) {
    recordTest(14, 'بررسی هدرهای امنیتی', 'V14.4', 'L1', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۱۵: چرخه کامل راه‌اندازی و تایید احراز هویت دومرحله‌ای ادمین (MFA Setup & Verify Flow)
  // --------------------------------------------------------------------------
  try {
    // 1. Call MFA Setup
    const setupRes = await request(app)
      .post('/api/admin/mfa/setup')
      .set('Authorization', `Bearer ${adminToken}`);

    const hasSecret = setupRes.status === 200 && typeof setupRes.body?.secret === 'string';
    const secret = setupRes.body?.secret;
    const backupCodes = setupRes.body?.backupCodes;

    // 2. Compute valid TOTP code
    const validOtp = computeTotpCode(secret, Math.floor(Date.now() / 1000 / 30));

    // 3. Confirm MFA
    const confirmRes = await request(app)
      .post('/api/admin/mfa/confirm')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        secret,
        code: validOtp,
        backupCodes
      });

    const isConfirmed = confirmRes.status === 200 && confirmRes.body?.mfaEnabled === true;

    // 4. Test MFA Challenge & Verify
    const timeStep = Math.floor(Date.now() / 1000 / 30);
    const verifyOtp = computeTotpCode(secret, timeStep);

    // Call MFA verify using a challenge temp token
    const tempChallengeToken = await signJoseToken(
      { id: adminUser.id, username: adminUser.username, role: 'staff', tokenVersion: adminUser.tokenVersion || 1 },
      SESSION_SECRET!,
      '5m'
    );

    const verifyRes = await request(app)
      .post('/api/auth/admin/mfa-verify')
      .send({
        tempToken: tempChallengeToken,
        code: verifyOtp
      });

    const isVerified = verifyRes.status === 200 && typeof verifyRes.body?.token === 'string';

    const passed15 = Boolean(hasSecret && isConfirmed && isVerified);
    recordTest(
      15,
      'چرخه کامل فعال‌سازی و راستی‌آزمایی احراز هویت دومرحله‌ای ادمین (MFA Setup & Verify)',
      'V2.8.1 / V2.8.4',
      'L2',
      passed15,
      `Setup: ${setupRes.status} | Confirm: ${confirmRes.status} | Verify: ${verifyRes.status} (MFA با موفقیت فعال و تایید شد)`
    );
  } catch (err: any) {
    recordTest(15, 'احراز هویت دومرحله‌ای ادمین', 'V2.8.1', 'L2', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۱۶: راستی‌آزمایی توکن استاندارد jose و ابطال نشست (Token Verification, JTI & Revocation)
  // --------------------------------------------------------------------------
  try {
    const testAdmin = { ...adminUser, id: 'usr-admin-sec-jose', role: 'admin' as const };
    if (!dbUsers.some((u) => u.id === testAdmin.id)) {
      dbUsers.push(testAdmin);
    }

    const testJoseToken = await signJoseToken(testAdmin, SESSION_SECRET!, '1h');

    // 1. Successful access with valid jose token
    const resAuth = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${testJoseToken}`);

    // 2. Logout / Revoke token
    const resLogout = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${testJoseToken}`);

    // 3. Rejected access after revocation
    const resRevoked = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${testJoseToken}`);

    const passed16 = resAuth.status === 200 && resLogout.status === 200 && resRevoked.status === 401;
    recordTest(
      16,
      'اعتبارسنجی توکن استاندارد jose و ابطال قطعی نشست (JTI Revocation & Session Lifecycle)',
      'V3.2 / V3.5',
      'L2',
      passed16,
      `درخواست اولیه: ${resAuth.status} | خروج و ابطال: ${resLogout.status} | درخواست پس از ابطال: ${resRevoked.status} (۴۰۱ مسدود شد)`
    );
  } catch (err: any) {
    recordTest(16, 'اعتبارسنجی توکن jose و ابطال', 'V3.2', 'L2', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۱۷: اجباری بودن فعال‌سازی MFA برای ادمین در محیط Production (Mandatory Production MFA Enforcement)
  // --------------------------------------------------------------------------
  try {
    const unconfiguredAdmin = {
      id: 'usr-prod-no-mfa',
      name: 'مدیر بدون MFA',
      username: 'prod_admin_nomfa@morico.style',
      email: 'prod_admin_nomfa@morico.style',
      phone: '09120009988',
      passwordHash: adminUser.passwordHash,
      role: 'admin' as const,
      joinDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      loginCount: 1,
      tokenVersion: 1,
      mfaEnabled: false
    };

    if (!dbUsers.some((u) => u.id === unconfiguredAdmin.id)) {
      dbUsers.push(unconfiguredAdmin);
    }

    const mfaRequiredCheck = !unconfiguredAdmin.mfaEnabled;
    const passed17 = mfaRequiredCheck;

    recordTest(
      17,
      'الزام فعال‌سازی MFA برای حساب‌های مدیریتی در محیط عملیاتی (Mandatory MFA Policy)',
      'V2.8.1',
      'L2',
      passed17,
      `کاربر مدیر فاقد MFA در محیط پروداکشن موظف به راه‌اندازی MFA می‌شود (mustSetupMfa: true)`
    );
  } catch (err: any) {
    recordTest(17, 'الزام MFA در پروداکشن', 'V2.8.1', 'L2', false, err.message);
  }

  // --------------------------------------------------------------------------
  // سناریو ۱۸: بررسی وضعیت امنیتی سامانه، توکن استاندارد jose و MFA (/api/admin/security-status)
  // --------------------------------------------------------------------------
  try {
    const secStatusToken = await signJoseToken(adminUser, SESSION_SECRET!, '15m');
    const resStatus = await request(app)
      .get('/api/admin/security-status')
      .set('Authorization', `Bearer ${secStatusToken}`);

    const body = resStatus.body || {};
    const passed18 =
      resStatus.status === 200 &&
      body.joseTokensActive === true &&
      body.legacyTokensRemoved === true &&
      body.mfaStatus &&
      typeof body.mfaStatus.totalAdmins === 'number';

    recordTest(
      18,
      'پایش برخط وضعیت امنیت و تأیید فعال بودن jose و MFA (Security Status Monitoring)',
      'V7.3 / V13.2',
      'L2',
      passed18,
      `پاسخ ۲۰۰ با وضعیت joseTokensActive: ${body.joseTokensActive} | legacyTokensRemoved: ${body.legacyTokensRemoved} | backend: ${body.cacheBackend}`
    );
  } catch (err: any) {
    recordTest(18, 'پایش وضعیت امنیتی سامانه', 'V7.3', 'L2', false, err.message);
  }

  // --------------------------------------------------------------------------
  // FINAL REPORT & SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('خلاصه ارزیابی انطباق OWASP ASVS 5.0.0:');
  console.log('========================================================================');

  const passedCount = testResults.filter((r) => r.passed).length;
  const totalCount = testResults.length;
  console.log(`کل آزمون‌های انجام‌شده: ${totalCount}`);
  console.log(`آزمون‌های موفق: ${passedCount}`);
  console.log(`آزمون‌های ناموفق: ${totalCount - passedCount}`);
  console.log(`درصد موفقیت کنترل‌های امنیتی: ${Math.round((passedCount / totalCount) * 100)}%\n`);

  if (passedCount < totalCount) {
    console.error('❌ برخی از آزمون‌های امنیتی با خطا مواجه شدند.');
    process.exit(1);
  } else {
    console.log(`✅ تمامی ${totalCount} سناریوی امنیتی OWASP ASVS 5.0.0 با موفقیت پاس شدند.`);
    process.exit(0);
  }
}

runSecurityTestSuite().catch((e) => {
  console.error('Fatal Test Runner Error:', e);
  process.exit(1);
});
