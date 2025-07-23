import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import StatCards from "./components/StatCards";
import Calendar from "./components/Calendar";
import PersonnelList from "./components/PersonnelList";
import "./App.css";

const App = () => {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="dashboard-root">
      <Sidebar activePage={activePage} onChangePage={setActivePage} />
      <div className="dashboard-main">
        <Topbar />
        {activePage === "dashboard" && (
          <>
            <StatCards />
            <Calendar />
          </>
        )}
        {activePage === "personnel" && <PersonnelList />}
        {/* Diğer sayfalar için de benzer şekilde ekleme yapılabilir */}
      </div>
    </div>
  );
};

export default App;
