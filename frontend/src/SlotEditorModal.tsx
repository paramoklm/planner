import React, { useState } from "react";
import "./SlotEditorModal.css";

interface SlotEditorModalProps {
  slotTitle: string;
  onClose: () => void;
}

export default function SlotEditorModal({ slotTitle, onClose }: SlotEditorModalProps) {
  const [title, setTitle] = useState(slotTitle);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [date, setDate] = useState("2025-10-07");

  // simple local selectors
  const times = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
  const dates = ["2025-10-07", "2025-10-08", "2025-10-09", "2025-10-10", "2025-10-11"];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Title */}
        <input
          className="modal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Date selector */}
        <select className="modal-date-button" value={date} onChange={(e) => setDate(e.target.value)}>
          {dates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Start/End time selector */}
        <div className="modal-time-row">
          <select className="modal-time-button" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
            {times.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span style={{ margin: "0 8px" }}>–</span>
          <select className="modal-time-button" value={endTime} onChange={(e) => setEndTime(e.target.value)}>
            {times.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Close button */}
        <button className="modal-close-button" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
