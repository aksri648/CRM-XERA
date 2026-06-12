import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AIStudio from './pages/AIStudio';
import Opportunities from './pages/Opportunities';
import AgentProposals from './pages/AgentProposals';
import Customers from './pages/Customers';
import Segments from './pages/Segments';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import ABTests from './pages/ABTests';
import Analytics from './pages/Analytics';
import PipelineMonitor from './pages/PipelineMonitor';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route
        path="/"
        element={<AppLayout />}
      >
        <Route index element={<Dashboard />} />
        <Route path="ai-studio" element={<AIStudio />} />
        <Route path="opportunities" element={<Opportunities />} />
        <Route path="proposals" element={<AgentProposals />} />
        <Route path="customers" element={<Customers />} />
        <Route path="segments" element={<Segments />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="ab-tests" element={<ABTests />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="pipeline" element={<PipelineMonitor />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
