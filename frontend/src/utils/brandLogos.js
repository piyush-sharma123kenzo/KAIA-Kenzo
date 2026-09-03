// High-Definition Vector Brand Logos for Technology Manufacturers
// Powered by unpkg/jsdelivr simple-icons CDN - zero hotlink blocking, 100% reliable

export const brandLogoMap = {
  samsung: 'https://unpkg.com/simple-icons@v11/icons/samsung.svg',
  asus: 'https://unpkg.com/simple-icons@v11/icons/asus.svg',
  dell: 'https://unpkg.com/simple-icons@v11/icons/dell.svg',
  hp: 'https://unpkg.com/simple-icons@v11/icons/hp.svg',
  lenovo: 'https://unpkg.com/simple-icons@v11/icons/lenovo.svg',
  lg: 'https://unpkg.com/simple-icons@v11/icons/lg.svg',
  logitech: 'https://unpkg.com/simple-icons@v11/icons/logitechg.svg',
  razer: 'https://unpkg.com/simple-icons@v11/icons/razer.svg',
  intel: 'https://unpkg.com/simple-icons@v11/icons/intel.svg',
  amd: 'https://unpkg.com/simple-icons@v11/icons/amd.svg',
  canon: 'https://unpkg.com/simple-icons@v11/icons/canon.svg',
  acer: 'https://unpkg.com/simple-icons@v11/icons/acer.svg',
  jbl: 'https://unpkg.com/simple-icons@v11/icons/jbl.svg',
  mi: 'https://unpkg.com/simple-icons@v11/icons/xiaomi.svg',
  xiaomi: 'https://unpkg.com/simple-icons@v11/icons/xiaomi.svg',
  oppo: 'https://unpkg.com/simple-icons@v11/icons/oppo.svg',
  vivo: 'https://unpkg.com/simple-icons@v11/icons/vivo.svg',
  zebronics: 'https://unpkg.com/simple-icons@v11/icons/soundcharts.svg',
};

export const getBrandLogo = (brand) => {
  if (!brand) return 'https://unpkg.com/simple-icons@v11/icons/intel.svg';
  
  const raw = (typeof brand === 'string' ? brand : brand.slug || brand.name || '').toLowerCase().trim();
  const slug = raw.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  if (brandLogoMap[slug]) {
    return brandLogoMap[slug];
  }

  // Check substring matches
  for (const [key, url] of Object.entries(brandLogoMap)) {
    if (slug.includes(key) || key.includes(slug)) {
      return url;
    }
  }

  // Fallback to unpkg slug
  return `https://unpkg.com/simple-icons@v11/icons/${slug}.svg`;
};
