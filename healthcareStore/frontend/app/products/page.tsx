'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser, logout } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  LogOut, Search, Sparkles, Star, Package, Heart,
  ShoppingCart, Filter, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';

import ChatBot from '@/components/ChatBot';
import Logo from '@/components/Logo';

const SLIDER_IMAGES = [
    'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=1200&q=80',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&q=80',
  'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&q=80',
];

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  tags: string[];
  brand: string;
  rating: number;
  inStock: boolean;
}

function HeroSlider({ products }: { products: Product[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDER_IMAGES.length);
    }, 3500);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const go = (idx: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrent(idx);
    startTimer();
  };

  return (
    <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden" style={{ minHeight: 260 }}>

      {/* Slider images — full box */}
      {SLIDER_IMAGES.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`slide-${i}`}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        />
      ))}

      {/* Green overlay — heavy left, fades to transparent right */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(91, 153, 40, 0.95) 0%, rgba(103, 161, 50, 0.85) 25%, rgba(106,158,47,0.50) 55%, rgba(139,195,74,0.10) 80%, transparent 100%)' }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Content */}
      <div className="relative z-10 p-7 sm:p-10 md:p-14">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 sm:mb-5 text-xs font-bold uppercase tracking-widest"
          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
          <Sparkles size={11} /> AI-Powered Healthcare Platform
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4 leading-tight tracking-tight">
          Find Your Perfect{' '}
          <span style={{ color: 'rgba(255,255,255,0.85)' }}>Health Products</span>
        </h1>
        <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-5 max-w-lg">
          Browse our curated selection or let AI find exactly what your body needs
        </p>
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {[
            { label: 'Products', value: `${products.length}+` },
            { label: 'Brands', value: '50+' },
            { label: 'Happy Customers', value: '10K+' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black text-white">{s.value}</span>
              <span className="text-xs text-white/60 font-medium">{s.label}</span>
              {i < 2 && <div className="w-px h-4 bg-white/20 ml-1 hidden sm:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button onClick={() => go((current - 1 + SLIDER_IMAGES.length) % SLIDER_IMAGES.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.4)', color: 'white' }}>
        <ChevronLeft size={18} />
      </button>
      <button onClick={() => go((current + 1) % SLIDER_IMAGES.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.4)', color: 'white' }}>
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDER_IMAGES.map((_, i) => (
          <button key={i} onClick={() => go(i)}
            className="rounded-full transition-all duration-300"
            style={{ width: i === current ? 22 : 8, height: 8, background: i === current ? 'white' : 'rgba(255,255,255,0.4)' }} />
        ))}
      </div>
    </div>
  );
}

const CATEGORIES = ['All', 'Vitamins', 'Supplements', 'Bone Health', 'Heart Health', 'Immunity', 'Skin Care'];

export default function ProductsPage() {
  const router = useRouter();
  const user = getUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartItems, setCartItems] = useState<{ id: number; name: string; price: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setShowUserMenu(false);
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setShowCart(false);
      }
    };
    if (showUserMenu || showCart) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu, showCart]);

  const addToCart = (product: Product) => {
    setCartItems(prev => [...prev, { id: Date.now(), name: product.name, price: product.price }]);
  };

  const handleCheckout = () => {
    setCheckoutDone(true);
    setCartItems([]);
    setShowCart(false);
    setTimeout(() => setCheckoutDone(false), 3000);
  };

  const cartTotal = cartItems.reduce((sum, i) => sum + i.price, 0);

  const fetchProducts = useCallback(async (q = '', ai = false) => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (ai) params.set('ai', 'true');
      const { data } = await api.get(`/products?${params}`);
      setProducts(data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/'); return; }
    fetchProducts();
    setMounted(true);
  }, [router, fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(searchQuery, aiMode);
  };

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(p => p.category?.toLowerCase().includes(activeCategory.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fdf2' }}>
        <div className="text-center">
          <div className="relative inline-flex mb-5">
            <div className="w-20 h-20 rounded-full animate-spin"
              style={{ border: '4px solid #e8f5d0', borderTopColor: '#8bc34a' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart size={22} style={{ color: '#8bc34a' }} fill="#8bc34a" />
            </div>
          </div>
          <p className="text-sm font-medium animate-pulse" style={{ color: '#6a9e2f' }}>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8fdf2' }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(139,195,74,0.2)',
          boxShadow: '0 2px 20px rgba(139,195,74,0.08)',
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">

          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Logo size="sm" variant="dark" />
          </div>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8bc34a' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) fetchProducts('', aiMode); }}
                placeholder={aiMode ? 'Describe your health concern...' : 'Search products, brands...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none font-medium transition-all"
                style={{ background: '#f0f7e6', border: '1.5px solid rgba(139,195,74,0.25)', color: '#1a3a06' }}
                onFocus={(e) => { e.target.style.borderColor = '#8bc34a'; e.target.style.boxShadow = '0 0 0 3px rgba(139,195,74,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(139,195,74,0.25)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <button type="button" onClick={() => setAiMode(!aiMode)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex-shrink-0"
              style={aiMode
                ? { background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)', color: 'white', boxShadow: '0 4px 16px rgba(139,195,74,0.4)' }
                : { background: '#f0f7e6', border: '1.5px solid rgba(139,195,74,0.25)', color: '#6a9e2f' }}>
              <Sparkles size={13} /> AI
            </button>
            <button type="submit" disabled={searching}
              className="px-4 py-2.5 text-white text-xs font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)', boxShadow: '0 4px 16px rgba(139,195,74,0.35)' }}>
              {searching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Cart dropdown */}
            <div className="relative" ref={cartRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowCart(v => !v); }}
                className="relative p-2 sm:p-2.5 rounded-xl transition-colors"
                style={{ background: '#f0f7e6', border: '1px solid rgba(139,195,74,0.2)', color: '#6a9e2f' }}>
                <ShoppingCart size={15} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-black flex items-center justify-center"
                    style={{ background: '#8bc34a' }}>
                    {cartItems.length}
                  </span>
                )}
              </button>

              {showCart && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-2xl overflow-hidden z-50"
                  style={{ background: '#fff', border: '1px solid rgba(139,195,74,0.2)', boxShadow: '0 8px 30px rgba(139,195,74,0.15)' }}
                  onClick={(e) => e.stopPropagation()}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(139,195,74,0.15)' }}>
                    <p className="text-xs font-bold" style={{ color: '#1a3a06' }}>My Cart ({cartItems.length})</p>
                  </div>
                  {cartItems.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs" style={{ color: '#9ca3af' }}>Your cart is empty</div>
                  ) : (
                    <>
                      <div className="max-h-52 overflow-y-auto">
                        {cartItems.map((item, idx) => (
                          <div key={item.id} className="flex items-center justify-between px-4 py-2.5 border-b"
                            style={{ borderColor: 'rgba(139,195,74,0.08)', background: idx % 2 === 0 ? '#fff' : '#fafff5' }}>
                            <p className="text-xs font-medium flex-1 truncate pr-2" style={{ color: '#1a3a06' }}>{item.name}</p>
                            <p className="text-xs font-bold flex-shrink-0" style={{ color: '#6a9e2f' }}>${item.price}</p>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(139,195,74,0.15)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold" style={{ color: '#6b7280' }}>Total</p>
                          <p className="text-sm font-black" style={{ color: '#1a3a06' }}>${cartTotal.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={handleCheckout}
                          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.97]"
                          style={{ background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)', boxShadow: '0 4px 16px rgba(139,195,74,0.35)' }}>
                          Checkout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="relative hidden sm:block">
              <button
                onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors"
                style={{ background: '#f0f7e6', border: '1px solid rgba(139,195,74,0.2)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black"
                  style={{ background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)' }}>
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-semibold max-w-[80px] truncate" style={{ color: '#2d5a0e' }}>{user?.name}</span>
                <ChevronDown size={13} style={{ color: '#8bc34a' }} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl overflow-hidden z-50"
                  style={{ background: '#fff', border: '1px solid rgba(139,195,74,0.2)', boxShadow: '0 8px 30px rgba(139,195,74,0.15)' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(139,195,74,0.15)' }}>
                    <p className="text-xs font-bold" style={{ color: '#1a3a06' }}>{user?.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#8bc34a' }}>Signed in</p>
                  </div>
                  <button
                    onClick={() => { logout(); router.replace('/'); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors hover:bg-red-50"
                    style={{ color: '#ef4444' }}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-10">

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8bc34a' }} />
            <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) fetchProducts('', aiMode); }}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none font-medium"
              style={{ background: '#fff', border: '1.5px solid rgba(139,195,74,0.3)', color: '#1a3a06' }} />
          </div>
          <button type="button" onClick={() => setAiMode(!aiMode)}
            className="px-3 py-3 rounded-xl text-xs font-bold flex items-center gap-1"
            style={aiMode
              ? { background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)', color: 'white' }
              : { background: '#f0f7e6', border: '1.5px solid rgba(139,195,74,0.25)', color: '#6a9e2f' }}>
            <Sparkles size={13} />
          </button>
          <button type="submit"
            className="px-4 py-3 text-white text-sm font-bold rounded-xl"
            style={{ background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)' }}>Go</button>
        </form>

        {/* Hero Banner */}
        <div className={`mb-8 sm:mb-12 ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
          <HeroSlider products={products} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <span className="text-sm font-medium" style={{ color: '#6b7280' }}>
            {searching ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: '#e8f5d0', borderTopColor: '#8bc34a' }} />
                Finding products...
              </span>
            ) : (
              <span>
                <span className="font-bold" style={{ color: '#111827' }}>{filteredProducts.length}</span>
                {' '}product{filteredProducts.length !== 1 ? 's' : ''} found
              </span>
            )}
          </span>
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl cursor-pointer transition-colors"
            style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}>
            <Filter size={13} /> Sort & Filter <ChevronDown size={13} />
          </div>
        </div>

        {aiMode && (
          <p className="mb-6 text-center text-sm flex items-center justify-center gap-1.5 animate-fade-in font-medium" style={{ color: '#6b7280' }}>
            <Sparkles size={13} /> AI mode on — describe symptoms or health goals for smart recommendations
          </p>
        )}

        {/* Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ background: '#f0f7e6', border: '2px dashed rgba(139,195,74,0.4)' }}>
              <Package size={32} style={{ color: '#8bc34a' }} />
            </div>
            <p className="font-bold text-lg" style={{ color: '#2d5a0e' }}>No products found</p>
            <p className="text-sm mt-1" style={{ color: '#6a9e2f' }}>Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map((product, i) => (
              <ProductCard key={product._id} product={product} index={i}
                onAddToCart={() => addToCart(product)} />
            ))}
          </div>
        )}
      </div>

      {checkoutDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-3xl px-10 py-10 text-center"
            style={{ background: '#fff', boxShadow: '0 24px 64px rgba(139,195,74,0.25)', border: '1px solid rgba(139,195,74,0.2)', maxWidth: 320 }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)' }}>
              <span className="text-white text-2xl font-black">✓</span>
            </div>
            <p className="text-lg font-black mb-1" style={{ color: '#1a3a06' }}>Order Placed!</p>
            <p className="text-sm" style={{ color: '#6b7280' }}>Your order has been successfully placed.</p>
          </div>
        </div>
      )}

      <ChatBot />
    </div>
  );
}

function ProductCard({ product, index, onAddToCart }: {
  product: Product;
  index: number;
  onAddToCart: () => void;
}) {
  const [wishlist, setWishlist] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!product.inStock) return;
    setAdded(true);
    onAddToCart();
    toast.success(`${product.name} added!`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      className="rounded-2xl sm:rounded-3xl overflow-hidden animate-card-in group"
      style={{
        animationDelay: `${index * 0.04}s`,
        opacity: 0,
        background: '#ffffff',
        border: '1px solid rgba(139,195,74,0.15)',
        boxShadow: '0 2px 12px rgba(139,195,74,0.06)',
        transition: 'transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translateY(-6px)';
        el.style.boxShadow = '0 20px 50px rgba(139,195,74,0.18)';
        el.style.borderColor = 'rgba(139,195,74,0.35)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '0 2px 12px rgba(139,195,74,0.06)';
        el.style.borderColor = 'rgba(139,195,74,0.15)';
      }}>

      {/* Image */}
      <div className="relative h-44 sm:h-52 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f0f7e6 0%, #e8f5d0 100%)' }}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e8f5d0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%236a9e2f'%3ENo Image%3C/text%3E%3C/svg%3E"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.92)', color: '#6a9e2f', border: '1px solid rgba(139,195,74,0.3)' }}>
          {product.category}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); setWishlist(!wishlist); }}
          className="absolute top-3 right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(139,195,74,0.2)' }}>
          <Heart
            size={14}
            className="transition-all duration-300"
            style={{ color: wishlist ? '#ef4444' : '#8bc34a', fill: wishlist ? '#ef4444' : 'none' }}
          />
        </button>

        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)' }}>
            <span className="text-xs font-bold px-4 py-2 rounded-full"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 sm:p-5">
        <p className="text-xs font-bold mb-1 uppercase tracking-widest" style={{ color: '#9ca3af' }}>{product.brand}</p>
        <h3 className="font-black mb-1.5 line-clamp-1 text-sm" style={{ color: '#111827' }}>{product.name}</h3>
        <p className="text-xs line-clamp-2 mb-4 leading-relaxed" style={{ color: '#6b7280' }}>{product.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <Star size={11} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
            <span className="text-xs font-bold" style={{ color: '#d97706' }}>{product.rating}</span>
          </div>
          <span className="text-lg sm:text-xl font-black" style={{ color: '#111827' }}>${product.price}</span>
        </div>

        <button
          onClick={handleAdd}
          disabled={!product.inStock}
          className={`w-full py-2.5 sm:py-3 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            !product.inStock ? 'cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.97]'
          }`}
          style={product.inStock ? (added ? {
            background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)',
            boxShadow: '0 6px 20px rgba(16,185,129,0.3)',
            color: 'white',
            border: 'none',
          } : {
            background: 'transparent',
            border: '1.5px solid #e5e7eb',
            color: '#374151',
          }) : {
            background: '#f0f7e6',
            border: '1px solid rgba(139,195,74,0.2)',
            color: '#a0b890',
          }}
          onMouseEnter={(e) => {
            if (!product.inStock || added) return;
            const btn = e.currentTarget;
            btn.style.background = 'linear-gradient(135deg, #8bc34a, #6a9e2f)';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.boxShadow = '0 6px 20px rgba(139,195,74,0.3)';
          }}
          onMouseLeave={(e) => {
            if (!product.inStock || added) return;
            const btn = e.currentTarget;
            btn.style.background = 'transparent';
            btn.style.color = '#374151';
            btn.style.border = '1.5px solid #e5e7eb';
            btn.style.boxShadow = 'none';
          }}>
          {product.inStock
            ? added ? <>&#10003; Added to Cart</> : <><ShoppingCart size={14} />Add to Cart</>
            : 'Unavailable'}
        </button>
      </div>
    </div>
  );
}
