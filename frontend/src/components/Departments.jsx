import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import {
  FaUsers,
  FaClock,
  FaChartBar,
  FaBuilding,
  FaArrowUp,
  FaArrowDown,
  FaEdit,
} from "react-icons/fa";
import "../App.css";
import axios from "axios";

const Departments = ({ searchTerm }) => {
  const [departments, setDepartments] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentPersonnel, setDepartmentPersonnel] = useState([]);
  const [hoursDepartment, setHoursDepartment] = useState(null);
  const [departmentHours, setDepartmentHours] = useState([]);
  const [hoursSearch, setHoursSearch] = useState("");
  const [rawHoursSearch, setRawHoursSearch] = useState("");
  const [overtimeThresholdMin, setOvertimeThresholdMin] = useState(480); // 8h
  const [defaultBreakMin, setDefaultBreakMin] = useState(0);
  const [sortField, setSortField] = useState("worked"); // worked | in | out | name
  const [sortDesc, setSortDesc] = useState(true);
  const [dateFilter, setDateFilter] = useState("today");
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date().toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("name"); // name | checkin | checkout | hours | overtime
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | onleave | absent
  const [showOvertimeOnly, setShowOvertimeOnly] = useState(false);
  const [openShiftOnly, setOpenShiftOnly] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    color: "#ffffff",
    gradient: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  });
  const [isLoadingHours, setIsLoadingHours] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error",
  });

  useEffect(() => {
    // Check if we have departments in localStorage
    const savedDepartments = localStorage.getItem("departments");
    if (savedDepartments) {
      setDepartments(JSON.parse(savedDepartments));
    }

    // Always fetch from API to get latest data
    axios.get("http://localhost:5050/api/department/").then((res) => {
      setDepartments(res.data);
      localStorage.setItem("departments", JSON.stringify(res.data));
    });
  }, []);

  // Refetch hours data when date filter changes
  useEffect(() => {
    if (showHoursModal && hoursDepartment) {
      fetchHoursData(hoursDepartment, dateFilter);
    }
  }, [dateFilter, customDateRange, showHoursModal, hoursDepartment]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setHoursSearch(rawHoursSearch), 250);
    return () => clearTimeout(t);
  }, [rawHoursSearch]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5050/api/department/",
        formData
      );
      if (response.status === 201) {
        const newDepartments = [...departments, response.data];
        setDepartments(newDepartments);
        localStorage.setItem("departments", JSON.stringify(newDepartments));
        setShowModal(false);
        setFormData({
          name: "",
          shortName: "",
          color: "#3b82f6",
          gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        });
      }
    } catch (error) {
      console.error("Error adding department:", error);
      alert("Error adding department");
    }
  };

  const handleDeleteDepartment = async (departmentId, departmentName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${departmentName}" department?`
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:5050/api/department/${departmentId}`
      );
      if (response.status === 200) {
        const updatedDepartments = departments.filter(
          (dept) => dept.id !== departmentId
        );
        setDepartments(updatedDepartments);
        localStorage.setItem("departments", JSON.stringify(updatedDepartments));
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert("Error deleting department");
      }
    }
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      shortName: department.shortName,
      color: department.color,
    });
    setShowEditModal(true);
  };

  const handleShowPersonnel = async (department) => {
    try {
      setSelectedDepartment(department);

      // Fetch personnel data
      const personnelResponse = await axios.get(
        "http://localhost:5050/api/personnel"
      );
      const personnel = personnelResponse.data.filter(
        (p) => p.per_department === department.name
      );

      // Fetch today's PDKS data
      const todayStr = new Date().toISOString().slice(0, 10);
      const pdksResponse = await axios.get(
        `http://localhost:5050/api/pdks/by-date/${todayStr}`
      );
      const todayMap = new Map();

      pdksResponse.data.forEach((entry) => {
        if (entry.per_department === department.name) {
          todayMap.set(entry.per_id, entry);
        }
      });

      // Add status information to personnel
      const personnelWithStatus = personnel.map((person) => {
        const todayEntry = todayMap.get(person.per_id);
        const hasTodayCheckIn =
          todayEntry &&
          todayEntry.pdks_checkInTime &&
          todayEntry.pdks_checkInTime !== "00:00:00";

        let statusLabel = "Absent";
        let statusClass = "status-absent";

        if (hasTodayCheckIn) {
          statusLabel = "Active";
          statusClass = "status-active";
        }

        return {
          ...person,
          statusLabel,
          statusClass,
          hasTodayCheckIn,
        };
      });

      setDepartmentPersonnel(personnelWithStatus);
      setShowPersonnelModal(true);
    } catch (error) {
      console.error("Error fetching personnel:", error);
      alert("Error loading personnel data");
    }
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5050/api/department/${editingDepartment.id}`,
        formData
      );
      if (response.status === 200) {
        const updatedDepartments = departments.map((dept) =>
          dept.id === editingDepartment.id
            ? {
                ...dept,
                name: response.data.name,
                shortName: response.data.short_name,
                color: formData.color,
                gradient: formData.color, // Update gradient to match new color
              }
            : dept
        );
        setDepartments(updatedDepartments);
        localStorage.setItem("departments", JSON.stringify(updatedDepartments));
        setShowEditModal(false);
        setEditingDepartment(null);
        setFormData({
          name: "",
          shortName: "",
          color: "#3b82f6",
          gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        });
      }
    } catch (error) {
      console.error("Error updating department:", error);
      alert("Error updating department");
    }
  };

  const toMinutes = (t) => {
    if (!t || t === "00:00:00") return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const formatHM = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const addTestPersonRow = () => {
    if (!hoursDepartment) return;
    const testRow = {
      per_id: `test-${Date.now()}`,
      per_name: "Test",
      per_lname: "Person",
      avatar_url: "",
      inTime: "08:05",
      outTime: "-",
      workedMin: 0,
      netMin: 0,
      overtimeMin: 0,
      totalDays: dateFilter === "today" ? 0 : 1,
      hasOpenShift: true,
    };
    setDepartmentHours((prev) => [testRow, ...(prev || [])]);
  };

  const handleHoursClick = async (department) => {
    setHoursDepartment(department);
    await fetchHoursData(department, dateFilter);
    setShowHoursModal(true);
  };

  const fetchHoursData = async (department, filterType) => {
    try {
      setIsLoadingHours(true);
      let startDate, endDate;

      if (filterType === "today") {
        startDate = endDate = new Date().toISOString().slice(0, 10);
      } else if (filterType === "this_week") {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        startDate = startOfWeek.toISOString().slice(0, 10);
        endDate = endOfWeek.toISOString().slice(0, 10);
      } else if (filterType === "custom_range") {
        startDate = customDateRange.start;
        endDate = customDateRange.end;
      }

      if (filterType === "today") {
        // For today, fetch actual check-in/out data
        const todayStr = new Date().toISOString().slice(0, 10);
        const response = await axios.get(
          `http://localhost:5050/api/pdks/by-date/${todayStr}`
        );
        const departmentRecords = response.data.filter(
          (r) => r.per_department === department.name
        );

        const processedRecords = departmentRecords.map((r) => {
          const inTime =
            r.pdks_checkInTime && r.pdks_checkInTime !== "00:00:00"
              ? r.pdks_checkInTime.slice(0, 5)
              : "-";
          const outTime =
            r.pdks_checkOutTime && r.pdks_checkOutTime !== "00:00:00"
              ? r.pdks_checkOutTime.slice(0, 5)
              : "-";

          let workedMin = 0;
          if (inTime !== "-" && outTime !== "-") {
            const [inH, inM] = inTime.split(":").map(Number);
            const [outH, outM] = outTime.split(":").map(Number);
            workedMin = outH * 60 + outM - (inH * 60 + inM);
          }

          const hasOpenShift = inTime !== "-" && outTime === "-";

          return { ...r, inTime, outTime, workedMin, hasOpenShift };
        });

        setDepartmentHours(processedRecords);
      } else {
        // For date ranges, fetch and aggregate data
        const promises = [];
        const currentDate = new Date(startDate);
        const endDateObj = new Date(endDate);

        while (currentDate <= endDateObj) {
          const dateStr = currentDate.toISOString().slice(0, 10);
          promises.push(
            axios.get(`http://localhost:5050/api/pdks/by-date/${dateStr}`)
          );
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const responses = await Promise.all(promises);
        const allRecords = responses.flatMap((response) => response.data);

        // Filter by department and process records
        const departmentRecords = allRecords.filter(
          (r) => r.per_department === department.name
        );

        // Group by personnel and aggregate data
        const personnelMap = new Map();

        departmentRecords.forEach((r) => {
          const key = r.per_id;
          if (!personnelMap.has(key)) {
            personnelMap.set(key, {
              ...r,
              totalWorkedMin: 0,
              totalDays: 0,
              avgWorkedMin: 0,
              hasOpenShift: false,
            });
          }

          const record = personnelMap.get(key);
          const inTime =
            r.pdks_checkInTime && r.pdks_checkInTime !== "00:00:00"
              ? r.pdks_checkInTime.slice(0, 5)
              : null;
          const outTime =
            r.pdks_checkOutTime && r.pdks_checkOutTime !== "00:00:00"
              ? r.pdks_checkOutTime.slice(0, 5)
              : null;

          if (inTime && outTime) {
            const [inH, inM] = inTime.split(":").map(Number);
            const [outH, outM] = outTime.split(":").map(Number);
            const workedMin = outH * 60 + outM - (inH * 60 + inM);
            record.totalWorkedMin += workedMin;
            record.totalDays += 1;
          }

          // mark open shift if there is at least one day with check-in and no check-out
          if (inTime && !outTime) {
            record.hasOpenShift = true;
          }
        });

        // Calculate averages and format data
        const processedRecords = Array.from(personnelMap.values()).map((r) => {
          const avgWorkedMin =
            r.totalDays > 0 ? Math.round(r.totalWorkedMin / r.totalDays) : 0;
          const netMin = Math.max(0, avgWorkedMin - (defaultBreakMin || 0));
          const overtimeMin = Math.max(
            0,
            netMin - (overtimeThresholdMin || 480)
          );

          return {
            ...r,
            inTime: "Avg", // Show average for date ranges
            outTime: "Avg",
            workedMin: avgWorkedMin,
            netMin,
            overtimeMin,
            totalDays: r.totalDays,
            hasOpenShift: r.hasOpenShift,
          };
        });

        setDepartmentHours(processedRecords);
      }
    } catch (error) {
      console.error("Error loading hours:", error);
      setToast({
        visible: true,
        message: "Failed to load hours data.",
        type: "error",
      });
    } finally {
      setIsLoadingHours(false);
      // auto-hide toast
      if (toast.visible)
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
    }
  };

  const computedHoursView = useMemo(() => {
    const filtered = (departmentHours || []).filter((r) => {
      // Search filter
      if (hoursSearch) {
        const s = hoursSearch.toLowerCase();
        const nameMatch = `${r.per_name || ""} ${r.per_lname || ""}`
          .toLowerCase()
          .includes(s);
        const roleMatch = (r.per_role || "").toLowerCase().includes(s);
        if (!nameMatch && !roleMatch) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (dateFilter === "today") {
          const hasCheckIn = r.inTime && r.inTime !== "-";
          const hasCheckOut = r.outTime && r.outTime !== "-";
          if (statusFilter === "active" && (!hasCheckIn || !hasCheckOut))
            return false;
          if (statusFilter === "absent" && (hasCheckIn || hasCheckOut))
            return false;
        } else {
          const hasWorkDays = r.totalDays > 0;
          if (statusFilter === "active" && !hasWorkDays) return false;
          if (statusFilter === "absent" && hasWorkDays) return false;
        }
        if (statusFilter === "onleave") return false;
      }

      // Overtime filter
      if (showOvertimeOnly) {
        const net = Math.max(0, (r.workedMin || 0) - (defaultBreakMin || 0));
        const overtime = Math.max(0, net - (overtimeThresholdMin || 480));
        if (overtime <= 0) return false;
      }

      // Open shift filter
      if (openShiftOnly && !r.hasOpenShift) return false;

      return true;
    });

    const withCalcs = filtered.map((r) => {
      const net = Math.max(0, (r.workedMin || 0) - (defaultBreakMin || 0));
      const overtime = Math.max(0, net - (overtimeThresholdMin || 480));
      return { ...r, netMin: net, overtimeMin: overtime };
    });

    // If no explicit sort is chosen, return as-is
    if (!sortBy) return withCalcs;
    const dir = sortDesc ? -1 : 1;
    const sorted = withCalcs.sort((a, b) => {
      if (sortBy === "name")
        return (
          dir * String(a.per_name || "").localeCompare(String(b.per_name || ""))
        );
      if (sortBy === "checkin")
        return (
          dir *
          (toMinutes(a.inTime.replace(":", ":")) -
            toMinutes(b.inTime.replace(":", ":")))
        );
      if (sortBy === "checkout")
        return (
          dir *
          (toMinutes(a.outTime.replace(":", ":")) -
            toMinutes(b.outTime.replace(":", ":")))
        );
      if (sortBy === "hours")
        return dir * ((a.workedMin || 0) - (b.workedMin || 0));
      if (sortBy === "overtime")
        return dir * ((a.overtimeMin || 0) - (b.overtimeMin || 0));
      return 0;
    });

    return sorted;
  }, [
    departmentHours,
    hoursSearch,
    statusFilter,
    showOvertimeOnly,
    openShiftOnly,
    overtimeThresholdMin,
    defaultBreakMin,
    sortBy,
    sortDesc,
    dateFilter,
  ]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <p style={{ margin: 0, fontWeight: "600", color: "#374151" }}>
            {label}: {payload[0].value}h
          </p>
        </div>
      );
    }
    return null;
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (hoursSearch && hoursSearch.trim()) count += 1;
    if (statusFilter !== "all") count += 1;
    if (showOvertimeOnly) count += 1;
    if (openShiftOnly) count += 1;
    if (overtimeThresholdMin !== 480) count += 1;
    if (defaultBreakMin !== 0) count += 1;
    if (dateFilter !== "today") count += 1;
    return count;
  }, [
    hoursSearch,
    statusFilter,
    showOvertimeOnly,
    openShiftOnly,
    overtimeThresholdMin,
    defaultBreakMin,
    dateFilter,
  ]);

  const resetFilters = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setRawHoursSearch("");
    setHoursSearch("");
    setOvertimeThresholdMin(480);
    setDefaultBreakMin(0);
    setSortBy("name");
    setSortDesc(true);
    setStatusFilter("all");
    setShowOvertimeOnly(false);
    setOpenShiftOnly(false);
    setDateFilter("today");
    setCustomDateRange({ start: todayStr, end: todayStr });
  };

  const FILTERS_STORAGE_KEY = "hours_filters_v1";

  const getCurrentRangeLabel = () => {
    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    if (dateFilter === "today") return fmt(today);
    if (dateFilter === "this_week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
      return `${fmt(startOfWeek)}_${fmt(endOfWeek)}`;
    }
    return `${customDateRange.start}_${customDateRange.end}`;
  };

  const computedSummary = useMemo(() => {
    const rows = computedHoursView || [];
    if (!rows.length) return { totalOvertime: 0, avgWorked: 0 };
    const totalOvertime = rows.reduce(
      (acc, r) => acc + (r.overtimeMin || 0),
      0
    );
    const avgWorked = Math.round(
      rows.reduce((acc, r) => acc + (r.workedMin || 0), 0) / rows.length
    );
    return { totalOvertime, avgWorked };
  }, [computedHoursView]);

  // Load saved filters on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!raw) return;
      const f = JSON.parse(raw);
      if (typeof f.hoursSearch === "string") setHoursSearch(f.hoursSearch);
      if (f.overtimeThresholdMin != null)
        setOvertimeThresholdMin(Number(f.overtimeThresholdMin));
      if (f.defaultBreakMin != null)
        setDefaultBreakMin(Number(f.defaultBreakMin));
      if (typeof f.sortBy === "string") setSortBy(f.sortBy);
      if (typeof f.sortDesc === "boolean") setSortDesc(f.sortDesc);
      if (typeof f.statusFilter === "string") setStatusFilter(f.statusFilter);
      if (typeof f.showOvertimeOnly === "boolean")
        setShowOvertimeOnly(f.showOvertimeOnly);
      if (typeof f.openShiftOnly === "boolean")
        setOpenShiftOnly(f.openShiftOnly);
      if (typeof f.dateFilter === "string") setDateFilter(f.dateFilter);
      if (
        f.customDateRange &&
        typeof f.customDateRange.start === "string" &&
        typeof f.customDateRange.end === "string"
      ) {
        setCustomDateRange({
          start: f.customDateRange.start,
          end: f.customDateRange.end,
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save filters whenever they change
  useEffect(() => {
    const payload = {
      hoursSearch,
      overtimeThresholdMin,
      defaultBreakMin,
      sortBy,
      sortDesc,
      statusFilter,
      showOvertimeOnly,
      openShiftOnly,
      dateFilter,
      customDateRange,
    };
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore
    }
  }, [
    hoursSearch,
    overtimeThresholdMin,
    defaultBreakMin,
    sortBy,
    sortDesc,
    statusFilter,
    showOvertimeOnly,
    openShiftOnly,
    dateFilter,
    customDateRange,
  ]);

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f8fafc",
        overflowY: "scroll",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1e293b",
              margin: "0 0 8px 0",
            }}
          >
            Departments Overview
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#64748b",
              margin: 0,
            }}
          ></p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 20px",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <FaChartBar style={{ color: "#64748b" }} />
            <span
              style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}
            >
              {departments.length} Departments
            </span>
          </div>

          <button
            onClick={() => {
              setFormData({
                name: "",
                shortName: "",
                color: "#ffffff",
                gradient: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              });
              setShowModal(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              color: "#64748b",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
            }}
          >
            <span style={{ fontSize: "16px", backgroundColor: "transparent" }}>
              +
            </span>
            Add New
          </button>
        </div>
      </div>

      {/* Departments Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {departments
          .filter((dep) => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
              dep.name.toLowerCase().includes(searchLower) ||
              dep.shortName.toLowerCase().includes(searchLower)
            );
          })
          .map((dep) => {
            const data = dep.chart.map((val, i) => ({
              name: `Week ${i + 1}`,
              value: val,
              fill: dep.color,
            }));

            return (
              <div
                key={dep.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  padding: "28px",
                  boxShadow:
                    hoveredCard === dep.id
                      ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  border: "1px solid #f1f5f9",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform:
                    hoveredCard === dep.id
                      ? "translateY(-4px)"
                      : "translateY(0)",
                  position: "relative",
                }}
                onMouseEnter={() => setHoveredCard(dep.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Department Header */}
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  {/* Delete Button - Top Right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDepartment(dep.id, dep.name);
                    }}
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      width: "28px",
                      height: "28px",
                      backgroundColor: "transparent",
                      color: "#64748b",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                      opacity: hoveredCard === dep.id ? 1 : 0,
                      transform:
                        hoveredCard === dep.id ? "scale(1)" : "scale(0.8)",
                      zIndex: 10,
                      outline: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = "#dc2626";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#64748b";
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.outline = "none";
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                    onMouseDown={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                    onMouseUp={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    ✕
                  </button>

                  {/* Edit Button - Top Right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDepartment(dep);
                    }}
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "20px",
                      width: "32px",
                      height: "32px",
                      backgroundColor: "transparent",
                      color: "#64748b",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                      opacity: hoveredCard === dep.id ? 1 : 0,
                      transform:
                        hoveredCard === dep.id ? "scale(1)" : "scale(0.8)",
                      zIndex: 10,
                      outline: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#64748b";
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.outline = "none";
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                    onMouseDown={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                    onMouseUp={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    ✎
                  </button>

                  {/* Department Icon */}
                  <div
                    style={{
                      background: dep.gradient,
                      borderRadius: "12px",
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FaBuilding
                      style={{ color: "#ffffff", fontSize: "18px" }}
                    />
                  </div>

                  {/* Department Name and Short Name */}
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#1e293b",
                        marginBottom: "4px",
                      }}
                    >
                      {dep.name}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#64748b",
                      }}
                    >
                      {dep.shortName}
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                    marginBottom: "28px",
                  }}
                >
                  {/* People Count */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => handleShowPersonnel(dep)}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <FaUsers style={{ color: dep.color, fontSize: "16px" }} />
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#64748b",
                          fontWeight: "500",
                        }}
                      >
                        Personnel
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: "#1e293b",
                      }}
                    >
                      {dep.people}
                    </div>
                  </div>

                  {/* Hours */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => handleHoursClick(dep)}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <FaClock style={{ color: dep.color, fontSize: "16px" }} />
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#64748b",
                          fontWeight: "500",
                        }}
                      >
                        Hours
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: "#1e293b",
                      }}
                    >
                      {dep.hours}h
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div style={{ height: "200px", marginTop: "16px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
                      isAnimationActive={false}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        isAnimationActive={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        isAnimationActive={false}
                      />
                      <YAxis
                        domain={[0, 50]}
                        ticks={[0, 10, 20, 30, 40, 50]}
                        fontSize={12}
                        tick={{ fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        isAnimationActive={false}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        isAnimationActive={false}
                      />
                      <Bar
                        isAnimationActive={false}
                        dataKey="value"
                        radius={[6, 6, 0, 0]}
                        fill={dep.color}
                        opacity={0.8}
                      >
                        <LabelList
                          dataKey="value"
                          position="top"
                          fontSize={12}
                          fontWeight="600"
                          fill="#64748b"
                          isAnimationActive={false}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
      </div>

      {/* Add New Department Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "32px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                Add New Department
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Department Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  style={{
                    width: "80%",
                    padding: "14px 16px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    outline: "none",
                    backgroundColor: "#ffffff",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                  }}
                />
              </div>

              <div
                style={{ marginBottom: "20px", display: "flex", gap: "16px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Short Name
                  </label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) =>
                      handleInputChange("shortName", e.target.value)
                    }
                    required
                    style={{
                      width: "80%",
                      padding: "14px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      fontSize: "16px",
                      outline: "none",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.boxShadow =
                        "0 0 0 4px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow =
                        "0 2px 4px rgba(0, 0, 0, 0.05)";
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    style={{
                      width: "74%",
                      height: "50px",
                      padding: "14px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      cursor: "pointer",
                      outline: "none",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                    onMouseEnter={(e) => {
                      e.target.click();
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  marginTop: "24px",
                }}
              >
                <button
                  type="submit"
                  style={{
                    width: "140px",
                    padding: "12px 0",
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 16px rgba(16, 185, 129, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 12px rgba(16, 185, 129, 0.3)";
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    width: "140px",
                    padding: "12px 0",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#64748b",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "32px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                Edit Department
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Department Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  style={{
                    width: "80%",
                    padding: "14px 16px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    outline: "none",
                    backgroundColor: "#ffffff",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                  }}
                />
              </div>

              <div
                style={{ marginBottom: "20px", display: "flex", gap: "16px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Short Name
                  </label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) =>
                      handleInputChange("shortName", e.target.value)
                    }
                    required
                    style={{
                      width: "80%",
                      padding: "14px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      fontSize: "16px",
                      outline: "none",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.boxShadow =
                        "0 0 0 4px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow =
                        "0 2px 4px rgba(0, 0, 0, 0.05)";
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    style={{
                      width: "74%",
                      height: "50px",
                      padding: "14px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      cursor: "pointer",
                      outline: "none",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  marginTop: "24px",
                }}
              >
                <button
                  type="submit"
                  style={{
                    width: "140px",
                    padding: "12px 0",
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3 )",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 16px rgba(16, 185, 129, 0.3)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 12px rgba(16, 185, 129, 0.3)";
                  }}
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    width: "140px",
                    padding: "12px 0",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#64748b",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personnel Modal */}
      {showPersonnelModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowPersonnelModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "32px",
              width: "90%",
              maxWidth: "800px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                {selectedDepartment?.name} Personnel
              </h2>
              <button
                onClick={() => setShowPersonnelModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Personnel Table */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60px 22fr 150px 120px",
                gap: "74px",
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderRadius: "12px",
                marginBottom: "16px",
                fontWeight: "600",
                fontSize: "14px",
                color: "#374151",
              }}
            >
              <div>Photo</div>
              <div>Personnel Name</div>
              <div>Role</div>
              <div style={{ justifySelf: "center" }}>Status</div>
            </div>

            {departmentPersonnel.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#64748b",
                  fontSize: "16px",
                }}
              >
                No personnel found in this department
              </div>
            ) : (
              departmentPersonnel.map((person, index) => (
                <div
                  key={person.per_id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 22fr 150px 120px",
                    gap: "74px",
                    padding: "16px",
                    borderBottom: "1px solid #f1f5f9",
                    alignItems: "center",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Photo */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <img
                      src={
                        person.avatar_url ||
                        `https://ui-avatars.com/api/?name=${person.per_name}+${person.per_lname}&background=E5E7EB&color=111827`
                      }
                      alt={`${person.per_name} ${person.per_lname}`}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #e5e7eb",
                      }}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${person.per_name}+${person.per_lname}&background=E5E7EB&color=111827`;
                      }}
                    />
                  </div>

                  {/* Name */}
                  <div
                    style={{
                      fontWeight: "500",
                      color: "#111827",
                      textAlign: "left",
                    }}
                  >
                    {person.per_name} {person.per_lname}
                  </div>

                  {/* Role */}
                  <div style={{ color: "#6b7280", textAlign: "left" }}>
                    {person.per_role || "Intern"}
                  </div>

                  {/* Status */}
                  <div
                    style={{
                      justifySelf: "center",
                      alignSelf: "center",
                    }}
                  >
                    <span
                      className={person.statusClass}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500",
                        border: "1px solid",
                      }}
                    >
                      {person.statusLabel}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hours Modal */}
      {showHoursModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowHoursModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "32px",
              width: "90%",
              maxWidth: "850px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                {hoursDepartment?.name} – Hours Today
              </h2>
              <button
                onClick={() => setShowHoursModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Controls */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginBottom: 12,
              }}
            >
              {/* Search, Filter toggle and export - all in one row */}
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="text"
                  value={rawHoursSearch}
                  onChange={(e) => setRawHoursSearch(e.target.value)}
                  placeholder="Search personnel..."
                  style={{
                    padding: "8px 10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    fontSize: 13,
                    width: "33%",
                  }}
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    backgroundColor: "#f8fafc",
                    color: "#374151",
                    cursor: "pointer",
                    fontSize: 13,
                    height: 33,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {showFilters ? "Hide Filters" : "Filter"}
                  {activeFilterCount > 0 && (
                    <span
                      style={{
                        marginLeft: 6,
                        minWidth: 18,
                        height: 18,
                        padding: "0 6px",
                        borderRadius: 9999,
                        backgroundColor: "#e5e7eb",
                        color: "#111827",
                        fontSize: 11,
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    const data = computedHoursView;
                    const csvContent = [
                      "Foto,Personel,Çıkış,Çıkış,Toplam Saat,Fazla Mesai",
                      ...data.map((row) =>
                        [
                          row.per_avatar || "Foto",
                          `${row.per_name || ""} ${row.per_lname || ""}`,
                          row.inTime,
                          row.outTime,
                          formatHM(row.workedMin),
                          row.overtimeMin > 0 ? formatHM(row.overtimeMin) : "-",
                        ].join(",")
                      ),
                    ].join("\n");

                    const blob = new Blob([csvContent], {
                      type: "text/csv;charset=utf-8;",
                    });
                    const link = document.createElement("a");
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute(
                      "download",
                      `${
                        hoursDepartment?.name || "Department"
                      }_Hours_${getCurrentRangeLabel()}.csv`
                    );
                    link.style.visibility = "hidden";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    backgroundColor: "#f8fafc",
                    color: "#374151",
                    cursor: "pointer",
                    fontSize: 13,
                    height: 33,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginLeft: "auto",
                  }}
                  title="Export CSV"
                >
                  Export CSV
                </button>
                <button
                  onClick={addTestPersonRow}
                  style={{
                    padding: "8px 10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    backgroundColor: "#ffffff",
                    color: "#374151",
                    cursor: "pointer",
                    fontSize: 12,
                    height: 33,
                  }}
                  title="Add a test open shift row"
                >
                  + Test row
                </button>
              </div>

              {/* Filter controls - shown when showFilters is true */}
              {showFilters && (
                <>
                  {/* First row - Dropdowns */}
                  <div
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <select
                      value={overtimeThresholdMin}
                      onChange={(e) =>
                        setOvertimeThresholdMin(Number(e.target.value))
                      }
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        backgroundColor: "#ffffff",
                        color: "#111827",
                        minWidth: 80,
                        height: 33,
                        boxShadow: "0 2px 8px rgba(2,6,23,0.05)",
                        appearance: "none",
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg width='12' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        paddingRight: 36,
                        fontSize: 13,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#cbd5e1";
                        e.target.style.boxShadow =
                          "0 3px 10px rgba(2,6,23,0.08)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.boxShadow =
                          "0 2px 8px rgba(2,6,23,0.05)";
                      }}
                    >
                      <option value={480}>Threshold 8h</option>
                      <option value={510}>Threshold 8h30</option>
                      <option value={540}>Threshold 9h</option>
                    </select>
                    <select
                      value={defaultBreakMin}
                      onChange={(e) =>
                        setDefaultBreakMin(Number(e.target.value))
                      }
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        backgroundColor: "#ffffff",
                        color: "#111827",
                        minWidth: 140,
                        height: 33,
                        boxShadow: "0 2px 8px rgba(2,6,23,0.05)",
                        appearance: "none",
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg width='12' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        paddingRight: 36,
                        fontSize: 13,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#cbd5e1";
                        e.target.style.boxShadow =
                          "0 3px 10px rgba(2,6,23,0.08)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.boxShadow =
                          "0 2px 8px rgba(2,6,23,0.05)";
                      }}
                    >
                      <option value={0}>Break 0m</option>
                      <option value={30}>Break 30m</option>
                      <option value={60}>Break 1h</option>
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        backgroundColor: "#ffffff",
                        color: "#111827",
                        minWidth: 120,
                        height: 33,
                        boxShadow: "0 2px 8px rgba(2,6,23,0.05)",
                        appearance: "none",
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg width='12' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        paddingRight: 36,
                        fontSize: 13,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#cbd5e1";
                        e.target.style.boxShadow =
                          "0 3px 10px rgba(2,6,23,0.08)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.boxShadow =
                          "0 2px 8px rgba(2,6,23,0.05)";
                      }}
                    >
                      <option value="sortby">Sort By</option>
                      <option value="name">Name</option>
                      <option value="checkin">Check-in</option>
                      <option value="checkout">Check-out</option>
                      <option value="hours">Hours</option>
                      <option value="overtime">Overtime</option>
                    </select>
                    <button
                      onClick={() => setSortDesc(!sortDesc)}
                      style={{
                        padding: "8px 10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        backgroundColor: "#f8fafc",
                        color: "#374151",
                        cursor: "pointer",
                        fontSize: 13,
                        height: 33,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 33,
                      }}
                      title={sortDesc ? "Descending" : "Ascending"}
                    >
                      {sortDesc ? "↓" : "↑"}
                    </button>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        backgroundColor: "#ffffff",
                        color: "#111827",
                        minWidth: 120,
                        height: 33,
                        boxShadow: "0 2px 8px rgba(2,6,23,0.05)",
                        appearance: "none",
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg width='12' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        paddingRight: 36,
                        fontSize: 13,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#cbd5e1";
                        e.target.style.boxShadow =
                          "0 3px 10px rgba(2,6,23,0.08)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.boxShadow =
                          "0 2px 8px rgba(2,6,23,0.05)";
                      }}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="onleave">On Leave</option>
                      <option value="absent">Absent</option>
                    </select>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: 13,
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={showOvertimeOnly}
                        onChange={(e) => setShowOvertimeOnly(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                      Has overtime
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: 13,
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={openShiftOnly}
                        onChange={(e) => setOpenShiftOnly(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                      Open shift only
                    </label>
                    <button
                      onClick={resetFilters}
                      style={{
                        padding: "6px 10px",
                        border: "1px solid #fecaca",
                        borderRadius: 5,
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        cursor: "pointer",
                        fontSize: 11,
                        height: 28,
                        marginLeft: 6,
                      }}
                      title="Reset filters"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Second row - Date filter + quick presets */}
                  <div
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <select
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        if (e.target.value === "custom_range") {
                          setCustomDateRange({
                            start: new Date().toISOString().slice(0, 10),
                            end: new Date().toISOString().slice(0, 10),
                          });
                        }
                      }}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        backgroundColor: "#ffffff",
                        color: "#111827",
                        minWidth: 140,
                        height: 33,
                        boxShadow: "0 2px 8px rgba(2,6,23,0.05)",
                        appearance: "none",
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg width='12' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        paddingRight: 36,
                        fontSize: 13,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#cbd5e1";
                        e.target.style.boxShadow =
                          "0 3px 10px rgba(2,6,23,0.08)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.boxShadow =
                          "0 2px 8px rgba(2,6,23,0.05)";
                      }}
                    >
                      <option value="today">Today</option>
                      <option value="this_week">This week</option>
                      <option value="custom_range">Custom range</option>
                    </select>
                    {dateFilter === "custom_range" && (
                      <>
                        <input
                          type="date"
                          value={customDateRange.start}
                          onChange={(e) =>
                            setCustomDateRange((prev) => ({
                              ...prev,
                              start: e.target.value,
                            }))
                          }
                          style={{
                            padding: "6px 12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            backgroundColor: "#ffffff",
                            color: "#111827",
                            height: 33,
                            boxSizing: "border-box",
                            appearance: "none",
                            WebkitAppearance: "none",
                            MozAppearance: "textfield",
                            fontSize: 13,
                          }}
                        />
                        <span style={{ color: "#6b7280", fontSize: 13 }}>
                          to
                        </span>
                        <input
                          type="date"
                          value={customDateRange.end}
                          onChange={(e) =>
                            setCustomDateRange((prev) => ({
                              ...prev,
                              end: e.target.value,
                            }))
                          }
                          style={{
                            padding: "6px 12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            backgroundColor: "#ffffff",
                            color: "#111827",
                            height: 33,
                            boxSizing: "border-box",
                            appearance: "none",
                            WebkitAppearance: "none",
                            MozAppearance: "textfield",
                            fontSize: 13,
                          }}
                        />
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60px 18fr 140px 140px 120px 120px",
                gap: "32px",
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderRadius: "12px",
                marginBottom: "16px",
                fontWeight: "600",
                fontSize: "14px",
                color: "#374151",
                position: "sticky",
                top: 0,
                zIndex: 5,
              }}
            >
              <div>Photo</div>
              <div
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSortField("name");
                  setSortDesc((d) => !d);
                }}
              >
                Personnel Name
              </div>
              <div
                style={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => {
                  setSortField("in");
                  setSortDesc((d) => !d);
                }}
              >
                Check-in
              </div>
              <div
                style={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => {
                  setSortField("out");
                  setSortDesc((d) => !d);
                }}
              >
                Check-out
              </div>
              <div
                style={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => {
                  setSortField("worked");
                  setSortDesc((d) => !d);
                }}
              >
                Total Hours
              </div>
              <div style={{ textAlign: "center" }}>Overtime</div>
            </div>

            {/* Table Rows */}
            {isLoadingHours ? (
              [0, 1, 2].map((s) => (
                <div
                  key={`skeleton-${s}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 18fr 140px 140px 120px 120px",
                    gap: "32px",
                    padding: "16px",
                    borderBottom: "1px solid #f1f5f9",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      height: 40,
                      width: 40,
                      borderRadius: "50%",
                      background: "#f1f5f9",
                    }}
                  />
                  <div
                    style={{
                      height: 14,
                      borderRadius: 6,
                      background: "#f1f5f9",
                      width: "40%",
                    }}
                  />
                  <div
                    style={{
                      height: 14,
                      borderRadius: 6,
                      background: "#f1f5f9",
                      width: 80,
                      justifySelf: "center",
                    }}
                  />
                  <div
                    style={{
                      height: 14,
                      borderRadius: 6,
                      background: "#f1f5f9",
                      width: 80,
                      justifySelf: "center",
                    }}
                  />
                  <div
                    style={{
                      height: 14,
                      borderRadius: 6,
                      background: "#f1f5f9",
                      width: 60,
                      justifySelf: "center",
                    }}
                  />
                  <div
                    style={{
                      height: 14,
                      borderRadius: 6,
                      background: "#f1f5f9",
                      width: 60,
                      justifySelf: "center",
                    }}
                  />
                </div>
              ))
            ) : computedHoursView.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#64748b",
                  fontSize: "16px",
                }}
              >
                No records for selected filters
              </div>
            ) : (
              computedHoursView.map((row, idx) => (
                <div
                  key={`${row.per_id}-${idx}`}
                  className={row.hasOpenShift ? "open-shift-row" : ""}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 18fr 140px 140px 120px 120px",
                    gap: "32px",
                    padding: "16px",
                    borderBottom: "1px solid #f1f5f9",
                    alignItems: "center",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <img
                      src={
                        row.avatar_url ||
                        `https://ui-avatars.com/api/?name=${row.per_name}+${row.per_lname}&background=E5E7EB&color=111827`
                      }
                      alt={`${row.per_name} ${row.per_lname}`}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #e5e7eb",
                      }}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${row.per_name}+${row.per_lname}&background=E5E7EB&color=111827`;
                      }}
                    />
                  </div>
                  <div style={{ fontWeight: "500", color: "#111827" }}>
                    {row.per_name} {row.per_lname}
                  </div>
                  <div style={{ color: "#6b7280", textAlign: "center" }}>
                    {row.inTime}
                  </div>
                  <div style={{ color: "#6b7280", textAlign: "center" }}>
                    {row.outTime}
                    {dateFilter === "today" &&
                      row.inTime !== "-" &&
                      row.outTime === "-" && (
                        <span
                          style={{
                            marginLeft: 8,
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            border: "1px solid #fed7aa",
                            background: "#fffbeb",
                            color: "#92400e",
                          }}
                        >
                          Open shift
                        </span>
                      )}
                  </div>
                  <div style={{ color: "#111827", textAlign: "center" }}>
                    {formatHM(row.workedMin)}
                  </div>
                  <div
                    style={{
                      color: row.overtimeMin > 0 ? "#16a34a" : "#64748b",
                      textAlign: "center",
                    }}
                  >
                    {row.overtimeMin > 0 ? formatHM(row.overtimeMin) : "-"}
                  </div>
                </div>
              ))
            )}

            {/* Summary Row */}
            {computedHoursView.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 18fr 140px 140px 120px 120px",
                  gap: "32px",
                  padding: "14px 16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "12px",
                  marginTop: "8px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                <div></div>
                <div style={{ textAlign: "left" }}>Summary</div>
                <div style={{ textAlign: "center" }}>—</div>
                <div style={{ textAlign: "center" }}>—</div>
                <div style={{ textAlign: "center" }}>
                  {formatHM(computedSummary.avgWorked)}
                </div>
                <div style={{ textAlign: "center", color: "#16a34a" }}>
                  {formatHM(computedSummary.totalOvertime)}
                </div>
              </div>
            )}

            {/* Toast */}
            {toast.visible && (
              <div
                style={{
                  position: "fixed",
                  top: 20,
                  right: 20,
                  background: toast.type === "error" ? "#fee2e2" : "#dcfce7",
                  color: toast.type === "error" ? "#991b1b" : "#065f46",
                  border: `1px solid ${
                    toast.type === "error" ? "#fecaca" : "#a7f3d0"
                  }`,
                  padding: "10px 14px",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 1100,
                }}
              >
                {toast.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
