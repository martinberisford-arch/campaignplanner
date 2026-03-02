import { AppProvider, useApp } from './store/AppContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import DashboardHub from './pages/DashboardHub';
import CalendarView from './pages/CalendarView';
import Campaigns from './pages/Campaigns';
import AIBriefGenerator from './pages/AIBriefGenerator';
import Approvals from './pages/Approvals';
import KPIDashboard from './pages/KPIDashboard';
import Assets from './pages/Assets';
import CampaignDetail from './pages/CampaignDetail';
import Settings from './pages/Settings';
import MktStrategy from './pages/MktStrategy';
import MktCalendar from './pages/MktCalendar';
import MktIdeas from './pages/MktIdeas';
import MktPerformance from './pages/MktPerformance';
import MktIntelligence from './pages/MktIntelligence';
import MktIdeation from './pages/MktIdeation';
import MktBrief from './pages/MktBrief';
import MktMessaging from './pages/MktMessaging';
import ContentLog from './pages/ContentLog';
import AdminKpis from './pages/AdminKpis';
import AdminAudiences from './pages/AdminAudiences';
import Backups from './pages/Backups';
import { useRef, useEffect, useState } from 'react';

function PageTransition({ viewKey, children }: { viewKey: string; children: React.ReactNode }) {
  const [displayKey, setDisplayKey] = useState(viewKey);
  const [transitioning, setTransitioning] = useState(false);
  const prevKey = useRef(viewKey);

  useEffect(() => {
    if (viewKey !== prevKey.current) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayKey(viewKey);
        setTransitioning(false);
        prevKey.current = viewKey;
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [viewKey]);

  // Suppress unused variable
  void displayKey;

  return (
    <div
      className={`transition-all duration-150 ${
        transitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
      }`}
    >
      {children}
    </div>
  );
}

function AppRouter() {
  const { currentView, isAuthenticated } = useApp();

  if (!isAuthenticated || currentView === 'login') {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentView) {
      case 'hub': return <DashboardHub />;
      case 'dashboard': return <Dashboard />;
      case 'calendar': return <CalendarView />;
      case 'campaigns': return <Campaigns />;
      case 'ai-brief': return <AIBriefGenerator />;
      case 'approvals': return <Approvals />;
      case 'kpi': return <KPIDashboard />;
      case 'assets': return <Assets />;
      case 'campaign-detail': return <CampaignDetail />;
      case 'settings': return <Settings />;
      case 'mkt-strategy': return <MktStrategy />;
      case 'mkt-calendar': return <MktCalendar />;
      case 'mkt-ideas': return <MktIdeas />;
      case 'mkt-performance': return <MktPerformance />;
      case 'mkt-intelligence': return <MktIntelligence />;
      case 'mkt-ideation': return <MktIdeation />;
      case 'mkt-brief': return <MktBrief />;
      case 'mkt-messaging': return <MktMessaging />;
      case 'content-log': return <ContentLog />;
      case 'admin-kpis': return <AdminKpis />;
      case 'admin-audiences': return <AdminAudiences />;
      case 'backups': return <Backups />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      <PageTransition viewKey={currentView}>
        {renderPage()}
      </PageTransition>
    </Layout>
  );
}

export function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </AppProvider>
  );
}
