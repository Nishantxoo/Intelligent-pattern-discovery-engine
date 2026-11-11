import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/app/globals.css';

import { Providers } from '@/app/providers';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/shared/AppShell';

import LandingPage from '@/app/page';
import DashboardPage from '@/app/dashboard/page';
import PatternsPage from '@/app/patterns/page';
import ForecastingPage from '@/app/forecasting/page';
import DemographicsPage from '@/app/demographics/page';
import TemporalPage from '@/app/temporal/page';
import InsightsPage from '@/app/insights/page';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <TooltipProvider>
        <Providers>
          <AppShell>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/patterns" element={<PatternsPage />} />
              <Route path="/forecasting" element={<ForecastingPage />} />
              <Route path="/demographics" element={<DemographicsPage />} />
              <Route path="/temporal" element={<TemporalPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </AppShell>
        </Providers>
      </TooltipProvider>
    </BrowserRouter>
  </React.StrictMode>
);
