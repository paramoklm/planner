# IMPORTS

import os
import yaml
import warnings
from typing import List
from tiktoken import encoding_for_model
import random

from utils import get_openai_api_key
from utils_data import add_slot, is_slot_conflict, remove_slot, access_timetable, access_timetable_with_date

import crewai
from crewai import Agent, Task, Crew, Process
from pydantic import BaseModel, Field
from crewai.tools import BaseTool
from crewai.flow import Flow, router, listen, start
from crewai import LLM


warnings.filterwarnings('ignore')

# SETUP CONFIG

# Define file paths for YAML configurations
files = {
    'agents': 'config/agents.yaml',
    'tasks': 'config/tasks.yaml'
}

# Load configurations from YAML files
configs = {}
for config_type, file_path in files.items():
    with open(file_path, 'r') as file:
        configs[config_type] = yaml.safe_load(file)

# Assign loaded configurations to specific variables
agents_config = configs['agents']
tasks_config = configs['tasks']

# PYDANTIC MODEL

class EventSlot(BaseModel):
    date: str = Field(..., description="The date of the event. The format is: DD/MM/YYYY")
    weekday: str = Field(..., description="The date's week day.")
    startTime: str = Field(..., description="Start time of the slot. The format is: HH:MM")
    endTime: str = Field(..., description="End time of the slot. The format is: HH:MM")
    title: str = Field(..., description="Short title to summarize the event's essential information.")

class MultipleSlots(BaseModel):
    slots: List[EventSlot] = Field(..., description="List of event slots")


# TOOLS

from datetime import date
from typing import Type


from datetime import datetime

class InputDate(BaseModel):
    date: str = Field(..., description="The date of the event. The format is: DD/MM/YYYY")
    weekday: str = Field(..., description="The date's week day.")

class ValidDateTool(BaseTool):
    name: str = "Valid Date Tool"
    description: str = "Tool that checks if the date and week day are valid"
    args_schema: Type[BaseModel] = InputDate

    def _run(self, date: str, weekday: str):
        try:
            datetime.strptime(date, "%d/%m/%Y")
        except ValueError as e:
            return f"Error: {str(e)}. Please provide a valid date."
        
        try:
            date_obj = datetime.strptime(date, "%d/%m/%Y")
            correct_weekday = date_obj.strftime("%A")  # Full name (e.g., "Monday")
            correct_weekday.lower().startswith(weekday.lower())
            return "Valid date"
        except ValueError as e:
            return f"Error: {str(e)}. The week day does not corresponds to the date"
        
class AddSlot(BaseTool):
    name: str = "Add Slot Tool"
    description: str = "Tool that adds slots to the timetable using these informations: date, weekday, start time, end time and the title of the event."
    args_schema: Type[BaseModel] = MultipleSlots

    def _run(self, slots: MultipleSlots):
        for eventSlot in slots:
            res = add_slot(eventSlot)
            if res != "SUCCESS":
                return res
        return "Successfully added slot(s)"
    
class RemoveSlot(BaseTool):
    name: str = "Remove Slot Tool"
    description: str = "Tool that removes slots to the timetable using these informations: date, weekday, start time, end time and the title of the event.\n" \
    "Do not call this tool again if already successful."
    args_schema: Type[BaseModel] = MultipleSlots

    def _run(self, slots: MultipleSlots):
        res = ""
        for eventSlot in slots:
            res += remove_slot(eventSlot) + "\n"
        return res

class AccessTimetableWithDate(BaseTool):
    name: str = "Access Timetable"
    description: str = "Tool that enables access to slots on a specific date in dict (format of date DD/MM/YYYY)"
    
    def _run(self, date_input: str):
        return access_timetable_with_date(date_input)
            
    
class CheckConflict(BaseTool):
    name: str = "Check Conflict Tool"
    description: str = "Tool that checks if there is a conflict between an event and an already setup event in the timetable. " \
    "Returns the list of events where there is a conflict with already setup events in the timetable."
    args_schema: Type[BaseModel] = MultipleSlots

    def _run(self, slots: MultipleSlots):
        conflicts = []
        for slot in slots:
            res = is_slot_conflict(slot)
            if res == "There is a conflict":
                conflicts.append(slot)
        return conflicts

# AGENTS

converter = Agent(
    config=agents_config["converter"],
    inject_date=True,
    date_format="%A, %B %d, %Y",
    tools=[ValidDateTool()]
)

assistant = Agent(
    config=agents_config["assistant"],
    tools=[AddSlot(), CheckConflict(), RemoveSlot(), AccessTimetableWithDate()],
    inject_date=True
)

informer = Agent(
    config=agents_config["informer"],
    tools=[AccessTimetableWithDate()],
    inject_date=True
)

manager = Agent(
    config=agents_config["manager"]
)


# TASKS

conversion = Task(
    config=tasks_config["conversion"],
    agent=converter,
    output_pydantic=MultipleSlots
)

manage_timetable = Task(
    config=tasks_config["manage_timetable"],
    agent=assistant
)

answer_question = Task(
    config=tasks_config["answer_question"],
    agent=informer
)

# CREW

crew1 = Crew(
    agents=[converter, assistant],
    tasks=[conversion, manage_timetable],
    verbose=True
)

crew2 = Crew(
    agents=[informer],
    tasks=[answer_question],
    verbose=True
)

# FLOW

class MyFlow(Flow):
    @start()
    def analyze_input(self):
        self.total_token_usage = 0
        return self.state['user_input']
    
    @router(analyze_input)
    def route_user_request(self, user_input):
        llm = LLM(model="openai/gpt-4o-mini")
        prompt =  f"""
        Analyze this input and determine which agent should handle it:
        - Return "Timetable Manager" for request asking to add or remove an event, for example:
                - Can you add this event
                - I have this event today
                - Can you remove this event from the timetable
        - Return "Timetable Informer" for questions about the timetable, for example:
                - What events are scheduled on a given date.
                - When a specific event is happening.
                - Which days are free or busy.
        
        Input: {user_input}
        
        Return only the agent name.
        """

        enc = encoding_for_model("gpt-4o-mini")
        num_tokens = len(enc.encode(prompt))

        result = llm.call(prompt).strip()
        
        output_tokens = len(enc.encode(result))
        self.total_token_usage = num_tokens + output_tokens
        
        print(result)

        return "Timetable Manager" if result == "Timetable Manager" else "Timetable Informer"

    @listen("Timetable Manager")
    def call_timetable_manager(self):
        result = crew1.kickoff(inputs={"event": self.state['user_input']})
        self.total_token_usage += result.token_usage.total_tokens
        return result
    
    @listen("Timetable Informer")
    def call_timetable_informer(self):
        result = crew2.kickoff(inputs={"event": self.state['user_input']})
        self.total_token_usage += result.token_usage.total_tokens
        return result
    

# EXECUTION

def execute_request(user_input: str, flow: Flow) -> str:
    result = flow.kickoff(inputs={"user_input": user_input})
    print(result)
    return result.raw