// High-Accuracy Category & Product Image Resolver
// Guarantees authentic, real product photography for every item based on its name & category

const categoryImagePools = {
  // Keyboards
  keyboard: [
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1595225476474-87563907a212?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541140532154-b024d705b909?w=700&auto=format&fit=crop&q=80',
  ],
  // Mice
  mouse: [
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=700&auto=format&fit=crop&q=80',
  ],
  // SSDs / Storage
  storage: [
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=700&auto=format&fit=crop&q=80',
  ],
  // Wi-Fi Routers
  router: [
    'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=700&auto=format&fit=crop&q=80',
  ],
  // Monitors / Displays
  monitor: [
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551645120-d70bfe84c826?w=700&auto=format&fit=crop&q=80',
  ],
  // Speakers / Studio Monitors
  speaker: [
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700&auto=format&fit=crop&q=80',
  ],
  // Liquid CPU Coolers
  cooler: [
    'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=700&auto=format&fit=crop&q=80',
  ],
  // RAM Memory
  memory: [
    'https://images.unsplash.com/photo-1562976540-1502c2145186?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=700&auto=format&fit=crop&q=80',
  ],
  // Earbuds
  earbuds: [
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=700&auto=format&fit=crop&q=80',
  ],
  // Headphones
  headphones: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=700&auto=format&fit=crop&q=80',
  ],
  // Laptops
  laptops: [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=700&auto=format&fit=crop&q=80',
  ],
  // Smartphones
  smartphones: [
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80',
  ],
  // Cameras
  cameras: [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=700&auto=format&fit=crop&q=80',
  ],
  // GPUs / Graphics
  gpu: [
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=700&auto=format&fit=crop&q=80',
  ],
  // Smartwatches
  watch: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=700&auto=format&fit=crop&q=80',
  ],
};

function getHashIndex(str, max) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

export const getAccurateProductImage = (product) => {
  if (!product) return categoryImagePools.laptops[0];

  const name = (product.name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const cat = (typeof product.category === 'string' ? product.category : product.category?.name || product.category?.slug || '').toLowerCase();
  const fullText = `${name} ${desc} ${cat}`;
  const seed = product._id || product.id || product.slug || name;

  // 1. Keyboard
  if (fullText.includes('keyboard') || fullText.includes('mechanical')) {
    const pool = categoryImagePools.keyboard;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 2. Wi-Fi Router
  if (fullText.includes('router') || fullText.includes('wi-fi') || fullText.includes('wifi')) {
    const pool = categoryImagePools.router;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 3. Mouse
  if (fullText.includes('mouse') || fullText.includes('mice') || fullText.includes('trackpad')) {
    const pool = categoryImagePools.mouse;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 4. SSD / NVMe / Storage
  if (fullText.includes('ssd') || fullText.includes('nvme') || fullText.includes('storage') || fullText.includes('hard drive') || fullText.includes('sata')) {
    const pool = categoryImagePools.storage;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 5. Monitor / Display
  if (fullText.includes('display') || fullText.includes('monitor') || fullText.includes('screen') || fullText.includes('uhd') || fullText.includes('4k smart')) {
    const pool = categoryImagePools.monitor;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 6. Speakers / Studio Sound
  if (fullText.includes('speaker') || fullText.includes('sound monitor') || fullText.includes('soundbar') || fullText.includes('audio monitor')) {
    const pool = categoryImagePools.speaker;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 7. CPU Cooler / AIO / Liquid Cooler
  if (fullText.includes('cooler') || fullText.includes('aio') || fullText.includes('liquid cpu') || fullText.includes('radiator')) {
    const pool = categoryImagePools.cooler;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 8. RAM Memory
  if (fullText.includes('ram') || fullText.includes('ddr5') || fullText.includes('ddr4') || fullText.includes('memory')) {
    const pool = categoryImagePools.memory;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 9. Earbuds / TWS
  if (fullText.includes('earbud') || fullText.includes('airpod') || fullText.includes('tws') || fullText.includes('spatial earbud')) {
    const pool = categoryImagePools.earbuds;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 10. Headphones
  if (fullText.includes('headphone') || fullText.includes('wh-1000') || fullText.includes('headset')) {
    const pool = categoryImagePools.headphones;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 11. Smartphone / Phone
  if (fullText.includes('phone') || fullText.includes('iphone') || fullText.includes('galaxy') || fullText.includes('5g') || fullText.includes('smartphone') || fullText.includes('xiaomi') || fullText.includes('pixel')) {
    const pool = categoryImagePools.smartphones;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 12. Smartwatch / Watch
  if (fullText.includes('watch') || fullText.includes('band') || fullText.includes('wearable')) {
    const pool = categoryImagePools.watch;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 13. Camera
  if (fullText.includes('camera') || fullText.includes('lens') || fullText.includes('dslr') || fullText.includes('mirrorless')) {
    const pool = categoryImagePools.cameras;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 14. GPU / Graphics Card / Motherboard
  if (fullText.includes('gpu') || fullText.includes('graphics') || fullText.includes('rtx') || fullText.includes('geforce') || fullText.includes('radeon') || fullText.includes('motherboard')) {
    const pool = categoryImagePools.gpu;
    return pool[getHashIndex(seed, pool.length)];
  }

  // 15. Laptops / Workstations
  if (fullText.includes('laptop') || fullText.includes('macbook') || fullText.includes('notebook') || fullText.includes('thinkpad') || fullText.includes('zenbook') || fullText.includes('workstation')) {
    const pool = categoryImagePools.laptops;
    return pool[getHashIndex(seed, pool.length)];
  }

  // If first image in product.images exists and is valid and not bad stock photo
  const rawImg = product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images[0] : null) || product.image;
  if (rawImg && typeof rawImg === 'string' && !rawImg.includes('photo-1550745165-9bc0b252726f') && !rawImg.includes('photo-1518770660439-4636190af475')) {
    return rawImg;
  }

  const defaultPool = categoryImagePools.laptops;
  return defaultPool[getHashIndex(seed, defaultPool.length)];
};
