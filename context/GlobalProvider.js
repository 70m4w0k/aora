import React, { createContext, useContext, useEffect, useState } from "react";

import { getCurrentUser, getHousehold, getHouseholdMembers } from "../lib/appwrite";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);
  const [householdMembers, setHouseholdMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user has a household
  const hasHousehold = user?.householdId ? true : false;

  // Fetch household data when user has a householdId
  const fetchHouseholdData = async (householdId) => {
    try {
      const householdData = await getHousehold(householdId);
      setHousehold(householdData);
      
      if (householdData) {
        const members = await getHouseholdMembers(householdId);
        setHouseholdMembers(members);
      }
    } catch (error) {
      console.error("Error fetching household data:", error);
      setHousehold(null);
      setHouseholdMembers([]);
    }
  };

  // Refresh household data (call after creating/joining household)
  const refreshHousehold = async () => {
    if (user?.householdId) {
      await fetchHouseholdData(user.householdId);
    } else {
      setHousehold(null);
      setHouseholdMembers([]);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
        if (userData.householdId) {
          await fetchHouseholdData(userData.householdId);
        } else {
          setHousehold(null);
          setHouseholdMembers([]);
        }
        return userData; // Return updated user data
      }
      return null;
    } catch (error) {
      console.error("Error refreshing user:", error);
      return null;
    }
  };

  // Initial load
  useEffect(() => {
    getCurrentUser()
      .then(async (res) => {
        if (res) {
          setIsLogged(true);
          setUser(res);
          
          // If user has a household, fetch household data
          if (res.householdId) {
            await fetchHouseholdData(res.householdId);
          }
        } else {
          setIsLogged(false);
          setUser(null);
          setHousehold(null);
          setHouseholdMembers([]);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Watch for householdId changes and fetch household data
  useEffect(() => {
    if (user?.householdId) {
      fetchHouseholdData(user.householdId);
    } else if (user && !user.householdId) {
      // User exists but has no household - clear household data
      setHousehold(null);
      setHouseholdMembers([]);
    }
  }, [user?.householdId]);

  return (
    <GlobalContext.Provider
      value={{
        isLogged,
        setIsLogged,
        user,
        setUser,
        household,
        setHousehold,
        householdMembers,
        setHouseholdMembers,
        hasHousehold,
        refreshHousehold,
        refreshUser,
        loading,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
