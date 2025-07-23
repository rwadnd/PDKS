import React from "react";
import "../App.css";

const StatCards = () => (
  <div className="stat-cards">
    <div className="stat-card">
      <div className="stat-title">Total Personnel</div>
      <div className="stat-value">70</div>
      <div className="stat-desc up">8.5% Up from yesterday</div>
    </div>
    <div className="stat-card">
      <div className="stat-title">Total Departments</div>
      <div className="stat-value">3</div>
      <div className="stat-desc up">1.3% Up from past week</div>
    </div>
    <div className="stat-card">
      <div className="stat-title">Today's Entries</div>
      <div className="stat-value">45</div>
      <div className="stat-desc down">4.3% Down from yesterday</div>
    </div>
    <div className="stat-card">
      <div className="stat-title">Last Entry</div>
      <div className="stat-value">2040</div>
      <div className="stat-desc up">1.8% Up from yesterday</div>
    </div>
  </div>
);

export default StatCards;
