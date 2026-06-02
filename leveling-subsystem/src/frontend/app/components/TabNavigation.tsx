import { Swords, HelpCircle, Grid3x3, Scroll } from 'lucide-react';

type Tab = 'battle-predictor' | 'guess-pokemon' | 'match-pokemon' | 'battle-logger';

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    {
      id: 'battle-predictor' as Tab,
      label: 'Battle Predictor',
      icon: <Swords className="w-6 h-6" />,
      color: '#EF4444'
    },
    {
      id: 'guess-pokemon' as Tab,
      label: 'Guess That Pokemon',
      icon: <HelpCircle className="w-6 h-6" />,
      color: '#2563EB'
    },
    {
      id: 'match-pokemon' as Tab,
      label: 'Match That Pokemon',
      icon: <Grid3x3 className="w-6 h-6" />,
      color: '#FBBF24'
    },
    {
      id: 'battle-logger' as Tab,
      label: 'Battle Result Logger',
      icon: <Scroll className="w-6 h-6" />,
      color: '#8B5CF6'
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-2 border-4 border-gray-200 shadow-2xl">
      <div className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative rounded-2xl p-4 transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-br shadow-lg scale-105'
                  : 'bg-gray-50 hover:bg-gray-100 hover:scale-102'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: tab.color,
                      boxShadow: `0 4px 20px ${tab.color}40`
                    }
                  : {}
              }
            >
              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white animate-pulse"
                  style={{ backgroundColor: tab.color }}
                ></div>
              )}

              {/* Tab Content */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`transition-colors ${
                    isActive ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {tab.icon}
                </div>
                <span
                  className={`text-sm text-center font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {tab.label}
                </span>
              </div>

              {/* Bottom border accent */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-full"
                  style={{ backgroundColor: 'white' }}
                ></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
