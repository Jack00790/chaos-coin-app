import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Navigation() {
  const router = useRouter();

  const navItems = [
    { href: "/", label: "Home", icon: "", iconType: "home" },
    { href: "/swap", label: "Swap", icon: "", iconType: "swap" },
    { href: "/news", label: "News", icon: "", iconType: "news" },
    { href: "/wallet", label: "Wallet", icon: "", iconType: "wallet" }
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
            <span className={`nav-icon icon-${item.iconType}`}>{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}