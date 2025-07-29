import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import StatCards from "./components/StatCards";
import Calendar from "./components/Calendar";
import PersonnelList from "./components/PersonnelList";
import PersonnelDetail from "./components/PersonnelDetail";
import Departments from "./components/Departments";
import Entries from "./components/Entries";
import "./App.css";

const App = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedPerson, setSelectedPerson] = useState(null);

  return (
    <div className="dashboard-root">
      <Sidebar
        activePage={activePage}
        onChangePage={(page) => {
          setActivePage(page);
          setSelectedPerson(null); // Sayfa değişince detaydan çık
        }}
      />
      <div className="dashboard-main">
        <Topbar />
        {activePage === "dashboard" && (
          <>
            <StatCards />
            <Calendar />
          </>
        )}
        {activePage === "departments" && <Departments />}
        {activePage === "personnel" &&
          (selectedPerson ? (
            <PersonnelDetail
              person={selectedPerson}
              onBack={() => setSelectedPerson(null)}
            />
          ) : (
            <PersonnelList onSelectPerson={setSelectedPerson} />
          ))}
        {activePage === "entries" && <Entries />}
        {/* Diğer sayfalar için de benzer şekilde ekleme yapılabilir */}
      </div>
    </div>
  );
};

export default App;
