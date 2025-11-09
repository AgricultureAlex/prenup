"""
Kanban Board Tracker for Tech Stack Projects
Tracks project setup tasks in a visual kanban format
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional
from enum import Enum


class TaskStatus(Enum):
    """Task status enum"""
    TODO = "📝 To Do"
    IN_PROGRESS = "🔄 In Progress"
    DONE = "✅ Done"
    BLOCKED = "🚫 Blocked"


class KanbanTask:
    """Represents a single task on the kanban board"""
    
    def __init__(self, task_id: str, title: str, description: str, 
                 category: str, status: TaskStatus = TaskStatus.TODO,
                 priority: str = "medium", tools: List[str] = None):
        self.id = task_id
        self.title = title
        self.description = description
        self.category = category
        self.status = status
        self.priority = priority  # high, medium, low
        self.tools = tools or []
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()
        self.notes = []
    
    def update_status(self, new_status: TaskStatus):
        """Update task status"""
        self.status = new_status
        self.updated_at = datetime.now().isoformat()
    
    def add_note(self, note: str):
        """Add a note to the task"""
        self.notes.append({
            "note": note,
            "timestamp": datetime.now().isoformat()
        })
        self.updated_at = datetime.now().isoformat()
    
    def to_dict(self):
        """Convert task to dictionary"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "status": self.status.name,
            "priority": self.priority,
            "tools": self.tools,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "notes": self.notes
        }
    
    @classmethod
    def from_dict(cls, data: dict):
        """Create task from dictionary"""
        task = cls(
            task_id=data["id"],
            title=data["title"],
            description=data["description"],
            category=data["category"],
            status=TaskStatus[data["status"]],
            priority=data.get("priority", "medium"),
            tools=data.get("tools", [])
        )
        task.created_at = data.get("created_at", task.created_at)
        task.updated_at = data.get("updated_at", task.updated_at)
        task.notes = data.get("notes", [])
        return task


