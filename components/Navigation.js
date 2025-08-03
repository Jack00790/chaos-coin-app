
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "🏠" },
    { href: "/news", label: "News", icon: "📰" },
    { href: "/admin", label: "Admin", icon: "⚙️" }
  ];

  return (
    <nav className="mobile-nav">
      <div className="nav-container">
        {/* Mobile menu button */}
        <button 
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>

        {/* Desktop navigation */}
        <div className="desktop-nav">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`nav-link ${router.pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile dropdown menu */}
        {isMenuOpen && (
          <div className="mobile-menu">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`mobile-nav-link ${router.pathname === item.href ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
