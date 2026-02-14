const PoidsList = ({ poids }) => {
  return (
    <div>
      <h2>Historique des mesures</h2>
      <ul>
        {poids.map((p) => (
          <li key={p.id}>
            {p.date} : {p.valeur} kg
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PoidsList;