class VibeKanban:
    """Kanban board for tracking tech stack implementation"""
    
    def __init__(self, project_name: str, board_file: str = None):
        self.project_name = project_name
        self.board_file = board_file or f"kanban_{project_name.replace(' ', '_').lower()}.json"
        self.tasks: Dict[str, KanbanTask] = {}
        self.load_board()
    
    def load_board(self):
        """Load kanban board from file"""
        if os.path.exists(self.board_file):
            with open(self.board_file, 'r') as f:
                data = json.load(f)
                self.project_name = data.get("project_name", self.project_name)
                for task_data in data.get("tasks", []):
                    task = KanbanTask.from_dict(task_data)
                    self.tasks[task.id] = task
    
    def save_board(self):
        """Save kanban board to file"""
        data = {
            "project_name": self.project_name,
            "last_updated": datetime.now().isoformat(),
            "tasks": [task.to_dict() for task in self.tasks.values()]
        }
        with open(self.board_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def add_task(self, task: KanbanTask):
        """Add a task to the board"""
        self.tasks[task.id] = task
        self.save_board()
    
    def update_task_status(self, task_id: str, new_status: TaskStatus):
        """Update task status"""
        if task_id in self.tasks:
            self.tasks[task_id].update_status(new_status)
            self.save_board()
    
    def add_task_note(self, task_id: str, note: str):
        """Add a note to a task"""
        if task_id in self.tasks:
            self.tasks[task_id].add_note(note)
            self.save_board()
    
    def get_tasks_by_status(self, status: TaskStatus) -> List[KanbanTask]:
        """Get all tasks with a specific status"""
        return [task for task in self.tasks.values() if task.status == status]
    
    def get_tasks_by_category(self, category: str) -> List[KanbanTask]:
        """Get all tasks in a specific category"""
        return [task for task in self.tasks.values() if task.category == category]
    
    def display_board(self):
        """Display the kanban board in terminal"""
        print("\n" + "="*100)
        print(f"📋 KANBAN BOARD: {self.project_name}")
        print("="*100)
        
        # Group tasks by status
        for status in TaskStatus:
            tasks = self.get_tasks_by_status(status)
            
            print(f"\n{status.value} ({len(tasks)} tasks)")
            print("-"*100)
            
            if not tasks:
                print("  (No tasks)")
            else:
                for task in sorted(tasks, key=lambda t: t.priority, reverse=True):
                    priority_icon = "🔴" if task.priority == "high" else "🟡" if task.priority == "medium" else "🟢"
                    print(f"\n  {priority_icon} [{task.id}] {task.title}")
                    print(f"     Category: {task.category}")
                    if task.tools:
                        print(f"     Tools: {', '.join(task.tools)}")
                    print(f"     {task.description}")
                    if task.notes:
                        print(f"     Notes: {len(task.notes)} note(s)")
        
        print("\n" + "="*100)
        
        # Summary
        total = len(self.tasks)
        done = len(self.get_tasks_by_status(TaskStatus.DONE))
        progress = (done / total * 100) if total > 0 else 0
        
        print(f"\n📊 Progress: {done}/{total} tasks completed ({progress:.1f}%)")
        print(f"📁 Board saved to: {self.board_file}\n")
    
    def display_compact(self):
        """Display a compact version of the board"""
        print(f"\n📋 {self.project_name} - Quick View")
        print("-"*80)
        
        for status in TaskStatus:
            tasks = self.get_tasks_by_status(status)
            if tasks:
                print(f"\n{status.value}: {len(tasks)} tasks")
                for task in tasks[:3]:  # Show first 3
                    priority_icon = "🔴" if task.priority == "high" else "🟡" if task.priority == "medium" else "🟢"
                    print(f"  {priority_icon} {task.title}")
                if len(tasks) > 3:
                    print(f"  ... and {len(tasks) - 3} more")
    
    def export_markdown(self, filename: str = None):
        """Export kanban board to markdown"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"kanban_{self.project_name.replace(' ', '_')}_{timestamp}.md"
        
        with open(filename, 'w') as f:
            f.write(f"# 📋 {self.project_name} - Kanban Board\n\n")
            f.write(f"Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            # Progress bar
            total = len(self.tasks)
            done = len(self.get_tasks_by_status(TaskStatus.DONE))
            progress = (done / total * 100) if total > 0 else 0
            
            f.write(f"## Progress: {done}/{total} tasks completed ({progress:.1f}%)\n\n")
            f.write("---\n\n")
            
            # Tasks by status
            for status in TaskStatus:
                tasks = self.get_tasks_by_status(status)
                f.write(f"## {status.value} ({len(tasks)} tasks)\n\n")
                
                if not tasks:
                    f.write("*(No tasks)*\n\n")
                else:
                    for task in sorted(tasks, key=lambda t: t.priority, reverse=True):
                        priority_icon = "🔴" if task.priority == "high" else "🟡" if task.priority == "medium" else "🟢"
                        f.write(f"### {priority_icon} {task.title}\n\n")
                        f.write(f"**ID:** `{task.id}`  \n")
                        f.write(f"**Category:** {task.category}  \n")
                        f.write(f"**Priority:** {task.priority.title()}  \n")
                        
                        if task.tools:
                            f.write(f"**Tools:** {', '.join(task.tools)}  \n")
                        
                        f.write(f"\n{task.description}\n\n")
                        
                        if task.notes:
                            f.write(f"**Notes:**\n")
                            for note in task.notes:
                                f.write(f"- {note['note']} *({note['timestamp']})*\n")
                            f.write("\n")
                        
                        f.write("---\n\n")
        
        print(f"✅ Kanban board exported to markdown: {filename}")
        return filename
    
    def create_tasks_from_recommendations(self, recommendations: Dict, analysis: Dict):
        """Automatically create tasks from tech stack recommendations"""
        task_counter = 1
        
        # Create tasks for essential items
        for rec in recommendations.get('essential', []):
            task_id = f"T{task_counter:03d}"
            task = KanbanTask(
                task_id=task_id,
                title=f"Setup {rec['subcategory']}",
                description=f"{rec['reason']}. Implement: {', '.join(rec['tools'])}",
                category=rec['category'],
                status=TaskStatus.TODO,
                priority="high",
                tools=rec['tools']
            )
            self.add_task(task)
            task_counter += 1
        
        # Create tasks for recommended items
        for rec in recommendations.get('recommended', []):
            task_id = f"T{task_counter:03d}"
            task = KanbanTask(
                task_id=task_id,
                title=f"Setup {rec['subcategory']}",
                description=f"{rec['reason']}. Implement: {', '.join(rec['tools'])}",
                category=rec['category'],
                status=TaskStatus.TODO,
                priority="medium",
                tools=rec['tools']
            )
            self.add_task(task)
            task_counter += 1
        
        # Create tasks for features
        for feature in analysis.get('features', []):
            task_id = f"T{task_counter:03d}"
            task = KanbanTask(
                task_id=task_id,
                title=f"Implement {feature}",
                description=f"Build and integrate {feature} functionality",
                category="Features",
                status=TaskStatus.TODO,
                priority="medium",
                tools=[]
            )
            self.add_task(task)
            task_counter += 1
        
        # Create testing task
        task_id = f"T{task_counter:03d}"
        task = KanbanTask(
            task_id=task_id,
            title="Setup Testing Framework",
            description="Implement unit tests, integration tests, and E2E testing",
            category="Testing & QA",
            status=TaskStatus.TODO,
            priority="high",
            tools=[]
        )
        self.add_task(task)
        task_counter += 1
        
        # Create deployment task
        task_id = f"T{task_counter:03d}"
        task = KanbanTask(
            task_id=task_id,
            title="Deploy to Production",
            description=f"Deploy application to {', '.join(analysis.get('platforms', ['web']))} platform(s)",
            category="Deployment",
            status=TaskStatus.TODO,
            priority="high",
            tools=[]
        )
        self.add_task(task)
        
        print(f"✅ Created {task_counter} tasks from recommendations")


def create_kanban_from_agent(agent, board_file: str = None):
    """Helper function to create a kanban board from TechStackAgent"""
    kanban = VibeKanban(agent.user_idea, board_file)
    kanban.create_tasks_from_recommendations(agent.recommendations, agent.analysis)
    return kanban


def interactive_kanban_manager(kanban: VibeKanban):
    """Interactive CLI for managing the kanban board"""
    while True:
        print("\n" + "="*80)
        print("🎯 KANBAN BOARD MANAGER")
        print("="*80)
        print("\n1. View Full Board")
        print("2. View Compact Board")
        print("3. Update Task Status")
        print("4. Add Note to Task")
        print("5. Export to Markdown")
        print("6. Exit")
        
        choice = input("\nSelect an option (1-6): ").strip()
        
        if choice == "1":
            kanban.display_board()
        elif choice == "2":
            kanban.display_compact()
        elif choice == "3":
            task_id = input("Enter task ID: ").strip().upper()
            if task_id in kanban.tasks:
                print("\nSelect new status:")
                for i, status in enumerate(TaskStatus, 1):
                    print(f"{i}. {status.value}")
                status_choice = input("\nStatus (1-4): ").strip()
                
                status_map = {
                    "1": TaskStatus.TODO,
                    "2": TaskStatus.IN_PROGRESS,
                    "3": TaskStatus.DONE,
                    "4": TaskStatus.BLOCKED
                }
                
                if status_choice in status_map:
                    kanban.update_task_status(task_id, status_map[status_choice])
                    print(f"✅ Task {task_id} updated!")
                else:
                    print("❌ Invalid status choice")
            else:
                print(f"❌ Task {task_id} not found")
        elif choice == "4":
            task_id = input("Enter task ID: ").strip().upper()
            if task_id in kanban.tasks:
                note = input("Enter note: ").strip()
                if note:
                    kanban.add_task_note(task_id, note)
                    print(f"✅ Note added to task {task_id}")
            else:
                print(f"❌ Task {task_id} not found")
        elif choice == "5":
            filename = kanban.export_markdown()
            print(f"✅ Exported to {filename}")
        elif choice == "6":
            print("\n👋 Goodbye!\n")
            break
        else:
            print("❌ Invalid choice. Please select 1-6.")


if __name__ == "__main__":
    # Example usage
    print("This is the Kanban Tracker module.")
    print("Import it in your main agent file to track project tasks.")
    python3 -m bot.code_tutor

