import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import KPIDiagram from './components/KPIDiagram2';
import LoanCalculator from './components/loanCalculator';
import InvestissementPage from './pages/investissementPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<KPIDiagram initialMode="élément comptable" />} />
          <Route path="/ratio" element={<KPIDiagram initialMode="ratio" />} />
          <Route path="/simulation" element={<KPIDiagram initialMode="simulation" />} />
          <Route path="/reports" element={<InvestissementPage />} />
          <Route path="/loan-calculator" element={<LoanCalculator />} />
          <Route path="/investissement" element={<InvestissementPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
