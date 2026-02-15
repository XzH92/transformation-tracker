import { useState } from 'react';
import api from '../api';

const MensurationsForm = ({ onMensurationsAdded, compact = false }) => {
  const [nouvelleMensuration, setNouvelleMensuration] = useState({
    cou: '', epaules: '', poitrine: '', nombril: '', taille: '', hanches: '',
    biceps_gauche: '', biceps_droit: '', cuisse_gauche: '', cuisse_droite: '',
    mollet_gauche: '', mollet_droit: '', date_mesure: ''
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!nouvelleMensuration.date_mesure) {
      newErrors.date_mesure = 'La date est requise';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const ajouterMensuration = async () => {
    if (!validateForm()) return;
    try {
      const dataToSend = { ...nouvelleMensuration };
      Object.keys(dataToSend).forEach(key => {
        if (key !== 'date_mesure' && dataToSend[key] === '') {
          dataToSend[key] = null;
        } else if (key !== 'date_mesure' && dataToSend[key] !== null) {
          dataToSend[key] = parseFloat(dataToSend[key]);
        }
      });
      await api.post('/mensurations/', dataToSend);
      setNouvelleMensuration({
        cou: '', epaules: '', poitrine: '', nombril: '', taille: '', hanches: '',
        biceps_gauche: '', biceps_droit: '', cuisse_gauche: '', cuisse_droite: '',
        mollet_gauche: '', mollet_droit: '', date_mesure: ''
      });
      setErrors({});
      setMessage('Mensurations enregistrées !');
      setTimeout(() => setMessage(''), 3000);
      if (onMensurationsAdded) onMensurationsAdded();
    } catch (error) {
      console.error("Erreur lors de l'ajout des mensurations :", error.response?.data || error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNouvelleMensuration({ ...nouvelleMensuration, [name]: value });
  };

  const fields = [
    { name: 'cou', label: 'Cou' },
    { name: 'epaules', label: 'Epaules' },
    { name: 'poitrine', label: 'Poitrine' },
    { name: 'nombril', label: 'Nombril' },
    { name: 'taille', label: 'Taille' },
    { name: 'hanches', label: 'Hanches' },
    { name: 'biceps_gauche', label: 'Biceps G' },
    { name: 'biceps_droit', label: 'Biceps D' },
    { name: 'cuisse_gauche', label: 'Cuisse G' },
    { name: 'cuisse_droite', label: 'Cuisse D' },
    { name: 'mollet_gauche', label: 'Mollet G' },
    { name: 'mollet_droit', label: 'Mollet D' },
  ];

  if (compact) {
    return (
      <div>
        <div className="mensuration-grid-compact">
          {fields.map(f => (
            <input
              key={f.name}
              type="number"
              name={f.name}
              placeholder={f.label + ' (cm)'}
              value={nouvelleMensuration[f.name]}
              onChange={handleInputChange}
              className="form-input form-input--compact"
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="date"
            name="date_mesure"
            value={nouvelleMensuration.date_mesure}
            onChange={handleInputChange}
            className="form-input form-input--compact"
            style={{ flex: 1 }}
          />
          <button onClick={ajouterMensuration} className="btn-primary" style={{ whiteSpace: 'nowrap', fontSize: '13px', padding: '6px 14px' }}>
            Valider
          </button>
        </div>
        {errors.date_mesure && <span style={{ color: 'red', fontSize: '11px' }}>{errors.date_mesure}</span>}
        {message && <div style={{ color: '#4CAF50', fontSize: '12px', marginTop: '4px' }}>{message}</div>}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Ajouter des mensurations</h3>
      <div className="mensuration-grid-full">
        {fields.map(f => (
          <div key={f.name}>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '2px' }}>{f.label} (cm):</label>
            <input
              type="number"
              name={f.name}
              placeholder={`Tour ${f.label.toLowerCase()}`}
              value={nouvelleMensuration[f.name]}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
        ))}
        <div>
          <label style={{ fontSize: '13px', display: 'block', marginBottom: '2px' }}>Date:</label>
          <input
            type="date"
            name="date_mesure"
            value={nouvelleMensuration.date_mesure}
            onChange={handleInputChange}
            className="form-input"
          />
          {errors.date_mesure && <span style={{ color: 'red', fontSize: '12px' }}>{errors.date_mesure}</span>}
        </div>
      </div>
      {message && <div style={{ color: '#4CAF50', marginBottom: '10px' }}>{message}</div>}
      <button onClick={ajouterMensuration} className="btn-primary" style={{ padding: '10px 20px' }}>
        Ajouter les mensurations
      </button>
    </div>
  );
};

export default MensurationsForm;
