import React, { useEffect, useState } from "react";
import { getWeekNumberByDate } from "../../lib/utils";
import TasksTracker from "../../components/tasks/TasksTracker";
import { getAllTasks, getAllTasksDone } from "../../lib/appwrite";

const Calendar = () => {
  const [tasksToDisplay, setTasksToDisplay] = useState([]);

  useEffect(() => {
    initTasksToDisplay();
  }, []);

  const initTasksToDisplay = async () => {
    try {
      let tasksToDisplayInitializer = [];

      // Get all tasks done
      const taskDoneList = await getAllTasksDone();
      // console.log("initTasksToDisplay() - taskDoneList", taskDoneList);

      if (taskDoneList.length > 0) {
        tasksToDisplayInitializer = extractTasks(taskDoneList);
      }

      // Get all tasks
      const tasks = await getAllTasks();
      // console.log("initTasksToDisplay() - tasks", tasks);

      // Merge tasks that are not already in tasksToDisplayInitializer
      const finalTasksToDisplay = tasks.reduce((acc, task) => {
        const taskExists = tasksToDisplayInitializer.some(
          (t) => t.id === task.$id
        );
        if (!taskExists) {
          acc.push({
            id: task.$id,
            name: task.title,
            completedWeeks: Array(52).fill(""),
          });
        }
        return acc;
      }, tasksToDisplayInitializer);

      setTasksToDisplay(finalTasksToDisplay);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const extractTasks = (taskDoneList) => {
    // Initialize an empty array to hold the updated tasks
    let updatedTasks = [];

    taskDoneList.forEach((taskDone) => {
      const weekNumber = getWeekNumberByDate(new Date(taskDone.doneDate));

      // Check if the task already exists in the updatedTasks array
      const existingTaskIndex = updatedTasks.findIndex(
        (task) => task.id === taskDone?.taskId.$id
      );

      if (existingTaskIndex !== -1) {
        // Task exists, so update the completedWeeks array
        const updatedTask = { ...updatedTasks[existingTaskIndex] };
        updatedTask.completedWeeks[taskDone.weekNumber - 1] = taskDone.userId; // Mark the specific week as completed
        updatedTasks[existingTaskIndex] = updatedTask;
      } else {
        // Task does not exist, so create a new one
        const newTaskToDisplay = {
          id: taskDone?.taskId.$id,
          name: taskDone?.taskId.title,
          completedWeeks: Array(52).fill(""),
        };
        newTaskToDisplay.completedWeeks[taskDone.weekNumber - 1] =
          taskDone.userId; // Mark the specific week as completed
        updatedTasks.push(newTaskToDisplay);
      }
    });

    // Return the updated list of tasks
    return updatedTasks;
  };

  // console.log("tasksToDisplay", tasksToDisplay);

  return <TasksTracker initialTasks={tasksToDisplay} />;
};

export default Calendar;
