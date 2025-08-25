import { useState, useEffect } from "react";
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
import Reporting from "./components/Reporting";
import RemoteWork from "./components/RemoteWork";
import "./App.css";
import axios from "axios";
import FilterBar from "./components/FilterBar";
import PersonnelFilterBar from "./components/PersonnelFilterBar";

const App = () => {
  // Read initial page from URL
  const initialPage = window.location.pathname.replace("/", "") || "dashboard";

  const [activePage, setActivePage] = useState(initialPage);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previousPage, setPreviousPage] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  // Entries page filters
  const [entriesDept, setEntriesDept] = useState("All");
  const [entriesRole, setEntriesRole] = useState("All");
  const [entriesStatus, setEntriesStatus] = useState("All");
  const [entriesLateThr, setEntriesLateThr] = useState("08:30");
  const [entriesDate, setEntriesDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [entriesGrace, setEntriesGrace] = useState(0);
  // removed per-department thresholds UI/state but keep prop compatibility
  const [entriesDeptThresholds, setEntriesDeptThresholds] = useState({});
  const [entriesFiltersOpen, setEntriesFiltersOpen] = useState(false);
  const [personnelFiltersOpen, setPersonnelFiltersOpen] = useState(false);
  const [departmentFiltersOpen, setDepartmentFiltersOpen] = useState(false);
  const [entriesSelectedDepts, setEntriesSelectedDepts] = useState([]);

  // Personnel filter states
  const [personnelDept, setPersonnelDept] = useState("All");
  const [personnelRole, setPersonnelRole] = useState("All");
  const [personnelStatus, setPersonnelStatus] = useState("All");
  const [personnelEmployment, setPersonnelEmployment] = useState("All");

  // On first load: check login status and handle sidebar hover
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    const user = localStorage.getItem("adminUser");

    if (loggedIn === "true" && user) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(user));
    }

    // Fetch leave requests
    const fetchLeaveRequests = async () => {
      try {
        const res = await axios.get("http://localhost:5050/api/leave");
        setLeaveRequests(res.data);
      } catch (error) {
        console.error("Failed to fetch leave requests:", error);
      }
    };

    fetchLeaveRequests();

    const handleSidebarHover = (event) => {
      setSidebarOpen(event.detail);
    };

    const fetchPersonById = async (id) => {
      try {
        const res = await axios.get(
          `http://localhost:5050/api/personnel/${id}`
        );
        setSelectedPerson(res.data);
      } catch (error) {
        console.error("Error fetching person by ID:", error);
      }
    };

    const handlePopState = () => {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      const page = pathParts[0] || "dashboard";

      setActivePage(page);
      setSearchTerm(""); // Search state'ini temizle

      if (page === "personnel" && pathParts.length === 2) {
        const personId = pathParts[1];
        fetchPersonById(personId); // fetch person by ID and show details
      } else {
        setSelectedPerson(null); // not on detail page, clear selection
      }
    };

    window.addEventListener("sidebarHover", handleSidebarHover);
    window.addEventListener("popstate", handlePopState);

    // run once on mount
    handlePopState();

    return () => {
      window.removeEventListener("sidebarHover", handleSidebarHover);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const changePage = (page) => {
    setActivePage(page);
    setSelectedPerson(null);
    setSearchTerm(""); // Search state'ini temizle
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
          hideSearch={
            activePage === "dashboard" ||
            activePage === "profile" ||
            selectedPerson !== null
          }
          currentUser={currentUser}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          onChangePage={changePage}
          leaveRequests={leaveRequests}
          setLeaveRequests={setLeaveRequests}
          showFilterButton={
            (activePage === "entries" && !selectedPerson) ||
            (activePage === "personnel" && !selectedPerson) ||
            activePage === "departments"
          }
          filtersOpen={
            activePage === "entries"
              ? entriesFiltersOpen
              : activePage === "personnel"
              ? personnelFiltersOpen
              : activePage === "departments"
              ? departmentFiltersOpen
              : false
          }
          onToggleFilters={() => {
            if (activePage === "entries") setEntriesFiltersOpen((v) => !v);
            else if (activePage === "personnel")
              setPersonnelFiltersOpen((v) => !v);
            else if (activePage === "departments")
              setDepartmentFiltersOpen((v) => !v);
          }}
        />

        {activePage === "dashboard" && (
          <>
            <StatCards onChangePage={changePage} />
            <Calendar />
          </>
        )}

        {activePage === "departments" && (
          <Departments
            searchTerm={searchTerm}
            filtersOpen={departmentFiltersOpen}
          />
        )}

        {activePage === "personnel" &&
          !selectedPerson &&
          personnelFiltersOpen && (
            <PersonnelFilterBar
              selectedDept={personnelDept}
              setSelectedDept={setPersonnelDept}
              selectedRole={personnelRole}
              setSelectedRole={setPersonnelRole}
              selectedStatus={personnelStatus}
              setSelectedStatus={setPersonnelStatus}
              selectedEmployment={personnelEmployment}
              setSelectedEmployment={setPersonnelEmployment}
            />
          )}

        {activePage === "personnel" &&
          (selectedPerson ? (
            <PersonnelDetail
              person={selectedPerson}
              onBack={() => {
                const path = previousPage ? `/${previousPage}` : "/personnel";
                window.history.pushState(null, "", path);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              onUpdate={handlePersonnelUpdate}
            />
          ) : (
            <PersonnelList
              searchTerm={searchTerm}
              filtersOpen={personnelFiltersOpen}
              selectedDept={personnelDept}
              selectedRole={personnelRole}
              selectedStatus={personnelStatus}
              selectedEmployment={personnelEmployment}
            />
          ))}

        {activePage === "entries" && !selectedPerson && entriesFiltersOpen && (
          <FilterBar
            selectedDept={entriesDept}
            setSelectedDept={setEntriesDept}
            selectedDepts={entriesSelectedDepts}
            setSelectedDepts={setEntriesSelectedDepts}
            selectedRole={entriesRole}
            setSelectedRole={setEntriesRole}
            selectedStatus={entriesStatus}
            setSelectedStatus={setEntriesStatus}
            lateThreshold={entriesLateThr}
            setLateThreshold={setEntriesLateThr}
            selectedDate={entriesDate}
            setSelectedDate={setEntriesDate}
            graceMinutes={entriesGrace}
            setGraceMinutes={setEntriesGrace}
            deptThresholds={entriesDeptThresholds}
            setDeptThresholds={setEntriesDeptThresholds}
          />
        )}

        {activePage === "entries" &&
          (selectedPerson ? (
            <PersonnelDetail
              person={selectedPerson}
              onBack={() => setSelectedPerson(null)}
              onUpdate={handlePersonnelUpdate}
            />
          ) : (
            <Entries
              searchTerm={searchTerm}
              onSelectPerson={(person) => {
                window.history.pushState(
                  null,
                  "",
                  `/personnel/${person.per_id}`
                );
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              setPreviousPage={setPreviousPage}
              externalFilters={{
                selectedDept: entriesDept,
                selectedRole: entriesRole,
                selectedStatus: entriesStatus,
                lateThreshold: entriesLateThr,
                selectedDate: entriesDate,
                graceMinutes: entriesGrace,
                deptThresholds: entriesDeptThresholds,
                selectedDepts: entriesSelectedDepts,
              }}
            />
          ))}

        {activePage === "leave-requests" && (
          <LeaveRequests
            searchTerm={searchTerm}
            leaveRequests={leaveRequests}
            setLeaveRequests={setLeaveRequests}
          />
        )}
        {activePage === "remote-work" && <RemoteWork />}
        {activePage === "profile" && <Profile currentUser={currentUser} />}
        {activePage === "reporting" && <Reporting />}
      </div>
    </div>
  );
};

export default App;
