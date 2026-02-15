// Projet de suivi de transformation physique - Julien Allart

import { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { API_BASE_URL } from './config';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

import HomePage from './pages/HomePage';
import EntrainementPage from './pages/EntrainementPage';
import NutritionPage from './pages/NutritionPage';
import AIAnalysisModal from './components/AIAnalysisModal';
import StatisticsPage from './StatisticsPage';
import './StatisticsPage.css';
import './responsive.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [poids, setPoids] = useState([]);
  const [mensurations, setMensurations] = useState([]);
  const [entrainements, setEntrainements] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [showAIModal, setShowAIModal] = useState(false);

  const fetchPoids = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/poids/`);
      setPoids(response.data.poids);
    } catch (error) {
      console.error("Erreur lors de la récupération des poids :", error);
    }
  };

  const fetchMensurations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mensurations/`);
      setMensurations(response.data.mensurations);
    } catch (error) {
      console.error("Erreur lors de la récupération des mensurations :", error);
    }
  };

  const fetchEntrainements = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/entrainements/`);
      setEntrainements(response.data.entrainements);
    } catch (error) {
      console.error("Erreur lors de la récupération des entraînements :", error);
    }
  };

  const fetchSupplements = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/supplements/`);
      setSupplements(response.data.supplements);
    } catch (error) {
      console.error("Erreur lors de la récupération des suppléments :", error);
    }
  };

  useEffect(() => {
    fetchPoids();
    fetchMensurations();
    fetchEntrainements();
    fetchSupplements();
  }, []);

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'entrainement', label: 'Entraînement' },
    { id: 'nutrition', label: 'Nutrition' },
  ];

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header with tabs */}
            <div className="app-header">
              <h1 className="app-title">Suivi de transformation physique</h1>
              <div className="app-nav">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab-btn ${activeTab === tab.id ? 'tab-btn--active' : 'tab-btn--inactive'}`}
                  >
                    {tab.label}
                  </button>
                ))}
                <div className="nav-separator" />
                <button onClick={() => setShowAIModal(true)} className="btn-ai">
                  Analyse IA
                </button>
                <Link to="/statistics" className="btn-stats">
                  Statistiques
                </Link>
              </div>
            </div>

            {/* Tab content */}
            {activeTab === 'home' && (
              <HomePage
                poids={poids}
                mensurations={mensurations}
                onPoidsAdded={fetchPoids}
                onMensurationsAdded={fetchMensurations}
              />
            )}

            {activeTab === 'entrainement' && (
              <EntrainementPage
                entrainements={entrainements}
                onEntrainementAdded={fetchEntrainements}
              />
            )}

            {activeTab === 'nutrition' && (
              <NutritionPage
                supplements={supplements}
                poids={poids}
                onSupplementAdded={fetchSupplements}
              />
            )}

            <AIAnalysisModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} />
          </div>
        } />
        <Route path="/statistics" element={<StatisticsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
