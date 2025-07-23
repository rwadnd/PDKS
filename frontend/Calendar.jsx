import React from "react";
import "../App.css";

const Calendar = () => (
  <div className="calendar-container">
    <div className="calendar-header">
      <button>{"<"}</button>
      <span>July 2025</span>
      <button>{">"}</button>
      <div className="calendar-view-toggle">
        <button>Day</button>
        <button>Week</button>
        <button className="active">Month</button>
      </div>
    </div>
    <table className="calendar-table">
      <thead>
        <tr>
          <th>Mon</th>
          <th>Tue</th>
          <th>Wed</th>
          <th>Thu</th>
          <th>Fri</th>
          <th>Sat</th>
          <th>Sun</th>
        </tr>
      </thead>
      <tbody>
        {/* Takvim satırları ve etkinlikler buraya gelecek */}
        <tr>
          <td>30</td>
          <td>1</td>
          <td>2</td>
          <td>3</td>
          <td>4</td>
          <td>5</td>
          <td>6</td>
        </tr>
        <tr>
          <td>7</td>
          <td>8</td>
          <td>9</td>
          <td>10</td>
          <td>11</td>
          <td>12</td>
          <td>13</td>
        </tr>
        {/* ... */}
      </tbody>
    </table>
  </div>
);

export default Calendar;
