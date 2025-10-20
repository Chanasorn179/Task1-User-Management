import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    labels: [],
    active: [],
    breakUsers: [],
    away: [],
  });
  const [intervalMs, setIntervalMs] = useState(3000);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("simulation"); // simulation | backend
  const [currentTime, setCurrentTime] = useState(new Date()); // ⏱ เวลาปัจจุบัน
  const intervalRef = useRef(null);

  // ⏱ อัปเดตเวลาปัจจุบันทุก 1 วินาที
  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  // 📡 Backend
  const fetchFromBackend = async () => {
    try {
      const res = await api.get("/supervisor/metrics");
      const payload = res.data || {};
      setStats({
        labels: payload.labels || [],
        active: payload.active || [],
        breakUsers: payload.breakUsers || [],
        away: payload.away || [],
      });
    } catch (err) {
      console.error("❌ failed to load metrics from backend", err);
    }
  };

  // 🧪 Simulation
  const simulateData = () => {
    const now = new Date();
    const label = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const active = Math.floor(Math.random() * 30);
    const breakUsers = Math.floor(Math.random() * 15);
    const away = Math.floor(Math.random() * 10);

    setStats((prev) => ({
      labels: [...prev.labels, label].slice(-10),
      active: [...prev.active, active].slice(-10),
      breakUsers: [...prev.breakUsers, breakUsers].slice(-10),
      away: [...prev.away, away].slice(-10),
    }));
  };

  // ▶ Start
  const startSimulation = () => {
    if (intervalRef.current) return;
    setRunning(true);
    if (mode === "simulation") {
      intervalRef.current = setInterval(simulateData, intervalMs);
    } else {
      intervalRef.current = setInterval(fetchFromBackend, intervalMs);
    }
  };

  // ⏸ Stop
  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  };

  // 🔄 Reset
  const resetSimulation = () => {
    setStats({ labels: [], active: [], breakUsers: [], away: [] });
  };

  // 🕒 เปลี่ยน Interval
  const handleIntervalChange = (e) => {
    const newInterval = Number(e.target.value);
    setIntervalMs(newInterval);
    if (running) {
      stopSimulation();
      setTimeout(() => startSimulation(), 0);
    }
  };

  // 🔁 เปลี่ยนโหมด
  const toggleMode = () => {
    stopSimulation();
    resetSimulation();
    setMode(mode === "simulation" ? "backend" : "simulation");
  };

  useEffect(() => {
    return () => stopSimulation();
  }, []);

  const chartData = {
    labels: stats.labels,
    datasets: [
      {
        label: "Active Users",
        data: stats.active,
        borderColor: "#4bc0c0",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Break Users",
        data: stats.breakUsers,
        borderColor: "#ff6384",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Away Users",
        data: stats.away,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `Supervisor Dashboard (${
          mode === "simulation" ? "Simulation" : "Backend"
        })`,
      },
    },
    scales: { y: { beginAtZero: true, suggestedMax: 30 } },
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Supervisor Dashboard</h1>

      {/* 🕒 Status Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f3f4f6",
          padding: "10px 15px",
          borderRadius: "8px",
          marginBottom: "15px",
        }}
      >
        <div>
          ⏱ <strong>{currentTime.toLocaleTimeString()}</strong>
        </div>
        <div>
          🛰 Mode:{" "}
          <strong>{mode === "simulation" ? "Simulation" : "Backend"}</strong>
        </div>
        <div>
          {running ? (
            <span style={{ color: "green", fontWeight: "bold" }}>
              🟢 Running
            </span>
          ) : (
            <span style={{ color: "red", fontWeight: "bold" }}>🔴 Stopped</span>
          )}
        </div>
      </div>

      {/* 🕹 Control Panel */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={startSimulation}
          disabled={running}
          style={{
            padding: "6px 12px",
            background: "#4bc0c0",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          ▶ Start
        </button>

        <button
          onClick={stopSimulation}
          disabled={!running}
          style={{
            padding: "6px 12px",
            background: "#ff6384",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          ⏸ Stop
        </button>

        <button
          onClick={resetSimulation}
          style={{
            padding: "6px 12px",
            background: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          🔄 Reset
        </button>

        <label>
          Interval (ms):&nbsp;
          <select value={intervalMs} onChange={handleIntervalChange}>
            <option value={1000}>1000</option>
            <option value={2000}>2000</option>
            <option value={3000}>3000</option>
            <option value={5000}>5000</option>
          </select>
        </label>

        <button
          onClick={toggleMode}
          style={{
            padding: "6px 12px",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          🔁 Switch to {mode === "simulation" ? "Backend" : "Simulation"}
        </button>
      </div>

      <div style={{ maxWidth: 900 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
