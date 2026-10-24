import React from 'react';
import ReactDOM from 'react-dom/client';
import 'vazirmatn/Vazirmatn-font-face.css';
import 'vazirmatn/misc/Farsi-Digits/Vazirmatn-FD-font-face.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import App from './App';
import './index.css';

// One-time cache purge for newly emptied catalog & categories
try {
  const versionKey = 'morico_empty_init_v2';
  if (!localStorage.getItem(versionKey)) {
    localStorage.removeItem('morico_categories_unified');
    localStorage.removeItem('morico_category_attributes_unified');
    localStorage.removeItem('morico_products_unified');
    localStorage.removeItem('morico_bestsellers_unified');
    localStorage.removeItem('morico_top_weekly_unified');
    localStorage.removeItem('morico_cart_v2');
    localStorage.setItem(versionKey, 'true');
  }
} catch (_) {}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
