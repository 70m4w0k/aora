import { useState } from 'react';
import { useHabitsContext } from '../context/HabitsContext';
import { handleCompleteQuest as handleCompleteQuestUtil, handleCompleteTier as handleCompleteTierUtil } from '../handlers';
import { overridePenalty, updateProgressionType, togglePenaltySystem, getXpHistory } from '../../../../lib/appwrite';
import { useGlobalContext } from '../../../../context/GlobalProvider';

/**
 * Custom hook for managing all modals and handlers in habits tracker
 */
export function useHabitsModals() {
  const {
    arcs,
    quests,
    tiers,
    userProgress,
    user,
    household,
    fetchData,
    setXpNotification,
    setUnlockedTitles,
    setUnlockedAchievements,
    setUserProgress,
    setTierProgress,
    setQuestStreaks,
    setTodayQuests,
  } = useHabitsContext();

  const { user: globalUser } = useGlobalContext();

  // Modal visibility states
  const [questModalVisible, setQuestModalVisible] = useState(false);
  const [arcModalVisible, setArcModalVisible] = useState(false);
  const [tierModalVisible, setTierModalVisible] = useState(false);
  const [arcDetailModalVisible, setArcDetailModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
  const [titleUnlockModalVisible, setTitleUnlockModalVisible] = useState(false);
  const [missedQuestsModalVisible, setMissedQuestsModalVisible] = useState(false);
  const [xpHistoryModalVisible, setXpHistoryModalVisible] = useState(false);
  const [streakStatsModalVisible, setStreakStatsModalVisible] = useState(false);
  const [streakCalendarModalVisible, setStreakCalendarModalVisible] = useState(false);
  const [titlesAchievementsModalVisible, setTitlesAchievementsModalVisible] = useState(false);

  // Modal data states
  const [xpNotification, setXpNotificationState] = useState(null);
  const [alertData, setAlertData] = useState({ title: '', message: '', buttons: [] });
  const [levelUpData, setLevelUpData] = useState({ type: null, level: null, xpEarned: null, arc: null });
  const [newlyUnlockedTitle, setNewlyUnlockedTitle] = useState(null);
  const [editingQuest, setEditingQuest] = useState(null);
  const [editingArc, setEditingArc] = useState(null);
  const [editingTier, setEditingTier] = useState(null);

  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => {} }]) => {
    setAlertData({ title, message, buttons });
    setAlertModalVisible(true);
  };

  const showLevelUp = (type, level, xpEarned, arc = null) => {
    setLevelUpData({ type, level, xpEarned, arc });
    setLevelUpModalVisible(true);
  };

  const showTitleUnlock = (titleOrAchievement) => {
    setNewlyUnlockedTitle(titleOrAchievement);
    setTitleUnlockModalVisible(true);
  };

  const showXPNotification = (xp, arcColor = null) => {
    setXpNotificationState({ xp, arcColor });
    if (setXpNotification) {
      setXpNotification({ xp, arcColor });
    }
  };

  const openQuestModal = (quest = null) => {
    setEditingQuest(quest);
    setQuestModalVisible(true);
  };

  const openArcModal = (arc = null) => {
    setEditingArc(arc);
    setArcModalVisible(true);
  };

  const openTierModal = (tier = null) => {
    setEditingTier(tier);
    setTierModalVisible(true);
  };

  const handleCompleteQuest = async (quest) => {
    // This will be implemented with the full handler logic
    // For now, placeholder
    await handleCompleteQuestUtil({
      quest,
      user: globalUser || user,
      household,
      arcs,
      quests,
      tiers,
      // ... other required params
      showXPNotification,
      showTitleUnlock,
      showLevelUp,
      showAlert,
      fetchData,
    });
  };

  const handleDeleteQuest = (quest) => {
    showAlert(
      'Delete Quest',
      `Are you sure you want to delete "${quest.name}"?`,
      [
        { text: 'Cancel', onPress: () => setAlertModalVisible(false) },
        {
          text: 'Delete',
          onPress: async () => {
            setAlertModalVisible(false);
            // Delete logic here
            await fetchData();
          },
        },
      ]
    );
  };

  return {
    modals: {
      questModalVisible,
      arcModalVisible,
      tierModalVisible,
      arcDetailModalVisible,
      settingsModalVisible,
      alertModalVisible,
      levelUpModalVisible,
      titleUnlockModalVisible,
      missedQuestsModalVisible,
      xpHistoryModalVisible,
      streakStatsModalVisible,
      streakCalendarModalVisible,
      titlesAchievementsModalVisible,
      xpNotification,
      alertData,
      levelUpData,
      newlyUnlockedTitle,
      editingQuest,
      editingArc,
      editingTier,
      renderModals: () => null, // Will be implemented with actual modal components
    },
    handlers: {
      openQuestModal,
      openArcModal,
      openTierModal,
      openSettingsModal: () => setSettingsModalVisible(true),
      openTitlesModal: () => setTitlesAchievementsModalVisible(true),
      openXpHistoryModal: () => setXpHistoryModalVisible(true),
      openMissedQuestsModal: () => setMissedQuestsModalVisible(true),
      handleCompleteQuest,
      handleDeleteQuest,
      showAlert,
      setAlertModalVisible,
      overridePenalty: async (userId, householdId, questId, arcId) => {
        return await overridePenalty(userId, householdId, questId, arcId);
      },
      setXpNotification: setXpNotificationState,
    },
  };
}

