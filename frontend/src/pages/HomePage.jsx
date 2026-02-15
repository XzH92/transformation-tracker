import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import MensurationsForm from '../components/MensurationsForm';
import CompleteCharts from '../components/CompleteCharts';

const HomePage = ({ poids, mensurations, onPoidsAdded, onMensurationsAdded }) => {
  const [poidsValue, setPoidsValue] = useState('');
  const [poidsDate, setPoidsDate] = useState('');
  const [poidsMsg, setPoidsMsg] = useState('');

  const [seanceTexte, setSeanceTexte] = useState('');
  const [seanceDate, setSeanceDate] = useState('');
  const [seanceMsg, setSeanceMsg] = useState('');

  const submitPoids = async () => {
    if (!poidsValue || !poidsDate) return;
    try {
      await axios.post(`${API_BASE_URL}/poids/`, {
        valeur: parseFloat(poidsValue),
        date_mesure: poidsDate
      });
      setPoidsValue('');
      setPoidsDate('');
      setPoidsMsg('Poids enregistré !');
      setTimeout(() => setPoidsMsg(''), 3000);
      if (onPoidsAdded) onPoidsAdded();
    } catch (error) {
      console.error('Erreur poids:', error);
    }
  };

  const submitSeance = async () => {
    if (!seanceTexte || !seanceDate) return;
    try {
      await axios.post(`${API_BASE_URL}/journal/`, {
        texte: seanceTexte,
        date: seanceDate
      });
      setSeanceTexte('');
      setSeanceDate('');
      setSeanceMsg('Séance enregistrée !');
      setTimeout(() => setSeanceMsg(''), 3000);
    } catch (error) {
      console.error('Erreur journal:', error);
    }
  };

  return (
    <div>
      {/* 3-column compact input area */}
      <div className="home-columns">
        {/* Column 1: Poids */}
        <div className="home-card">
          <h3 className="home-card__title">Poids</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="number"
              step="0.1"
              placeholder="Poids (kg)"
              value={poidsValue}
              onChange={(e) => setPoidsValue(e.target.value)}
              className="form-input"
            />
            <input
              type="date"
              value={poidsDate}
              onChange={(e) => setPoidsDate(e.target.value)}
              className="form-input"
            />
            <button onClick={submitPoids} className="btn-primary">Valider</button>
            {poidsMsg && <span style={{ color: '#4CAF50', fontSize: '13px' }}>{poidsMsg}</span>}
          </div>
        </div>

        {/* Column 2: Derniere seance */}
        <div className="home-card">
          <h3 className="home-card__title">Dernière séance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea
              placeholder="Coller le résumé de séance Hevy ici..."
              value={seanceTexte}
              onChange={(e) => setSeanceTexte(e.target.value)}
              className="form-input"
              style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
            />
            <input
              type="date"
              value={seanceDate}
              onChange={(e) => setSeanceDate(e.target.value)}
              className="form-input"
            />
            <button onClick={submitSeance} className="btn-primary">Valider</button>
            {seanceMsg && <span style={{ color: '#4CAF50', fontSize: '13px' }}>{seanceMsg}</span>}
          </div>
        </div>

        {/* Column 3: Mensurations */}
        <div className="home-card">
          <h3 className="home-card__title">Mensurations</h3>
          <MensurationsForm onMensurationsAdded={onMensurationsAdded} compact={true} />
        </div>
      </div>

      {/* Charts below */}
      <CompleteCharts poids={poids} mensurations={mensurations} />
    </div>
  );
};

export default HomePage;
