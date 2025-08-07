import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import StatCards from "./components/StatCards";
import Calendar from "./components/Calendar";
import PersonnelList from "./components/PersonnelList";
import PersonnelDetail from "./components/PersonnelDetail";
import Departments from "./components/Departments";
import Entries from "./components/Entries";
import LeaveRequests from "./components/LeaveRequests";
import Profile from "./components/Profile";
import Login from "./components/Login";
import "./App.css";

const App = () => {
  // Read initial page from URL
  const initialPage = window.location.pathname.replace("/", "") || "dashboard";

  const [activePage, setActivePage] = useState(initialPage);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // On first load: check login status and handle sidebar hover
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

    // Allow back/forward navigation using browser buttons
    const handlePopState = () => {
      const path = window.location.pathname.replace("/", "") || "dashboard";
      setActivePage(path);
    };

    window.addEventListener("sidebarHover", handleSidebarHover);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("sidebarHover", handleSidebarHover);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const changePage = (page) => {
    setActivePage(page);
    setSelectedPerson(null);
    window.history.pushState(null, "", "/" + page);
  };

  const handlePersonnelUpdate = (updatedPerson) => {
    setSelectedPerson(updatedPerson);
  };

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("adminUser", JSON.stringify(user));
    window.history.replaceState(null, "", "/dashboard");
    setActivePage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("adminUser");
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActivePage("dashboard");
    window.history.pushState(null, "", "/");
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="dashboard-root">
      <Sidebar
        activePage={activePage}
        onChangePage={changePage}
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
          onChangePage={changePage}
        />

        {activePage === "dashboard" && (
          <>
            <StatCards onChangePage={changePage} />
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
        {activePage === "leave-requests" && (
          <LeaveRequests searchTerm={searchTerm} />
        )}
        {activePage === "profile" && (
          <Profile onBack={() => changePage("dashboard")} currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};

export default App;
