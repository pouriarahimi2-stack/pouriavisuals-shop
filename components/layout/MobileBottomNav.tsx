"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Home, Grid, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { setIsCartOpen, cartItems } = useCart() as any;
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout')) return null;

  // محاسبه دقیق تعداد اقلام در سبد خرید
  const totalItems = (cartItems || []).reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);

  // تصحیح لینک‌های 404 و استفاده از اکشن به جای لینک برای سبد خرید
  const navItems = [
    { name: "خانه", href: "/", icon: Home },
    { name: "فروشگاه", href: "/products", icon: Grid },
    { name: "سبد خرید", action: () => { soundEngine?.playClick?.(); setIsCartOpen(true); }, icon: ShoppingBag, badge: totalItems },
    { name: "سفارشات", href: "/my-orders", icon: User }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-900/80 aesthetic-bottom-nav /90 backdrop-blur-2xl  border-t border-slate-100 pb-safe pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] transition-all">
      <div className="flex justify-around items-center h-14 px-2">
        {navItems.map((item) => {
          const isActive = item.href ? (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) : false;
          const Icon = item.icon;
          
          const content = (
            <>
              <div className="relative">
                <Icon strokeWidth={isActive ? 2.5 : 1.5} className={`w-6 h-6 transition-all duration-300 ${isActive ? 'text-slate-900 scale-110' : 'text-slate-400'}`} />
                {item.badge !== undefined && item.badge > 0 && isClient && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 transition-all duration-300 ${isActive ? 'font-black text-slate-900' : 'font-bold text-slate-400'}`}>
                {item.name}
              </span>
            </>
          );

          if (item.action) {
            return (
              <button key={item.name} onClick={item.action} className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                {content}
              </button>
            );
          }

          return (
            <Link key={item.name} href={item.href!} onClick={() => soundEngine?.playClick?.()} className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}