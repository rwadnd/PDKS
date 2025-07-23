// Personel verisi
export const personnel = [
  { id: 1, name: "Ahmet Yılmaz", department: "Muhasebe" },
  { id: 2, name: "Ayşe Demir", department: "İK" },
  { id: 3, name: "Mehmet Kaya", department: "IT" },
];

// Departman verisi
export const departments = [
  { id: 1, name: "Muhasebe" },
  { id: 2, name: "İK" },
  { id: 3, name: "IT" },
];

// Giriş kayıtları (örnek)
export const entries = [
  { id: 1, personId: 1, date: "2025-07-01", entry: "09:00", exit: "18:00" },
  { id: 2, personId: 2, date: "2025-07-01", entry: "08:45", exit: "17:30" },
  { id: 3, personId: 3, date: "2025-07-01", entry: "09:15", exit: "18:10" },
];

// Takvim etkinlikleri (örnek)
export const calendarEvents = [
  {
    id: 1,
    title: "Design Conference",
    start: "2025-07-03",
    end: "2025-07-03",
    color: "#7B61FF",
  },
  {
    id: 2,
    title: "Weekend Festival",
    start: "2025-07-16",
    end: "2025-07-16",
    color: "#FFB3E6",
  },
  {
    id: 3,
    title: "Glastonbury Festival",
    start: "2025-07-25",
    end: "2025-07-28",
    color: "#FFD6A5",
  },
];
