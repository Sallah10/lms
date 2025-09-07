// import { useState } from 'react';
import { LayoutDashboard, Users, UserCheck, Settings, Car } from 'lucide-react';
import logo from '@/public/1techlink no bg.png';
import Image from 'next/image';
import { Button } from './ui/button';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Lead Listing', icon: Users },
    { id: 'management', label: 'Lead Management', icon: UserCheck }
  ];

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Image src={logo} width={50} height={50} alt='Logo'/>
              <h1 className="text-xl font-semibold text-gray-900">1techLink</h1>
            </div>
            <div className="hidden md:block w-px h-6 bg-gray-300" />
            <span className="hidden md:block text-sm text-gray-500">1techLink</span>
          </div>
          
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => onTabChange(item.id)}
                  className="flex items-center space-x-2 px-3 py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}