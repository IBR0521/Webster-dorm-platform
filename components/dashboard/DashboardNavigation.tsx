'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  WashingMachine,
  Dumbbell,
  Sparkles,
  UserCircle,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  MessageSquare,
} from 'lucide-react';

export default function DashboardNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, currentUser, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Laundry', href: '/dashboard/laundry', icon: WashingMachine },
    { label: 'Gym', href: '/dashboard/gym', icon: Dumbbell },
    ...(!isAdmin
      ? [{ label: 'Kitchen Duty', href: '/dashboard/clean-duty', icon: Sparkles } as const]
      : []),
    { label: 'Comments', href: '/dashboard/comments', icon: MessageSquare },
    { label: 'Profile', href: '/dashboard/profile', icon: UserCircle },
  ];

  const adminItems = [
    { label: 'Admin Panel', href: '/dashboard/admin', icon: ShieldCheck },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur border-b border-gray-200/70 md:hidden z-40 flex items-center justify-between px-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-gray-900">
          Webster
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-700"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav
        className={`fixed left-0 top-16 md:top-0 w-64 h-[calc(100vh-4rem)] md:h-screen bg-white border-r border-gray-200 overflow-y-auto transition-all duration-200 z-30 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Webster</h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Dorm Platform</p>
        </div>

        <div className="px-4 py-4 md:hidden border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-700">{currentUser?.name}</p>
          <p className="text-xs text-gray-500">{currentUser?.email}</p>
        </div>

        <div className="p-4 space-y-1">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700 border border-blue-100 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {isAdmin && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Admin
                </p>
                {adminItems.map((item) => (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 border border-blue-100 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="hidden md:block mb-4 pb-4 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-700">{currentUser?.name}</p>
            <p className="text-xs text-gray-500">{currentUser?.email}</p>
            {isAdmin && (
              <p className="text-xs text-blue-600 font-medium mt-1">Admin Account</p>
            )}
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>
    </>
  );
}
