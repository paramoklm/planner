# 🧠 Planner Project — Multi-Agent AI Timetable Assistant

## 🚀 Overview

The **Planner Project** is an experimental AI-powered **timetable assistant** built to explore the potential of **multi-agent AI systems** using [CrewAI](https://github.com/joaomdmoura/crewai).

This project demonstrates how multiple specialized AI agents can **collaborate** to understand natural language, manage structured data, and provide intelligent responses — all working together as a coordinated system.

> ⚠️ The project is **still under development** and serves as a learning playground for experimenting with CrewAI and multi-agent architectures.

---

## 💡 Use Case

Imagine having an AI assistant that not only stores your events but can **understand, modify, and reason** about your schedule.

With the Planner Project, you can:
- **Add, remove, or edit** events in a timetable  
- **Ask questions** such as:
  - “What events do I have on the 19th of September?”
  - “When is my next meeting with the doctor?”
- **Interact through a simple web interface** that visualizes your weekly schedule

Behind the scenes, multiple CrewAI agents communicate:
- An **Event Summarizer** extracts event details
- A **Timetable Assistant** manages event slots
- A **Question-Answering Agent** interprets user queries about the schedule
- A **Manager Agent** coordinates who does what

This showcases the power of **multi-agent collaboration** — where each AI focuses on what it does best.

---

## 🧰 Tech Stack

**Backend**
- 🐍 **Python**
- ⚙️ **Flask** — REST API for communication between AI agents and the frontend
- 🧩 **CrewAI** — for building the multi-agent system

**Frontend**
- ⚛️ **React (TSX)** — modern frontend framework
- 💅 **CSS** — clean and responsive layout for the timetable
- 🔄 **Fetch API** — to communicate with Flask backend

---
<img width="1860" height="886" alt="Screenshot 2025-10-17 190202" src="https://github.com/user-attachments/assets/260558ff-252c-42cb-8d2a-37b82a4387a4" />

<img width="1377" height="895" alt="Screenshot 2025-10-17 190251" src="https://github.com/user-attachments/assets/9a60504b-ccc4-41e9-ade3-adc745428aeb" />




