import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Navigation() {
  const router = useRouter();

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/buy", label: "Buy", icon: "💰" },
    { href: "/swap", label: "Swap", icon: "🔄" },
    { href: "/news", label: "News", icon: "📰" },
    { href: "/wallet", label: "Wallet", icon: "👛" }
  ];

  return (
    <div className="bottom-nav">
      <div className="nav-container">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={`nav-item ${router.pathname === item.href ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}