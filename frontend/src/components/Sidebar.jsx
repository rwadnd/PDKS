import React from "react";
import {
  FaTachometerAlt,
  FaRegHeart,
  FaRegComments,
  FaListUl,
} from "react-icons/fa";
import { PiTableLight } from "react-icons/pi";
import "../App.css";

const Sidebar = ({ activePage, onChangePage, isOpen }) => (
  <aside
    className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`}
    onMouseEnter={() => {
      // Hover ile aç
      if (!isOpen) {
        const event = new CustomEvent("sidebarHover", { detail: true });
        window.dispatchEvent(event);
      }
    }}
    // onMouseLeave={() => {
    //   // Hover'dan çıkınca kapat
    //   if (isOpen) {
    //     const event = new CustomEvent("sidebarHover", { detail: false });
    //     window.dispatchEvent(event);
    //   }
    // }}
  >
    <div className="logo" style={{ marginBottom: 16 }}>
      DashStack
    </div>
    <nav>
      <ul className="sidebar-menu" style={{ marginTop: 0, paddingTop: 0 }}>
        <li
          className={
            activePage === "dashboard"
              ? "active sidebar-item-selected"
              : "sidebar-item"
          }
          onClick={() => onChangePage("dashboard")}
        >
          <FaTachometerAlt style={{ marginRight: 16, fontSize: 22 }} />{" "}
          Dashboard
        </li>
        <li
          className={
            activePage === "entries"
              ? "active sidebar-item-selected"
              : "sidebar-item"
          }
          onClick={() => onChangePage("entries")}
        >
          <PiTableLight style={{ marginRight: 16, fontSize: 22 }} /> Entries
        </li>
        <li
          className={
            activePage === "personnel"
              ? "active sidebar-item-selected"
              : "sidebar-item"
          }
          onClick={() => onChangePage("personnel")}
        >
          <FaRegHeart style={{ marginRight: 16, fontSize: 22 }} /> Personnel
        </li>
        <li
          className={
            activePage === "departments"
              ? "active sidebar-item-selected"
              : "sidebar-item"
          }
          onClick={() => onChangePage("departments")}
        >
          <FaRegComments style={{ marginRight: 16, fontSize: 22 }} />{" "}
          Departments
        </li>
      </ul>
    </nav>
  </aside>
);

export default Sidebar;
