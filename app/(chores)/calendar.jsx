import React, { useEffect, useState } from "react";
import TasksTracker from "../../components/TasksTracker";

import { getAllChoreImpl } from "../../lib/appwrite";
import { getWeekNumberByDate } from "../../lib/utils";

const calendar = () => {
  const [chores, setChores] = useState([]);
  const [tasks, setTasks] = useState([
    {
      id: "1",
      name: "Nettoyer les toilettes",
      completedWeeks: Array(52).fill(""), // Initialize all weeks as not completed
    },
    {
      id: "2",
      name: "Mow lawn",
      completedWeeks: Array(52).fill(""),
    },
  ]);

  useEffect(() => {
    fetchChores();
  }, []);

  const updateTask = (chore, weekNumber) => {
    const id = chore.choreId.$id;
    setTasks((prevTasks) => {
      // Check if the task with the given id already exists
      const existingTaskIndex = prevTasks.findIndex((task) => task.id === id);

      if (existingTaskIndex !== -1) {
        // Task exists, so update the completedWeeks array
        const updatedTasks = [...prevTasks];
        const updatedTask = { ...updatedTasks[existingTaskIndex] };
        updatedTask.completedWeeks[weekNumber - 1] = chore.authorId; // Mark the specific week as completed

        // Replace the old task with the updated one
        updatedTasks[existingTaskIndex] = updatedTask;
        return updatedTasks;
      } else {
        // Task does not exist, so create a new one
        const newTask = {
          id: id,
          name: chore.choreId.title, // You can replace this with an actual name
          completedWeeks: Array(52).fill(""),
        };
        newTask.completedWeeks[weekNumber - 1] = chore.authorId; // Mark the specific week as completed

        // Add the new task to the tasks array
        return [...prevTasks, newTask];
      }
    });
  };

  const choresToTasks = (choresList) => {
    choresList.forEach((chore) => {
      const weekNumber = getWeekNumberByDate(new Date(chore.$createdAt));
      updateTask(chore, weekNumber);
    });
  };

  const fetchChores = async () => {
    try {
      const choresList = await getAllChoreImpl(); // Fetch chores from Appwrite
      setChores(choresList); // Assuming `documents` is where the list resides
      choresToTasks(choresList);
    } catch (error) {
      console.error("Error fetching chores:", error);
    }
  };

  return <TasksTracker initialTasks={tasks} />;
};
export default calendar;
