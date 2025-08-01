import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import StatCards from "./components/StatCards";
import Calendar from "./components/Calendar";
import PersonnelList from "./components/PersonnelList";
import PersonnelDetail from "./components/PersonnelDetail";
import Departments from "./components/Departments";
import Entries from "./components/Entries";
import Login from "./components/Login";
import "./App.css";

const App = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if user is logged in on component mount
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    const user = localStorage.getItem("adminUser");


    


    if (loggedIn === "true" && user) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(user));
    }
     const handleSidebarHover = (event) => {
      setSidebarOpen(event.detail);
    };

    window.addEventListener("sidebarHover", handleSidebarHover);
    return () => window.removeEventListener("sidebarHover", handleSidebarHover);
  
  }, []);

  const handlePersonnelUpdate = (updatedPerson) => {
    setSelectedPerson(updatedPerson);
  };

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("adminUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("adminUser");
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (

    
    <div className="dashboard-root">
      <Sidebar
              activePage={activePage}
              onChangePage={(page) => {
                setActivePage(page);
                setSelectedPerson(null); // Sayfa değişince detaydan çık
              }}
              isOpen={sidebarOpen}
            />
      <div className="dashboard-main">
        <Topbar
          activePage={activePage}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          hideSearch={selectedPerson !== null}
          currentUser={currentUser}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        {activePage === "dashboard" && (
          <>
            <StatCards onChangePage={(page) => {
          setActivePage(page);
          setSelectedPerson(null); // Sayfa değişince detaydan çık
        }} />
            <Calendar />
          </>
        )}
        {activePage === "departments" && (
          <Departments searchTerm={searchTerm} />
        )}
        {activePage === "personnel" &&
          (selectedPerson ? (
            <PersonnelDetail
              person={selectedPerson}
              onBack={() => setSelectedPerson(null)}
              onUpdate={handlePersonnelUpdate}
            />
          ) : (
            <PersonnelList
              onSelectPerson={setSelectedPerson}
              searchTerm={searchTerm}
            />
          ))}
        {activePage === "entries" && <Entries searchTerm={searchTerm} />}
        {/* Diğer sayfalar için de benzer şekilde ekleme yapılabilir */}
      </div>
    </div>
);
};

export default App;
