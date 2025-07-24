import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PersonnelList = ({ onSelectPerson }) => {
  const [personnel, setPersonnel] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/personnel')
      .then(res => setPersonnel(res.data))
      .catch(err => console.error('Error fetching data:', err));
  }, []);

  return (
   <div className="personnel-grid">
    {personnel.map((person) => (
      <div 
      className="personnel-card"
      key={person.per_id}
      onClick={() => onSelectPerson && onSelectPerson(person)}
      tyle={{ cursor: "pointer" }}
      >
        <img
          className="personnel-avatar"
          src={`/${(person.per_name + person.per_lname).toLowerCase()}.jpg`}
          
          alt={person.name}
        />
        <div className="personnel-name">{person.per_name} {person.per_lname}</div>
        <div className="personnel-role">{person.per_role}</div>
      </div>
    ))}
  </div>
  );
};

export default PersonnelList;


