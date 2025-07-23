import React from "react";

const personnel = [
  {
    id: 1,
    name: "Jason Price",
    role: "Admin",
    email: "janick_parisian@yahoo.com",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 2,
    name: "Jukkoe Sisao",
    role: "CEO",
    email: "sibyl_kozey@gmail.com",
    avatar: "https://randomuser.me/api/portraits/men/33.jpg",
  },
  {
    id: 3,
    name: "Harriet King",
    role: "CTO",
    email: "nadia_block@hotmail.com",
    avatar: "https://randomuser.me/api/portraits/men/34.jpg",
  },
  {
    id: 4,
    name: "Lenora Benson",
    role: "Lead",
    email: "feil.wallace@kunde.us",
    avatar: "https://randomuser.me/api/portraits/men/35.jpg",
  },
  {
    id: 5,
    name: "Olivia Reese",
    role: "Strategist",
    email: "kemmer.hattie@cremin.us",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
  },
  {
    id: 6,
    name: "Bertha Valdez",
    role: "CEO",
    email: "loraine.koelpin@tromp.io",
    avatar: "https://randomuser.me/api/portraits/men/36.jpg",
  },
  {
    id: 7,
    name: "Harriett Payne",
    role: "Digital Marketer",
    email: "nannie_west@estrella.tv",
    avatar: "https://randomuser.me/api/portraits/men/37.jpg",
  },
  {
    id: 8,
    name: "George Bryant",
    role: "Social Media",
    email: "delmer.kling@gmail.com",
    avatar: "https://randomuser.me/api/portraits/men/38.jpg",
  },
  {
    id: 9,
    name: "Lily French",
    role: "Strategist",
    email: "lucienne.herman@hotmail.com",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
  },
  {
    id: 10,
    name: "Howard Adkins",
    role: "CEO",
    email: "wiegand.leonor@herman.us",
    avatar: "https://randomuser.me/api/portraits/men/39.jpg",
  },
  {
    id: 11,
    name: "Earl Bowman",
    role: "Digital Marketer",
    email: "wainio_altenwerth@nicolette.tv",
    avatar: "https://randomuser.me/api/portraits/men/40.jpg",
  },
  {
    id: 12,
    name: "Patrick Padilla",
    role: "Social Media",
    email: "octavia.nienow@gleichner.net",
    avatar: "https://randomuser.me/api/portraits/men/41.jpg",
  },
];

const PersonnelList = () => (
  <div className="personnel-grid">
    {personnel.map((person) => (
      <div className="personnel-card" key={person.id}>
        <img
          className="personnel-avatar"
          src={person.avatar}
          alt={person.name}
        />
        <div className="personnel-name">{person.name}</div>
        <div className="personnel-role">{person.role}</div>
        <div className="personnel-email">{person.email}</div>
      </div>
    ))}
  </div>
);

export default PersonnelList;
