import React, { useState } from 'react';
import { InfoIcon, StarsIcon, BankIcon } from '../components/Icons';
import AboutTab from './help/AboutTab';
import FeaturesTab from './help/FeaturesTab';
import GuideTab from './help/GuideTab';

type HelpTab = 'about' | 'features' | 'guide';

const HelpView = () => {
  const [activeTab, setActiveTab] = useState<HelpTab>('about');

  const tabs: { id: HelpTab; label: string; icon: React.ElementType }[] = [
      { id: 'about', label: 'Tentang', icon: InfoIcon },
      { id: 'features', label: 'Fitur', icon: StarsIcon },
      { id: 'guide', label: 'Panduan', icon: BankIcon }, 
  ];

  return (
    <div className="container mx-auto px-4 md:px-8 max-w-5xl flex flex-col h-[calc(100vh-80px)]">
      {/* Header Area - Clean & Centered */}
      <div className="flex-shrink-0 py-6">
          <div className="flex justify-center mb-6">
              <div className="inline-flex bg-[var(--bg-secondary)] p-1.5 rounded-2xl shadow-sm border border-[var(--border-primary)]">
                  {tabs.map((tab) => (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                              activeTab === tab.id
                                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                          }`}
                      >
                          <tab.icon className={activeTab === tab.id ? 'text-white' : 'text-current'} />
                          <span>{tab.label}</span>
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* Content Area - Fluid & Scrollable */}
      <div className="flex-grow overflow-y-auto custom-scrollbar px-1">
          {activeTab === 'about' && <AboutTab />}
          {activeTab === 'features' && <FeaturesTab />}
          {activeTab === 'guide' && <GuideTab />}
      </div>
    </div>
  );
};

export default HelpView;