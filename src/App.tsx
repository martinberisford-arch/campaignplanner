import { AppProvider, useApp } from './store/AppContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
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

function AppRouter() {
  const { currentView, isAuthenticated } = useApp();

  if (!isAuthenticated || currentView === 'login') {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentView) {
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
      default: return <Dashboard />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}

export function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
