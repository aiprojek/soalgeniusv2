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
    <div className="mx-auto w-full max-w-5xl flex flex-col h-[calc(100vh-80px)] px-1 sm:px-2 md:px-4">
      {/* Header Area - Clean & Centered */}
      <div className="flex-shrink-0 py-3 sm:py-4">
          <div className="flex justify-center mb-4">
              <div className="inline-flex app-tab-shell p-1 overflow-x-auto max-w-full">
                  {tabs.map((tab) => (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`app-tab-button flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold whitespace-nowrap ${
                              activeTab === tab.id
                                  ? 'app-tab-button-active'
                                  : ''
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
      <div className="flex-grow overflow-y-auto custom-scrollbar px-1 pb-4">
          {activeTab === 'about' && <AboutTab />}
          {activeTab === 'features' && <FeaturesTab />}
          {activeTab === 'guide' && <GuideTab />}
      </div>
    </div>
  );
};

export default HelpView;
