import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PersonnelList = ({ searchTerm, onSelectPerson }) => {
  const [personnel, setPersonnel] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5050/api/personnel')
      .then(res => setPersonnel(res.data))
      .catch(err => console.error('Error fetching personnel:', err));
  }, []);

  return (
    <div className="personnel-grid">
      {personnel.filter((entry) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          entry.per_name?.toLowerCase().includes(searchLower) ||
          entry.per_lname?.toLowerCase().includes(searchLower) ||
          entry.per_department?.toLowerCase().includes(searchLower) ||
          entry.per_role?.toLowerCase().includes(searchLower)
        );
      }).map((person) => (
        <div
          className="personnel-card"
          key={person.per_id}
          onClick={() => {
            window.history.pushState(null, "", `/personnel/${person.per_id}`);
            window.dispatchEvent(new PopStateEvent("popstate")); // trigger App logic
          }}
          style={{ cursor: "pointer" }}
        >
          <img
            className="personnel-avatar"
            src={`/${person.per_id}.jpg`}
            alt={`${person.per_name} ${person.per_lname}`}
          />
          <div className="personnel-name">{person.per_name} {person.per_lname}</div>
          <div className="personnel-role">{person.per_role}</div>
        </div>
      ))}
    </div>
  );
};

export default PersonnelList;
