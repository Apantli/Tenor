"use client";

import { useState, useEffect } from 'react';
import { getFirestore } from 'firebase/firestore';
import { getTasks } from '~/utils/helpers/shortcuts/tasks';
import { Firestore } from 'firebase-admin/firestore';
import { getStatusType } from '~/utils/helpers/shortcuts/tags';
import { api } from '~/trpc/react';
import ProgressBar from './ProgressBar';

function ProgressStatusBar({projectId}: {projectId: string}) {

  const [completedCount, setCompletedCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  const {data: tasks, isLoading} = api.tasks.getTasks.useQuery({ projectId });
  const getStatus = api.settings.getStatusType.useQuery;

  //1. Need to call all the tasks from the project
  //2. Then filter the tasks by their status, if the task is deleted, then ignore it
  //3. Then filter the tasks by their status, if the task is completed, make a counter
  //4. Then take the counter and divide it by the total number of tasks
  //5. Then multiply it by 100 to get the percentage
  //6. Then set the progress to the percentage

  useEffect(() => {
    const calculateProgress = async () => {
      if (!tasks) return;
      
      // Ignore deleted tasks
      const activeTasks = (tasks).filter((task) => task.deleted !== false);
      // Create a local cache to avoid multiple calls to the database
      const statusCache: Record<string, boolean> = {};

      let completedCount = 0;

      for (const task of activeTasks) {
        const statusId = task.statusId;
        console.log(`Task ID: ${task.id}, Status ID: ${statusId}`);

        if(!(statusId in statusCache)) {
          try {
            const { data: statusDoc } = await getStatus({ projectId, statusId });
            statusCache[statusId] = statusDoc?.marksTaskAsDone ?? false; // Default to false if not found
            console.log(`Status ID: ${statusId}, Marks Task As Done: ${statusCache[statusId]}`);
          } catch (error) {
            console.warn(`Error fetching status type for ID ${statusId}:`, error);
            statusCache[statusId] = false; // Default to false if there's an error
          }
        }

        if (statusCache[statusId]) {
          completedCount++;
        }

        setCompletedCount(completedCount);
        setTaskCount(activeTasks.length);
    };
  }
    calculateProgress();
  }, [tasks, projectId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <ProjectStatus
      taskCount={taskCount}
      completedCount={completedCount}
    />
  )
}

function ProjectStatus({ 
  taskCount,
  completedCount,
 }: { 
  taskCount: number,
  completedCount: number,
}) {

  const displayValue = `${completedCount} of ${taskCount} tasks`;
  const progressBarColor = '#13918A';
  const emptyBarColor = '#D4DDE4';

  return (
    // contianer of the project status
    <>
      <ProgressBar
        min={0}
        max={taskCount}
        value={completedCount}
        progressBarColor={progressBarColor}
        emptyBarColor={emptyBarColor}
        displayValue={displayValue}
      />
    </>
  )
}

export default ProgressStatusBar;