'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FiPlus, FiLogOut, FiHome, FiMap, FiUser, FiMenu, FiX } from 'react-icons/fi';

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        avatarRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        !avatarRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
    router.push('/login');
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-2' : 'bg-white/80 backdrop-blur-lg py-2'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="group flex items-center space-x-2 transition-transform duration-300 hover:scale-105"
            >
              <div className="p-1">
                <Image 
                  src="/my-notion-face-transparent.png" 
                  alt="Trip Sliptos Logo" 
                  width={40} 
                  height={40}
                  className="w-14 h-14"
                  priority
                />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
                Tripper
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              href="/trips" 
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname?.startsWith('/trips') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              My Trips
            </Link>
            
            {user ? (
              <div className="relative ml-4">
                <button
                  ref={avatarRef}
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-full pl-3 pr-2 py-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-expanded={showMenu}
                  aria-haspopup="true"
                >
                  <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user.displayname || 'User'}
                  </span>
                  <Avatar className="h-8 w-8 ring-2 ring-white">
                    <AvatarImage
                      src={user.photoURL}
                      alt={user.displayname || "User"}
                    />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {user.displayname?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div 
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-10 border border-gray-100 animate-in fade-in slide-in-from-top-5 duration-200"
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.displayname}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link 
                        href="/trips" 
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <FiMap className="mr-3 text-gray-500" />
                        My Trips
                      </Link>
                      <Link
                        href="/trips/new"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <FiPlus className="mr-3 text-gray-500" />
                        New Trip
                      </Link>
                    </div>
                    <div className="py-1 border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiLogOut className="mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
                >
                  Log in
                </Link>
                <Link 
                  href="/login" 
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            {user && (
              <Avatar className="h-8 w-8 mr-3">
                <AvatarImage
                  src={user.photoURL}
                  alt={user.displayname || "User"}
                />
                <AvatarFallback className="bg-blue-600 text-white">
                  {user.displayname?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {mobileMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 mt-3 animate-in slide-in-from-top duration-300">
            <Link 
              href="/trips" 
              className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                pathname?.startsWith('/trips') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                <FiMap className="mr-3" />
                My Trips
              </div>
            </Link>
            
            {user ? (
              <>
                <Link 
                  href="/trips/new" 
                  className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <FiPlus className="mr-3" />
                    New Trip
                  </div>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center">
                    <FiLogOut className="mr-3" />
                    Sign out
                  </div>
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="block px-4 py-3 rounded-lg text-base font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <FiUser className="mr-3" />
                  Sign In
                </div>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
