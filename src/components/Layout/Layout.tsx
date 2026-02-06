import { useState } from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: (activeTab: string) => React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [activeTab, setActiveTab] = useState('home');

  const handleHomeClick = () => {
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onHomeClick={handleHomeClick} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children(activeTab)}
      </main>
    </div>
  );
}
