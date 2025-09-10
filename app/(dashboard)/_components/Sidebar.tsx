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
    roles: ["ADMIN", "SALES"],
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
  const userRole = session?.user?.role as Role;

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Filter links based on user role (Admin sees everything)
  const filteredLinks = allNavItems.filter(
    (link) => userRole === "ADMIN" || link.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
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
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false} // Disable initial animation
        animate={window.innerWidth < 1024 ? { x: isOpen ? 0 : -300 } : { x: 0 }} // Only animate on mobile
        transition={{ type: "spring", damping: 25 }}
        className="fixed lg:translate-x-0 lg:static inset-y-0 left-0 w-64 bg-white shadow-md p-4 z-40 lg:z-auto"
      >
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
      </motion.aside>
    </>
  );
}
