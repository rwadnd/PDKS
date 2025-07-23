import React from "react";
import "../App.css";

const Topbar = () => (
  <header className="topbar">
    <input className="search" type="text" placeholder="Search" />
    <div className="user-info">
      <img
        src="https://randomuser.me/api/portraits/women/44.jpg"
        alt="User"
        className="avatar"
      />
      <div>
        <div className="user-name">Moni Roy</div>
        <div className="user-role">Admin</div>
      </div>
    </div>
  </header>
);

export default Topbar;
