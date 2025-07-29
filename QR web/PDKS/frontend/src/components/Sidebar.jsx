import React from "react";
import "../App.css";

const Sidebar = ({ activePage, onChangePage }) => (
  <aside className="sidebar">
    <div className="logo">DashStack</div>
    <nav>
      <ul>
        <li
          className={activePage === "dashboard" ? "active" : ""}
          onClick={() => onChangePage("dashboard")}
        >
          Dashboard
        </li>
        <li
          className={activePage === "entries" ? "active" : ""}
          onClick={() => onChangePage("entries")}
        >
          Entries
        </li>
        <li
          className={activePage === "personnel" ? "active" : ""}
          onClick={() => onChangePage("personnel")}
        >
          Personnel
        </li>
        <li
          className={activePage === "departments" ? "active" : ""}
          onClick={() => onChangePage("departments")}
        >
          Departments
        </li>
        <li
          className={activePage === "orders" ? "active" : ""}
          onClick={() => onChangePage("orders")}
        >
          Order Lists
        </li>
      </ul>
    </nav>
    <div className="sidebar-bottom">
      <div>Settings</div>
      <div>Logout</div>
    </div>
  </aside>
);

export default Sidebar;
