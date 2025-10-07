import { useState, useRef, useEffect } from "react";
import {
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  format,
  getDay,
} from "date-fns";
import timetableData from "../../backend/timetable.json";
import "./App2.css";
// top of file
import SlotEditorModal from "./SlotEditorModal";


interface SlotData {
  weekday: string;
  startTime: string;
  endTime: string;
  title: string;
}

interface Slot {
  dayIndex: number;
  startHour: number; // decimal hour
  endHour: number;
  title: string;
}

interface ChatMessage {
  type: "user" | "bot";
  text: string;
}

const HOUR_HEIGHT = 25;
const HEADER_HEIGHT = 40;
const TIMETABLE_HOURS = 24;
const TIMETABLE_HEIGHT = TIMETABLE_HOURS * HOUR_HEIGHT;

export default function App2() {
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // ------------------ CHAT ------------------
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // add user message
    setMessages((prev) => [...prev, { type: "user", text: chatInput }]);
    const userMessage = chatInput;
    setChatInput("");

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      const botReply = data.reply || "No reply";

      // add bot message
      setMessages((prev) => [...prev, { type: "bot", text: botReply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error: could not reach server" },
      ]);
    }
  };

  // ------------------ CALENDAR ------------------
  const parseSlots = (): Slot[] => {
    const slots: Slot[] = [];
    for (const dateStr in timetableData) {
      const [dd, mm, yyyy] = dateStr.split("/");
      const date = new Date(+yyyy, +mm - 1, +dd);
      if (date >= weekStart && date < addDays(weekStart, 7)) {
        timetableData[dateStr].forEach((s: SlotData) => {
          const [sh, sm] = s.startTime.split(":").map(Number);
          const [eh, em] = s.endTime.split(":").map(Number);
          const startHour = sh + sm / 60;
          const endHour = eh + em / 60;
          const dayIndex = getDay(date);
          slots.push({ dayIndex, startHour, endHour, title: s.title });
        });
      }
    }
    return slots;
  };

  const slots = parseSlots();

  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);


  const handleSlotClick = () => {
    setShowModal(true);
  };


  const prevWeek = () => setWeekStart(subWeeks(weekStart, 1));
  const nextWeek = () => setWeekStart(addWeeks(weekStart, 1));

  const formatHour = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour % 1) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  return (
    <div className="app-layout">
      {/* ---------- CALENDAR ---------- */}
      <div className="calendar-container">
        <div className="calendar-wrapper">
          <div className="week-nav">
            <button onClick={prevWeek}>◀ Previous Week</button>
            <div className="week-label">
              Week of {format(weekStart, "dd/MM/yyyy")}
            </div>
            <button onClick={nextWeek}>Next Week ▶</button>
          </div>

          <div className="timetable-wrapper">
            <div
              className="timetable"
              style={{ height: HEADER_HEIGHT + TIMETABLE_HEIGHT }}
            >
              {/* Time column */}
              <div className="time-column">
                <div className="day-header" style={{ height: HEADER_HEIGHT }} />
                {Array.from({ length: TIMETABLE_HOURS }).map((_, hour) => (
                  <div key={hour} className="time-row" style={{ height: HOUR_HEIGHT }}>
                    {String(hour).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {Array.from({ length: 7 }).map((_, i) => {
                const dayDate = addDays(weekStart, i);
                const daySlots = slots.filter((s) => s.dayIndex === getDay(dayDate));
                return (
                  <div key={i} className="day-column">
                    <div className="day-header" style={{ height: HEADER_HEIGHT }}>
                      {format(dayDate, "EEE dd/MM")}
                    </div>
                    <div className="day-slots" style={{ height: TIMETABLE_HEIGHT }}>
                      {daySlots.map((slot, idx) => (
                        <div
                          key={idx}
                          className="busy-block"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setShowModal(true);
                          }} 
                          style={{
                            top: slot.startHour * HOUR_HEIGHT,
                            height: (slot.endHour - slot.startHour) * HOUR_HEIGHT,
                          }}
                          title={`${slot.title} (${formatHour(
                            slot.startHour
                          )} - ${formatHour(slot.endHour)})`}
                        >
                          <div className="busy-title">{slot.title}</div>
                          <div className="busy-time">
                            {formatHour(slot.startHour)}–{formatHour(slot.endHour)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
         {/* ---------- SLOT EDITOR POPUP ---------- */}
          {showModal && selectedSlot && (
          <SlotEditorModal
            slotTitle={selectedSlot.title}
            onClose={() => setShowModal(false)}
          />
      )}
      </div>

      {/* ---------- CHATBOT ---------- */}
      <div
        className="chatbot-container"
        style={{ height: HEADER_HEIGHT + TIMETABLE_HEIGHT }}
      >
        <div className="chat-history" ref={chatHistoryRef}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`chat-message ${m.type === "user" ? "user" : "bot"}`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <form className="chat-input" onSubmit={handleChatSubmit}>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type your message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
