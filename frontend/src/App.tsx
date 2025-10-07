import { useState, useEffect, useRef } from "react";
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

interface SlotData {
  weekday: string;
  startTime: string;
  endTime: string;
  title: string;
}

interface Slot {
  dayIndex: number;
  startHour: number; // decimal (e.g. 16.5 = 16:30)
  endHour: number;
  title: string;
}

interface ChatMessage {
  sender: "user" | "bot";
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
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // refs for robust scrolling
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // scroll-to-bottom effect (robust)
  useEffect(() => {
    const el = chatContainerRef.current;
    // wait for paint, then try to scroll the bottomAnchor into view,
    // fallback to directly setting scrollTop if needed.
    requestAnimationFrame(() => {
      try {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior: "auto", block: "end" });
          return;
        }
      } catch (err) {
        // ignore and fallback
      }
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, [messages]);

  // parse timetable.json for current week into decimal hour slots
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

  const prevWeek = () => setWeekStart(subWeeks(weekStart, 1));
  const nextWeek = () => setWeekStart(addWeeks(weekStart, 1));

  const formatHour = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour % 1) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    // append user message
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setChatInput("");

    try {
      const res = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data?.reply ?? "hello world";
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    } catch (err) {
      console.error("Chat backend error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Error contacting server" },
      ]);
    }
  };

  return (
    <div className="app-layout">
      {/* Calendar side */}
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
              {/* time column */}
              <div className="time-column">
                <div className="day-header" style={{ height: HEADER_HEIGHT }} />
                {Array.from({ length: TIMETABLE_HOURS }).map((_, hour) => (
                  <div
                    key={hour}
                    className="time-row"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* day columns */}
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
                          style={{
                            top: slot.startHour * HOUR_HEIGHT,
                            height: (slot.endHour - slot.startHour) * HOUR_HEIGHT,
                          }}
                          title={`${slot.title} (${formatHour(slot.startHour)} - ${formatHour(slot.endHour)})`}
                        >
                          <div className="busy-title">{slot.title}</div>
                          <div className="busy-time">{formatHour(slot.startHour)}–{formatHour(slot.endHour)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot side */}
      <div className="chatbot-container" style={{ height: HEADER_HEIGHT + TIMETABLE_HEIGHT }}>
        <div className="chat-history" ref={chatContainerRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}

          {/* bottom anchor for scrollIntoView fallback */}
          <div ref={bottomRef} />
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
