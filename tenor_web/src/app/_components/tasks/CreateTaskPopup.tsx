"use client";

import React, { useState } from "react";
import InputTextField from "../inputs/InputTextField";
import InputTextAreaField from "../inputs/InputTextAreaField";
import { DatePicker } from "../DatePicker";
import { type Option, EditableBox }  from "../EditableBox/EditableBox";
import PrimaryButton from "../buttons/PrimaryButton";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import PillComponent from "../PillComponent";
import { SizePillComponent } from "../specific-pickers/SizePillComponent";

export function CreateTaskForm({}) {
  const { user } = useFirebaseAuth();
  
  const [taskForm, setTaskForm] = useState({
    name: "",
    description: "",
  });
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [assignedTo, setAssignedTo] = useState<Option | null>(null);
  
  const statusOptions = [
    { name: "Todo", color: "#6B7280", deleted: false },
    { name: "In Progress", color: "#3B82F6", deleted: false },
    { name: "Review", color: "#F59E0B", deleted: false },
    { name: "Done", color: "#10B981", deleted: false },
  ];
  
  const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);
  const [selectedSize, setSelectedSize] = useState(); 

  // UTILIZAR SIZEPILL COMPONENT
  
  const peopleOptions = [
    { id: user?.uid ?? "", name: user?.displayName ?? "", user },
  ];
  
  /* 
    for backend stuff later
    const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!taskForm.name) return;
    
    // Crear objeto con todos los datos de la tarea
    const taskData = {
      name: taskForm.name,
      description: taskForm.description,
      dueDate: selectedDate,
      assigneeId: assignedTo?.id,
      status: selectedStatus.name,
      size: selectedSize.name
    };
    
    console.log("Task data to submit:", taskData);
    
    // await createTask({...})
    
    if (onTaskAdded) onTaskAdded();
  };
  */
  
  return (
    <div className="p-2 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">Add New Task</h2>
      <div className="flex flex-col gap-2">
        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium">Task Name</label>
          <InputTextField
            value={taskForm.name}
            onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
            placeholder="Enter task name..."
            required
            className="w-full"
          />
        </div>
        
        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <InputTextAreaField
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            placeholder="Task description"
            className="h-24 min-h-24 w-full"
          />
        </div>
        
        <div className="flex gap-3 mb-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Status</label>
            <PillComponent
              currentTag={selectedStatus}
              allTags={statusOptions}
              callBack={setSelectedStatus}
              labelClassName="w-full"
            />
          </div>
          
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Size</label>
            {/* <PillComponent
              currentTag={selectedSize}
              allTags={sizeOptions}
              callBack={setSelectedSize}
              labelClassName="w-full"
            />
            */}
          </div>
        </div>
        
        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium">Assigned to</label>
          <EditableBox
            options={peopleOptions}
            selectedOption={assignedTo}
            onChange={(person) => {
              // Evitar el comportamiento por defecto
              setAssignedTo(person);
            }}
            placeholder="Select a person"
            className="w-full"
          />
        </div>
        
        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium">Due Date</label>
          <DatePicker
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            placeholder="Select a due date"
            className="w-full"
          />
        </div>
        
        <div className="mt-4 flex justify-end">
          <PrimaryButton type="submit" className="px-6 py-2">
            Create Task
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

