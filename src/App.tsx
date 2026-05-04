import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, 
  Battery, 
  VolumeX, 
  ShieldCheck, 
  Truck, 
  ChevronRight, 
  Star, 
  Menu, 
  X, 
  Plus, 
  Minus,
  CheckCircle2,
  AlertTriangle,
  Zap,
  LayoutDashboard,
  ShoppingBag,
  ExternalLink,
  Trash2,
  Edit,
  LogIn,
  LogOut,
  RefreshCcw,
  ArrowRight
} from 'lucide-react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy,
  getDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './lib/firebase';

// --- Components ---

const Navbar = ({ onOpenAdmin }: { onOpenAdmin: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isMenuOpen ? 'bg-white/90 backdrop-blur-md border-b border-slate-100 py-3' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-arctic-500 rounded-full flex items-center justify-center text-white">
            <Wind size={24} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight uppercase">NeckBreeze</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium hover:text-arctic-500 transition-colors">Features</a>
          <a href="#specs" className="text-sm font-medium hover:text-arctic-500 transition-colors">Specs</a>
          <a href="#faq" className="text-sm font-medium hover:text-arctic-500 transition-colors">FAQ</a>
          <button 
            onClick={onOpenAdmin}
            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
          >
            Admin
          </button>
          <button className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-arctic-200">
            Order Now
          </button>
        </div>
        <button 
          className="md:hidden p-2 text-slate-900"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="flex flex-col gap-4 p-6 text-center">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold">Features</a>
              <a href="#specs" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold">Specs</a>
              <a href="#faq" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold">FAQ</a>
              <button 
                onClick={() => { setIsMenuOpen(false); onOpenAdmin(); }}
                className="text-sm font-bold uppercase tracking-widest text-slate-400"
              >
                Admin Panel
              </button>
              <button className="w-full bg-arctic-500 text-white py-4 rounded-xl font-bold">
                Order Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-arctic-50 border border-arctic-100 rounded-full text-arctic-600 text-[10px] font-bold uppercase tracking-widest mb-6">
            <div className="w-1.5 h-1.5 bg-arctic-500 rounded-full animate-pulse" />
            Limited Stock in Bangladesh
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
            Stay Cool <span className="text-arctic-500">Anywhere</span> — Hands-Free 360° Airflow
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
            Ultra-light, USB rechargeable, and whisper-quiet — the perfect companion for the intense heat waves in Bangladesh. Experience personal cooling like never before.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <button className="bg-arctic-500 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-arctic-600 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-arctic-200/50 cursor-pointer">
              Order Yours Now <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-3 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50">
              <Truck size={20} className="text-slate-400" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast Shipping</p>
                <p className="text-xs font-semibold text-slate-600 uppercase">Cash on Delivery Available</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 py-4 border-t border-slate-100">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center">
                   <img src={`https://picsum.photos/seed/user${i}/48/48`} className="rounded-full" referrerPolicy="no-referrer" alt="User" />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-slate-500">
              <span className="text-slate-900 font-bold">1,000+</span> happy customers across BD
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-10 bg-arctic-100/50 blur-3xl rounded-full z-0" />
          <div className="relative z-10 bg-white p-4 rounded-3xl border border-slate-100 shadow-2xl overflow-hidden aspect-[4/5] md:aspect-square flex items-center justify-center">
            <img 
              src="https://picsum.photos/seed/neckfan_studio/800/800" 
              alt="Neck Fan Product Shot" 
              className="w-full h-full object-cover rounded-2xl"
              referrerPolicy="no-referrer"
            />
            {/* Overlay Badges */}
            <div className="absolute top-8 left-8 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-lg border border-white/20">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold uppercase tracking-tight">Bladeless Tech</span>
              </div>
            </div>
            <div className="absolute bottom-8 right-8 bg-arctic-500/90 backdrop-blur px-4 py-2 rounded-2xl shadow-lg text-white">
              <div className="flex items-center gap-2">
                <VolumeX size={16} />
                <span className="text-sm font-bold uppercase tracking-tight">Whisper Quiet</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const ProblemSection = () => {
  const problems = [
    { title: "Heat Exhaustion", desc: "Traveling in public transport or walking during peak sun hours." },
    { title: "Sweating & Discomfort", desc: "Struggling to stay productive at work due to excessive sweat." },
    { title: "Limited Mobility", desc: "Handheld fans occupy your hands, making multitasking difficult." }
  ];

  return (
    <section className="bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <p className="text-arctic-500 font-bold uppercase tracking-widest text-xs mb-4">The Challenge</p>
          <h2 className="text-4xl font-display font-bold mb-6">Why Suffer in Silence?</h2>
          <p className="text-slate-500">The Bangladesh summer is unforgiving. High humidity and soaring temperatures can lead to fatigue, irritation, and decreased productivity.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((p, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">{p.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="flex gap-6 items-start p-6 rounded-3xl hover:bg-slate-50 transition-colors">
    <div className="shrink-0 w-14 h-14 bg-arctic-100 text-arctic-500 rounded-2xl flex items-center justify-center shadow-inner">
      <Icon size={28} />
    </div>
    <div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const SolutionSection = () => {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="grid grid-cols-2 gap-4">
             <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-lg mt-12">
               <img src="https://picsum.photos/seed/fan_use1/400/500" alt="Use case 1" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
             </div>
             <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-lg">
               <img src="https://picsum.photos/seed/fan_use2/400/500" alt="Use case 2" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
             </div>
          </div>
          <div>
            <p className="text-arctic-500 font-bold uppercase tracking-widest text-xs mb-4">The Solution</p>
            <h2 className="text-4xl font-display font-bold mb-8">Unmatched Cooling Performance</h2>
            <div className="space-y-4">
              <FeatureCard 
                icon={Wind} 
                title="360° Surround Airflow" 
                desc="Engineered with 48 air outlets to ensure breeze reaches your entire neck and face simultaneous." 
              />
              <FeatureCard 
                icon={Battery} 
                title="12h Long Battery" 
                desc="Large 4000mAh battery keeps you cool from your morning commute to the evening stroll." 
              />
              <FeatureCard 
                icon={ShieldCheck} 
                title="Safe Bladeless Design" 
                desc="Safe for long hair. No worries about hair getting caught, unlike traditional handheld fans." 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SpecsSection = () => {
  const specs = [
    { label: "Battery Capacity", value: "4000mAh (Type-C)" },
    { label: "Working Time", value: "3 - 12 Hours" },
    { label: "Noise Level", value: "< 25dB (Ultra Quiet)" },
    { label: "Weight", value: "250g (Lightweight)" },
    { label: "Material", value: "Skin-friendly Silicone + ABS" },
    { label: "Speed Levels", value: "3 Mode Selection" },
  ];

  return (
    <section id="specs" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold mb-4">Technical Specifications</h2>
          <p className="text-slate-500 text-sm">Built for reliability and all-day comfort.</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          {specs.map((s, i) => (
            <div key={i} className="data-grid-item">
              <span className="label-mono">{s.label}</span>
              <span className="value-mono">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SocialProof = () => {
  const reviews = [
    { name: "Rafiq A.", rating: 5, comment: "Game changer for Dhaka commute! The build quality is amazing." },
    { name: "Sumaiya K.", rating: 5, comment: "I use it in the kitchen. Very quiet and lightweight." },
    { name: "Anisur R.", rating: 4, comment: "Battery lasts all day as promised. Value for money." }
  ];

  return (
    <section className="py-24 bg-sky-50/50">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-display font-bold mb-16">Loved by Thousands</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-center gap-1 mb-4 text-yellow-400">
                {[...Array(r.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-slate-600 italic mb-6">"{r.comment}"</p>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">— {r.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQ = () => {
  const questions = [
    { q: "How long does it take to charge?", a: "It takes about 3 hours for a full charge using the included USB-C cable." },
    { q: "Is it suitable for sports or running?", a: "Yes, the ergonomic design ensures it stays securely around your neck even during light exercise." },
    { q: "Does hair get caught in it?", a: "Not at all. The bladeless design is specifically engineered to be hair-safe." },
    { q: "What is your replacement policy?", a: "We offer a 7-day easy replacement guarantee for any manufacturing defects." }
  ];

  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-display font-bold mb-12 text-center">Got Questions?</h2>
        <div className="space-y-4">
          {questions.map((item, i) => (
            <details key={i} className="group border border-slate-100 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between bg-white p-6 transition-colors group-hover:bg-slate-50">
                <h3 className="text-lg font-bold">{item.q}</h3>
                <span className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-900 group-open:-rotate-180 transition-transform">
                  <ChevronRight size={18} />
                </span>
              </summary>
              <div className="p-6 pt-0 bg-white border-t border-slate-50">
                <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

const OfferSection = () => {
  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-20 bg-arctic-500/20 blur-[100px] rounded-full" />
      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <div className="inline-block px-4 py-1 bg-arctic-500 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-8">
          Eid Special Offer
        </div>
        <h2 className="text-5xl md:text-6xl font-display font-bold mb-6">Grab Yours Before <br /> the Heat Wave Hits</h2>
        <p className="text-slate-400 mb-10 text-lg">Order now and get 15% off + Free Delivery across Bangladesh.</p>
        
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] max-w-2xl mx-auto mb-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-left">
                <p className="text-xs font-bold text-arctic-400 uppercase tracking-widest mb-1 text-center md:text-left">Special Price</p>
                <div className="flex items-center gap-4 justify-center md:justify-start">
                  <span className="text-5xl font-display font-bold">৳1,450</span>
                  <span className="text-2xl text-white/30 line-through">৳1,800</span>
                </div>
              </div>
              <button className="w-full md:w-auto bg-white text-slate-900 px-10 py-5 rounded-2xl text-lg font-bold hover:bg-arctic-50 transition-all shadow-xl shadow-white/5">
                Order via COD
              </button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-[10px] uppercase font-bold tracking-widest text-white/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-white" />
                No Payment Upfront
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-white" />
                Verified Product
              </div>
            </div>
        </div>
        <p className="text-arctic-400 animate-pulse font-bold text-sm">⚠️ High Demand: Only 14 units left for today!</p>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Wind size={20} className="text-arctic-500" />
          <span className="font-display font-bold text-lg uppercase tracking-tight">NeckBreeze</span>
        </div>
        <p className="text-sm text-slate-400 max-w-sm mx-auto mb-8">Providing the ultimate cooling tech for a smarter lifestyle. Registered in Dhaka, Bangladesh.</p>
        <div className="flex justify-center gap-8 mb-8">
           <a href="#" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Privacy</a>
           <a href="#" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Terms</a>
           <a href="#" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Contact</a>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-bold">© 2024 NeckBreeze. All rights reserved.</p>
      </div>
    </footer>
  );
};

const OrderForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const orderData = {
        customerName: formData.name,
        address: formData.address,
        phone: formData.phone,
        status: 'pending',
        total: 1450,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderId(docRef.id);
      setIsSubmitted(true);
      console.log('Order Submitted to Firestore:', docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="order" className="py-24 bg-white">
      <div className="max-w-xl mx-auto px-6">
        <div className="bg-slate-50 border border-slate-100 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200">
          <AnimatePresence>
            {isSubmitted && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-green-50 border border-green-100 rounded-3xl text-center"
              >
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-2">অর্ডার সফলভাবে গ্রহণ করা হয়েছে!</h3>
                <p className="text-green-700 text-sm mb-4">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
                
                <div className="text-left bg-white p-4 rounded-2xl border border-green-200 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">অর্ডার সামারি:</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">অর্ডার আইডি:</span>
                    <span className="font-mono font-bold text-slate-900">{orderId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">নাম:</span>
                    <span className="font-bold text-slate-900">{formData.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">মোবাইল:</span>
                    <span className="font-bold text-slate-900">{formData.phone}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-sm">
                    <p className="text-slate-500 mb-1">ঠিকানা:</p>
                    <p className="font-medium text-slate-900 leading-relaxed">{formData.address}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold mb-4">অর্ডার করতে নিচের ফর্মটি পূরণ করুন</h2>
            <p className="text-slate-500 text-sm italic">ক্যাশ অন ডেলিভারি সুবিধা (পণ্য হাতে পেয়ে টাকা পরিশোধ করুন)</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">আপনার নাম:</label>
              <input 
                type="text" 
                id="name"
                name="name"
                required
                disabled={isSubmitted}
                value={formData.name}
                onChange={handleChange}
                placeholder="পুরো নাম লিখুন"
                className={`w-full px-5 py-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-arctic-500 transition-all text-slate-900 ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">ঠিকানা (বিস্তারিত):</label>
              <textarea 
                id="address"
                name="address"
                required
                disabled={isSubmitted}
                value={formData.address}
                onChange={handleChange}
                placeholder="আপনার পূর্ণ ঠিকানা লিখুন"
                rows={3}
                className={`w-full px-5 py-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-arctic-500 transition-all text-slate-900 ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">মোবাইল নাম্বার:</label>
              <input 
                type="tel" 
                id="phone"
                name="phone"
                required
                disabled={isSubmitted}
                value={formData.phone}
                onChange={handleChange}
                placeholder="১১ ডিজিটের নাম্বার লিখুন"
                className={`w-full px-5 py-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-arctic-500 transition-all text-slate-900 ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            {!isSubmitted && (
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-arctic-500 text-white py-5 rounded-2xl text-xl font-bold hover:bg-arctic-600 transition-all shadow-xl shadow-arctic-100 flex items-center justify-center gap-2 mt-4 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isSubmitting ? 'প্রসেসিং হচ্ছে...' : 'অর্ডার করুন'}
              </button>
            )}

            {isSubmitted && (
              <div className="w-full bg-slate-200 text-slate-500 py-5 rounded-2xl text-xl font-bold text-center mt-4">
                অর্ডার সম্পন্ন হয়েছে
              </div>
            )}
          </form>
          
          <div className="mt-8 flex items-center justify-center gap-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">
            <ShieldCheck size={14} className="text-arctic-500" />
            100% সুরক্ষিত শপিং
          </div>
        </div>
      </div>
    </section>
  );
};

const AdminPanel = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status });
      fetchOrders();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      fetchOrders();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 py-4 px-6 fixed top-0 w-full z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <LayoutDashboard className="text-arctic-500" />
             <h1 className="font-display font-bold text-xl uppercase">NeckBreeze Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400">{user.email}</span>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 max-w-7xl mx-auto px-6">
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
          >
            Manage Orders
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
          >
            Manage Products
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center">
               <h2 className="font-bold text-xl">Recent Orders</h2>
               <button onClick={fetchOrders} className="p-2 text-slate-400 hover:text-arctic-500">
                 <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
               </button>
             </div>
             
             {isLoading ? (
               <div className="p-20 text-center text-slate-400">Loading orders...</div>
             ) : orders.length === 0 ? (
               <div className="p-20 text-center text-slate-400">No orders found.</div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50">
                       <th className="px-6 py-4">Customer</th>
                       <th className="px-6 py-4">Contact</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4">Total</th>
                       <th className="px-6 py-4">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {orders.map((order) => (
                       <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-6 py-5">
                            <p className="font-bold text-slate-900">{order.customerName}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{order.address}</p>
                         </td>
                         <td className="px-6 py-5">
                            <p className="text-sm font-medium">{order.phone}</p>
                         </td>
                         <td className="px-6 py-5">
                            <select 
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className={`text-[10px] font-bold uppercase tracking-tighter px-3 py-1 rounded-full border-none focus:ring-2 focus:ring-arctic-500 cursor-pointer ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                         </td>
                         <td className="px-6 py-5 font-mono text-sm font-bold">৳{order.total}</td>
                         <td className="px-6 py-5">
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => deleteOrder(order.id)}
                                 className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                               >
                                 <Trash2 size={16} />
                               </button>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        ) : (
          <div className="bg-white p-20 rounded-[2rem] border border-slate-100 shadow-xl text-center">
            <ShoppingBag className="mx-auto text-slate-200 mb-4" size={48} />
            <h2 className="font-bold text-xl mb-2">Product Management</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">This section is for managing the inventory. Currently optimized for the NeckBreeze signature model.</p>
            <div className="mt-8 flex justify-center gap-4">
               <button className="bg-arctic-500 text-white px-6 py-2 rounded-xl text-sm font-bold opacity-50 cursor-not-allowed">
                 Add Product (Coming Soon)
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'main' | 'admin'>('main');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Special check for chuirmart@gmail.com
        if (user.email === 'chuirmart@gmail.com') {
          setIsAdmin(true);
        } else {
          // Check in admins collection
          try {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            setIsAdmin(adminDoc.exists());
          } catch {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setIsLoadingAuth(false);
    });
    return unsub;
  }, []);

  const handleAdminLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('main');
  };

  const openAdmin = () => {
    setView('admin');
    window.scrollTo(0, 0);
  };

  if (view === 'admin') {
    if (isLoadingAuth) return <div className="h-screen flex items-center justify-center font-display font-bold">Checking access...</div>;
    
    if (!user || !isAdmin) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-2xl text-center">
            <div className="w-20 h-20 bg-arctic-100 text-arctic-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
               <ShieldCheck size={40} />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">Admin Access</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">Only authorized personnel can enter the management portal.</p>
            {!user ? (
              <button 
                onClick={handleAdminLogin}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl"
              >
                <LogIn size={20} /> Sign in as Admin
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
                  Access denied for {user.email}
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full border border-slate-200 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50"
                >
                  Switch Account
                </button>
              </div>
            )}
            <button 
              onClick={() => setView('main')}
              className="mt-8 text-sm font-bold text-arctic-500 flex items-center justify-center gap-2 mx-auto"
            >
              Back to Store <ArrowRight size={14} />
            </button>
          </div>
        </div>
      );
    }

    return <AdminPanel user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen selection:bg-arctic-100">
      <Navbar onOpenAdmin={openAdmin} />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <SpecsSection />
        <SocialProof />
        <OfferSection />
        <OrderForm />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
