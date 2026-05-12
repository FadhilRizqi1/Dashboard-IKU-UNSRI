'use strict';
/* data-api.js - loads database-backed IKU data, with js/data.js as fallback */

window.IKUDataApi = (() => {
  async function load() {
    const year = localStorage.getItem('iku-year') || '2024';
    const unit = localStorage.getItem('iku-unit') || 'all';
    try {
      const res = await fetch(`api/data.php?year=${encodeURIComponent(year)}&unit=${encodeURIComponent(unit)}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const payload = await res.json();
      if (!payload.ok || !payload.data) throw new Error(payload.error || 'Invalid API response');
      Object.assign(DATA, payload.data);
      window.IKU_DATA_SOURCE = payload.source || 'database';
      return true;
    } catch (err) {
      console.warn('Using static IKU data fallback:', err.message);
      window.IKU_DATA_SOURCE = 'static-fallback';
      return false;
    }
  }

  return { load };
})();
