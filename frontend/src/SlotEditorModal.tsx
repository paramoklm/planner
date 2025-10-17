import React, { useState } from "react";
import { format, parse } from "date-fns";

import "./SlotEditorModal.css";

interface SlotEditorModalProps {
  slotTitle: string;
  onClose: () => void;
  date: string;
  index: number;
  startTime: string;
  endTime: string;
}


export default function SlotEditorModal({
  slotTitle,
  onClose,
  date: initialDate, // 🟢 Rename to avoid conflict with local state
  index,
  startTime: initialStartTime,
  endTime: initialEndTime,
}: SlotEditorModalProps) {
  const [title, setTitle] = useState(slotTitle);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);

  const [date, setDate] = useState(() => {
  // Convert "dd/mm/yyyy" → "yyyy-mm-dd" for HTML <input type="date">
  const [dd, mm, yyyy] = initialDate.split("/");
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
});

  const times = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

  const handleDone = async () => {
    const newSlot = {
      title,
      startTime,
      endTime,
      weekday: "", // 🟢 optional placeholder (backend ignores)
    };

    try {
      // Convert back from "yyyy-mm-dd" → "dd/mm/yyyy" before sending
      const [yyyy, mm, dd] = date.split("-");
      const formattedDate = `${dd}/${mm}/${yyyy}`;
      const response = await fetch("http://localhost:5000/update_slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          old_date: initialDate,  // 🟢 the original date (in dd/mm/yyyy)
          date: formattedDate,     // 🟢 the possibly changed date
          index,
          new_slot: newSlot,
      }),
      });

      if (!response.ok) {
        console.error("❌ Update failed:", await response.json());
      } else {
        console.log("✅ Slot updated successfully!");
      }
    } catch (error) {
      console.error("❌ Failed to update slot:", error);
    }

    onClose(); // close modal after update
  };

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
          <select className="modal-time-button" value={startTime}
            onChange={(e) => setStartTime(e.target.value)}> {
              times.map((t) => (<option key={t} value={t}>{t}</option>

              ))}
          </select>
          <span style={{ margin: "0 8px" }}>–</span>

          <select className="modal-time-button" value={endTime} onChange={(e) => setEndTime(e.target.value)}> {times.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select> </div>
        {/* Done button */}
        <button className="modal-close-button" onClick={handleDone}>
          Done
        </button>
      </div>
    </div>
  );
}
