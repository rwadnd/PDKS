import React from "react";
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
import "../App.css";

const departments = [
  {
    id: 1,
    name: "Quality Assurance (QA) Department",
    people: 3,
    hours: 126,
    chart: [45, 40, 41],
  },
  {
    id: 2,
    name: "IT Department",
    people: 4,
    hours: 204,
    chart: [45, 40, 41],
  },
  {
    id: 3,
    name: "HR Department",
    people: 2,
    hours: 88,
    chart: [38, 25, 25],
  },
];

const barColors = ["#a48bfa", "#ffb3c6", "#7ed6df"];
const barLabels = ["A", "B", "C"];

const PeopleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#7b61ff">
    <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05C16.16 13.41 18 14.28 18 15.5V19h6v-2.5c0-2.33-4.67-3.5-6-3.5z" />
  </svg>
);
const ClockIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#7b61ff">
    <path d="M12 20c4.41 0 8-3.59 8-8s-3.59-8-8-8-8 3.59-8 8 3.59 8 8 8zm0-18c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm1 5h-2v6l5.25 3.15.77-1.28-4.02-2.37V7z" />
  </svg>
);

const Departments = () => (
  <div
    style={{
      maxHeight: 500,
      overflowY: "auto",
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 48,
      paddingBottom: 24,
      alignItems: "start",
    }}
  >
    {departments.map((dep) => {
      // Bar chart için veri formatı
      const data = dep.chart.map((val, i) => ({
        name: barLabels[i],
        value: val,
        fill: barColors[i],
      }));
      return (
        <div
          key={dep.id}
          style={{
            minWidth: 340,
            background: "#fff",
            borderRadius: 32,
            boxShadow: "0 4px 16px #e5e9f2",
            padding: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 28,
              marginBottom: 32,
              textAlign: "center",
              color: "#223",
              letterSpacing: 0.2,
            }}
          >
            {dep.name}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 32,
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 32,
                color: "#7b61ff",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <PeopleIcon />{" "}
              <span style={{ fontWeight: 700, fontSize: 28 }}>
                {dep.people}
              </span>
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#7b61ff",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ClockIcon />{" "}
              <span style={{ fontWeight: 700, fontSize: 28 }}>{dep.hours}</span>
            </div>
          </div>
          {/* Gerçek bar chart */}
          <div style={{ width: 260, height: 180, margin: "0 auto" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 20, left: 10, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={false}
                  label={{
                    value: "Total Work Hour",
                    position: "insideBottom",
                    offset: -10,
                    fontSize: 16,
                    fill: "#888",
                  }}
                />
                <YAxis
                  domain={[0, 50]}
                  ticks={[0, 10, 20, 30, 40, 50]}
                  fontSize={14}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    fontSize={16}
                    fontWeight={700}
                    fill="#555"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    })}
  </div>
);

export default Departments;
