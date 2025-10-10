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

  const times = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Title */}
        <input
          className="modal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Date picker */}
        <input
          type="date"
          className="modal-date-picker"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

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

        {/* Done button */}
        <button className="modal-close-button" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
