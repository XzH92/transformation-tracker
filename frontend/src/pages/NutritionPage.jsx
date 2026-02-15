import { useState, useMemo } from 'react';
import SupplementsForm from '../components/SupplementsForm';

const NutritionPage = ({ supplements, poids, onSupplementAdded }) => {
  const [tdeeInputs, setTdeeInputs] = useState({
    taille_cm: 178,
    age: 30,
    sexe: 'homme',
    activite: 'modere'
  });

  const dernierPoids = useMemo(() => {
    if (!poids || poids.length === 0) return null;
    const sorted = [...poids].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0].valeur;
  }, [poids]);

  const activityMultipliers = {
    sedentaire: { label: 'Sédentaire (bureau)', value: 1.2 },
    leger: { label: 'Léger (1-2x/sem)', value: 1.375 },
    modere: { label: 'Modéré (3-5x/sem)', value: 1.55 },
    actif: { label: 'Actif (6-7x/sem)', value: 1.725 },
    tres_actif: { label: 'Très actif (2x/jour)', value: 1.9 }
  };

  const tdee = useMemo(() => {
    const weight = dernierPoids || 80;
    const { taille_cm, age, sexe, activite } = tdeeInputs;

    let bmr;
    if (sexe === 'homme') {
      bmr = 10 * weight + 6.25 * taille_cm - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * taille_cm - 5 * age - 161;
    }

    const multiplier = activityMultipliers[activite]?.value || 1.55;
    const maintenance = Math.round(bmr * multiplier);

    const protMaint = Math.round((maintenance * 0.35) / 4);
    const glucMaint = Math.round((maintenance * 0.40) / 4);
    const lipMaint = Math.round((maintenance * 0.25) / 9);

    return {
      bmr: Math.round(bmr),
      maintenance,
      deficit300: maintenance - 300,
      deficit500: maintenance - 500,
      macros: {
        maintenance: { prot: protMaint, gluc: glucMaint, lip: lipMaint },
        deficit300: {
          prot: Math.round(((maintenance - 300) * 0.40) / 4),
          gluc: Math.round(((maintenance - 300) * 0.35) / 4),
          lip: Math.round(((maintenance - 300) * 0.25) / 9)
        },
        deficit500: {
          prot: Math.round(((maintenance - 500) * 0.40) / 4),
          gluc: Math.round(((maintenance - 500) * 0.35) / 4),
          lip: Math.round(((maintenance - 500) * 0.25) / 9)
        }
      }
    };
  }, [dernierPoids, tdeeInputs]);

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '20px'
  };

  const MacroBar = ({ label, prot, gluc, lip, total }) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
        <strong>{label}</strong>
        <span>{total} kcal</span>
      </div>
      <div className="macro-bar">
        <div className="macro-bar__segment" style={{ flex: prot * 4, backgroundColor: '#FF6384', color: 'white' }}>
          P {prot}g
        </div>
        <div className="macro-bar__segment" style={{ flex: gluc * 4, backgroundColor: '#36A2EB', color: 'white' }}>
          G {gluc}g
        </div>
        <div className="macro-bar__segment" style={{ flex: lip * 9, backgroundColor: '#FFCE56', color: '#333' }}>
          L {lip}g
        </div>
      </div>
    </div>
  );

  const activeSupplements = (supplements || []).filter(s => !s.date_fin);

  return (
    <div>
      {/* TDEE Calculator */}
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '20px' }}>Calculateur TDEE (Mifflin-St Jeor)</h2>

        <div className="tdee-inputs-grid">
          <div>
            <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '4px' }}>Poids actuel (kg)</label>
            <input type="number" value={dernierPoids || ''} disabled className="form-input" style={{ backgroundColor: '#f5f5f5' }} />
            {!dernierPoids && <span style={{ fontSize: '11px', color: '#999' }}>Aucune mesure (défaut : 80kg)</span>}
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '4px' }}>Taille (cm)</label>
            <input
              type="number"
              value={tdeeInputs.taille_cm}
              onChange={(e) => setTdeeInputs({ ...tdeeInputs, taille_cm: parseInt(e.target.value) || 0 })}
              className="form-input"
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '4px' }}>Age</label>
            <input
              type="number"
              value={tdeeInputs.age}
              onChange={(e) => setTdeeInputs({ ...tdeeInputs, age: parseInt(e.target.value) || 0 })}
              className="form-input"
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '4px' }}>Sexe</label>
            <select
              value={tdeeInputs.sexe}
              onChange={(e) => setTdeeInputs({ ...tdeeInputs, sexe: e.target.value })}
              className="form-input"
            >
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
            </select>
          </div>
          <div className="span-2">
            <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '4px' }}>Niveau d'activité</label>
            <select
              value={tdeeInputs.activite}
              onChange={(e) => setTdeeInputs({ ...tdeeInputs, activite: e.target.value })}
              className="form-input"
            >
              {Object.entries(activityMultipliers).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
          <div className="tdee-results">
            <div className="tdee-result-card" style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: '12px', color: '#777' }}>BMR</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#333' }}>{tdee.bmr}</div>
              <div style={{ fontSize: '11px', color: '#999' }}>kcal/jour</div>
            </div>
            <div className="tdee-result-card" style={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7' }}>
              <div style={{ fontSize: '12px', color: '#2e7d32' }}>Maintenance</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#2e7d32' }}>{tdee.maintenance}</div>
              <div style={{ fontSize: '11px', color: '#66bb6a' }}>kcal/jour</div>
            </div>
            <div className="tdee-result-card" style={{ backgroundColor: '#fff3e0', border: '1px solid #ffcc80' }}>
              <div style={{ fontSize: '12px', color: '#e65100' }}>Déficit -300</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#e65100' }}>{tdee.deficit300}</div>
              <div style={{ fontSize: '11px', color: '#ff9800' }}>kcal/jour</div>
            </div>
            <div className="tdee-result-card" style={{ backgroundColor: '#fce4ec', border: '1px solid #ef9a9a' }}>
              <div style={{ fontSize: '12px', color: '#c62828' }}>Déficit -500</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#c62828' }}>{tdee.deficit500}</div>
              <div style={{ fontSize: '11px', color: '#ef5350' }}>kcal/jour</div>
            </div>
          </div>

          <h4 style={{ margin: '0 0 12px 0', color: '#444' }}>Répartition macros suggérée</h4>
          <MacroBar label="Maintenance" prot={tdee.macros.maintenance.prot} gluc={tdee.macros.maintenance.gluc} lip={tdee.macros.maintenance.lip} total={tdee.maintenance} />
          <MacroBar label="Déficit -300" prot={tdee.macros.deficit300.prot} gluc={tdee.macros.deficit300.gluc} lip={tdee.macros.deficit300.lip} total={tdee.deficit300} />
          <MacroBar label="Déficit -500" prot={tdee.macros.deficit500.prot} gluc={tdee.macros.deficit500.gluc} lip={tdee.macros.deficit500.lip} total={tdee.deficit500} />
        </div>
      </div>

      {/* Supplements */}
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '20px' }}>Suppléments</h2>
        <SupplementsForm onSupplementAdded={onSupplementAdded} />

        {activeSupplements.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '15px', color: '#555', marginBottom: '8px' }}>Suppléments actifs</h3>
            <div className="supplements-list">
              {activeSupplements.map(s => (
                <div key={s.id} className="supplement-badge">
                  <strong>{s.nom}</strong> - {s.dose} ({s.frequence})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionPage;
