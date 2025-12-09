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
  // Handle both relationship objects and string IDs
  const getHouseholdId = (userData) => {
    if (!userData?.householdId) return null;
    return typeof userData.householdId === 'object' 
      ? (userData.householdId.$id || userData.householdId)
      : userData.householdId;
  };
  
  const hasHousehold = getHouseholdId(user) !== null;

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
    const householdIdValue = getHouseholdId(user);
    if (householdIdValue) {
      await fetchHouseholdData(householdIdValue);
    } else {
      setHousehold(null);
      setHouseholdMembers([]);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      console.log("refreshUser() - Starting user refresh...");
      const userData = await getCurrentUser();
      
      if (userData) {
        console.log("refreshUser() - User data received:", {
          id: userData.$id,
          email: userData.email,
          householdId: userData.householdId,
        });
        
        setUser(userData);
        
        // Handle householdId - could be a relationship object or string ID
        const householdIdValue = userData.householdId 
          ? (typeof userData.householdId === 'object' ? userData.householdId.$id : userData.householdId)
          : null;
        
        if (householdIdValue) {
          console.log("refreshUser() - Fetching household data for:", householdIdValue);
          await fetchHouseholdData(householdIdValue);
        } else {
          console.log("refreshUser() - No household ID, clearing household data");
          setHousehold(null);
          setHouseholdMembers([]);
        }
        return userData; // Return updated user data
      } else {
        console.log("refreshUser() - No user data found");
        setUser(null);
        setHousehold(null);
        setHouseholdMembers([]);
      }
      return null;
    } catch (error) {
      console.error("Error refreshing user:", error);
      console.error("Error stack:", error.stack);
      setUser(null);
      setHousehold(null);
      setHouseholdMembers([]);
      return null;
    }
  };

  // Initial load
  useEffect(() => {
    console.log("GlobalProvider - Initial load starting...");
    getCurrentUser()
      .then(async (res) => {
        console.log("GlobalProvider - getCurrentUser result:", res ? "User found" : "No user");
        if (res) {
          setIsLogged(true);
          setUser(res);
          
          // Handle householdId - could be a relationship object or string ID
          const householdIdValue = res.householdId 
            ? (typeof res.householdId === 'object' ? res.householdId.$id : res.householdId)
            : null;
          
          // If user has a household, fetch household data
          if (householdIdValue) {
            console.log("GlobalProvider - Fetching household data for:", householdIdValue);
            await fetchHouseholdData(householdIdValue);
          } else {
            console.log("GlobalProvider - No household ID");
            setHousehold(null);
            setHouseholdMembers([]);
          }
        } else {
          console.log("GlobalProvider - No user, setting logged out");
          setIsLogged(false);
          setUser(null);
          setHousehold(null);
          setHouseholdMembers([]);
        }
      })
      .catch((error) => {
        // Handle "guests" role error gracefully - this is expected when not authenticated
        if (error.message && error.message.includes('missing scopes')) {
          console.log("GlobalProvider - User not authenticated (guests role) - this is normal");
          setIsLogged(false);
          setUser(null);
          setHousehold(null);
          setHouseholdMembers([]);
        } else {
          console.error("GlobalProvider - Error in initial load:", error);
          console.error("Error stack:", error.stack);
          setIsLogged(false);
          setUser(null);
          setHousehold(null);
          setHouseholdMembers([]);
        }
      })
      .finally(() => {
        console.log("GlobalProvider - Initial load complete, setting loading to false");
        setLoading(false);
      });
  }, []);

  // Watch for householdId changes and fetch household data
  useEffect(() => {
    if (user?.householdId) {
      // Handle householdId - could be a relationship object or string ID
      const householdIdValue = typeof user.householdId === 'object' 
        ? user.householdId.$id 
        : user.householdId;
      
      if (householdIdValue) {
        console.log("GlobalProvider - householdId changed, fetching data for:", householdIdValue);
        fetchHouseholdData(householdIdValue);
      }
    } else if (user && !user.householdId) {
      // User exists but has no household - clear household data
      console.log("GlobalProvider - User has no household, clearing data");
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
        setLoading,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
