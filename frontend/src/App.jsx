import React from 'react';
import { useVidyut } from './VidyutContext';
import Login from './components/Login';
import Welcome from './components/Welcome';
import SurveyHome from './components/SurveyHome';
import SurveyAppliances from './components/SurveyAppliances';
import SurveyEV from './components/SurveyEV';
import SurveyBill from './components/SurveyBill';
import AIProcessing from './components/AIProcessing';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import Recommendations from './components/Recommendations';
import Reports from './components/Reports';
import Profile from './components/Profile';

export default function App() {
  const { isLoggedIn, surveyStep, currentTab } = useVidyut();

  // 1. Auth Gate
  if (!isLoggedIn) {
    return <Login />;
  }

  // 2. Onboarding Stepper Flow Gate
  switch (surveyStep) {
    case 'welcome':
      return <Welcome />;
    case 'profile':
      return <SurveyHome />;
    case 'appliances':
      return <SurveyAppliances />;
    case 'ev':
      return <SurveyEV />;
    case 'bill':
      return <SurveyBill />;
    case 'processing':
      return <AIProcessing />;
    case 'completed':
    default:
      // Fall through to main app shell below
      break;
  }

  // 3. Main Dashboard SaaS Shell
  return (
    <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden font-sans">
      
      {/* Primary Sidebar Menu (Left) */}
      <Sidebar />

      {/* Main Working Panel (Right) */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        
        {/* Sticky Topbar */}
        <Topbar />

        {/* Tab content area (scrollable) */}
        <main className="flex-1 overflow-y-auto bg-slate-50/20">
          {currentTab === 'dashboard' && <Dashboard />}
          {currentTab === 'recommendations' && <Recommendations />}
          {currentTab === 'reports' && <Reports />}
          {currentTab === 'profile' && <Profile />}
        </main>
      </div>
    </div>
  );
}
