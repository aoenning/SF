import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import CreateQuote from './pages/CreateQuote';
import QuoteList from './pages/QuoteList';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<CreateQuote />} />
          <Route path="/orcamentos" element={<QuoteList />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
