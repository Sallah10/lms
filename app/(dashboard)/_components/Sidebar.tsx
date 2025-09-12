"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";

// Define ALL possible navigation items
const allNavItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "🏠",
    roles: ["ADMIN", "SALES", "PDM", "CUSTOMER_CARE"],
  },
  {
    name: "All Leads",
    href: "/dashboard/leads",
    icon: "📋",
    roles: ["ADMIN", "PDM", "CUSTOMER_CARE"],
  },
  {
    name: "My Leads",
    href: "/dashboard/my-leads",
    icon: "🎯",
    roles: ["ADMIN", "SALES", "PDM", "CUSTOMER_CARE"],
  },
  {
    name: "Review",
    href: "/dashboard/review",
    icon: "👀",
    roles: ["ADMIN", "PDM"],
  },
  {
    name: "Verification",
    href: "/dashboard/verification",
    icon: "✅",
    roles: ["ADMIN", "CUSTOMER_CARE"],
  },
  { name: "Users", href: "/dashboard/users", icon: "👥", roles: ["ADMIN"] },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: "📊",
    roles: ["ADMIN", "PDM"],
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: "⚙️",
    roles: ["ADMIN"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const userRole = session?.user?.role as Role;

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize(); // Run once on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter links based on user role (Admin sees everything)
  const filteredLinks = allNavItems.filter(
    (link) => userRole === "ADMIN" || link.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-transparent rounded-md hover:bg-white shadow-md"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span
            className={`block w-5 h-0.5 bg-gray-700 transition-all ${
              isOpen ? "rotate-45 translate-y-1" : ""
            }`}
          ></span>
          <span
            className={`block w-5 h-0.5 bg-gray-700 mt-1 transition-all ${
              isOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`block w-5 h-0.5 bg-gray-700 mt-1 transition-all ${
              isOpen ? "-rotate-45 -translate-y-1" : ""
            }`}
          ></span>
        </div>
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 backdrop-blur-xs bg-opacity-50 z-40"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={
          isMobile ? { x: isOpen ? 0 : -300 } : { x: 0 } // always visible on desktop
        }
        transition={{ type: "spring", damping: 25 }}
        className={`${
          isCollapsed ? "w-16" : "w-64"
        } bg-white shadow-md p-4 z-50 lg:static fixed inset-y-0 left-0 flex flex-col transition-all duration-300`}
      >
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-4 p-2 hover:bg-gray-100 rounded"
        >
          {isCollapsed ? "→" : "←"}
        </button>

        {!isCollapsed && (
          <>
            <h2 className="text-xl font-bold mb-6">LMS</h2>
            <nav className="flex flex-col gap-3">
              {filteredLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center p-2 rounded ${
                    pathname === link.href
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.name}
                </Link>
              ))}
            </nav>
          </>
        )}
      </motion.aside>
    </>
  );
}
