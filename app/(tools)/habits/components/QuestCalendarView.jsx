import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../constants';
import { getQuestCompletions } from '../../../../lib/appwrite';
import { createGlow } from '../utils/visualEffects';
import QuestCalendarDetailsModal from './QuestCalendarDetailsModal';

/**
 * Quest Calendar View Component
 * Shows quest completions per day with visual dots/pins
 */
export default function QuestCalendarView({ quests, arcs, userId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [completionData, setCompletionData] = useState({}); // { dateKey: [questIds] }
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateDetails, setSelectedDateDetails] = useState([]);
  const [filteredQuestIds, setFilteredQuestIds] = useState([]); // Empty = show all
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverQuest, setPopoverQuest] = useState(null);
  const [popoverArc, setPopoverArc] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const popoverAnim = useRef(new Animated.Value(0)).current;
  const questRefs = useRef({});
  const [expandedArcs, setExpandedArcs] = useState({}); // { arcId: true/false }

  useEffect(() => {
    if (quests.length > 0 && userId) {
      loadCompletionData();
    } else {
      setLoading(false);
    }
  }, [quests, userId, currentMonth]);

  const loadCompletionData = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      
      const data = {};
      
      // Get completions for all quests in parallel
      const completionsPromises = quests.map(async (quest) => {
        try {
          const completions = await getQuestCompletions(
            quest.$id,
            userId,
            startDate.toISOString(),
            endDate.toISOString()
          );
          return { questId: quest.$id, completions };
        } catch (error) {
          console.error(`Error loading completions for quest ${quest.$id}:`, error);
          return { questId: quest.$id, completions: [] };
        }
      });
      
      const completionsResults = await Promise.all(completionsPromises);
      
      // Process completions and group by date
      completionsResults.forEach(({ questId, completions }) => {
        completions.forEach((completion) => {
          const completionDate = new Date(completion.completedAt || completion.$createdAt);
          const dateKey = `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}-${String(completionDate.getDate()).padStart(2, '0')}`;
          
          if (!data[dateKey]) {
            data[dateKey] = [];
          }
          
          // Add quest ID if not already present (avoid duplicates)
          if (!data[dateKey].includes(questId)) {
            data[dateKey].push(questId);
          }
        });
      });
      
      setCompletionData(data);
    } catch (error) {
      console.error('Error loading completion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayCompletionDots = (dateKey) => {
    let questIds = completionData[dateKey] || [];
    
    // Filter by selected quests if any are selected
    if (filteredQuestIds.length > 0) {
      questIds = questIds.filter(id => filteredQuestIds.includes(id));
    }
    
    return questIds.slice(0, 4); // Show up to 4 dots
  };

  const getDayCompletionCount = (dateKey) => {
    let questIds = completionData[dateKey] || [];
    
    // Filter by selected quests if any are selected
    if (filteredQuestIds.length > 0) {
      questIds = questIds.filter(id => filteredQuestIds.includes(id));
    }
    
    return questIds.length;
  };

  const toggleQuestFilter = (questId) => {
    setFilteredQuestIds(prev => {
      if (prev.includes(questId)) {
        return prev.filter(id => id !== questId);
      } else {
        return [...prev, questId];
      }
    });
  };

  const handleQuestLongPress = (quest, arc, event) => {
    const { pageX, pageY } = event.nativeEvent;
    setPopoverQuest(quest);
    setPopoverArc(arc);
    setPopoverPosition({ x: pageX, y: pageY });
    setPopoverVisible(true);
    
    Animated.spring(popoverAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const toggleArcSection = (arcId) => {
    setExpandedArcs(prev => ({
      ...prev,
      [arcId]: !prev[arcId],
    }));
  };

  // Group quests by arc
  const getQuestsByArc = () => {
    const grouped = {};
    
    quests.forEach((quest) => {
      const arcId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
      const arc = arcs.find(a => a.$id === arcId);
      const arcKey = arcId || 'unassigned';
      
      if (!grouped[arcKey]) {
        grouped[arcKey] = {
          arc: arc || { name: 'Unassigned', color: COLORS.accent.primary, $id: 'unassigned' },
          quests: [],
        };
      }
      
      const hasCompletions = Object.values(completionData).some(questIds => questIds.includes(quest.$id));
      if (hasCompletions || filteredQuestIds.length > 0) {
        grouped[arcKey].quests.push(quest);
      }
    });
    
    return grouped;
  };

  const closePopover = () => {
    Animated.timing(popoverAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setPopoverVisible(false);
      setPopoverQuest(null);
      setPopoverArc(null);
    });
  };

  const getQuestArcColor = (questId) => {
    const quest = quests.find(q => q.$id === questId);
    if (!quest) return COLORS.accent.primary;
    
    const arcId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
    const arc = arcs.find(a => a.$id === arcId);
    return arc?.color || COLORS.accent.primary;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const questIds = completionData[dateKey] || [];
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push({
        day,
        date,
        dateKey,
        questIds,
        isToday,
      });
    }
    
    return (
      <View style={styles.calendarGrid}>
        {/* Day labels */}
        <View style={styles.weekRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <View key={day} style={styles.dayLabel}>
              <Text style={styles.dayLabelText}>{day}</Text>
            </View>
          ))}
        </View>
        
        {/* Calendar days */}
        <View style={styles.days}>
          {days.map((dayData, index) => {
            if (dayData === null) {
              return <View key={`empty-${index}`} style={styles.dayEmpty} />;
            }
            
            const { day, dateKey, questIds, isToday } = dayData;
            const completionDots = getDayCompletionDots(dateKey);
            const completionCount = getDayCompletionCount(dateKey);
            const hasMoreThan4 = completionCount > 4;
            
            // Calculate if this is the last item in a row (every 7th item)
            const dayOfWeek = index % 7;
            const isLastInRow = dayOfWeek === 6;
            
            return (
              <TouchableOpacity
                key={dateKey}
                style={[
                  styles.day,
                  isToday && styles.dayToday,
                  !isLastInRow && styles.dayWithMargin,
                ]}
                onPress={() => {
                  let displayQuestIds = questIds;
                  
                  // Filter by selected quests if any are selected
                  if (filteredQuestIds.length > 0) {
                    displayQuestIds = questIds.filter(id => filteredQuestIds.includes(id));
                  }
                  
                  if (displayQuestIds.length > 0) {
                    const questDetails = displayQuestIds.map((questId) => {
                      const quest = quests.find(q => q.$id === questId);
                      const arcId = quest ? (typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId) : null;
                      const arc = arcId ? arcs.find(a => a.$id === arcId) : null;
                      return { quest, arc };
                    }).filter(item => item.quest);
                    
                    setSelectedDateDetails(questDetails);
                    setSelectedDate(dateKey);
                  }
                }}
              >
                <Text style={[
                  styles.dayText,
                  completionCount > 0 && styles.dayTextActive,
                  isToday && styles.dayTextToday,
                ]}>
                  {day}
                </Text>
                
                {/* Quest completion dots */}
                {completionCount > 0 && (
                  <View style={styles.dotsContainer}>
                    {completionDots.map((questId, dotIndex) => (
                      <View
                        key={`${questId}-${dotIndex}`}
                        style={[
                          styles.dot,
                          { backgroundColor: getQuestArcColor(questId) },
                        ]}
                      />
                    ))}
                    {hasMoreThan4 && (
                      <Text style={styles.moreDotsText}>+{completionCount - 4}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={COLORS.accent.primary} />
        <Text style={styles.loadingText}>Loading quest data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday} style={styles.monthButton}>
          <Text style={styles.monthText}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      {renderCalendar()}

      {/* Quest Filter Legend */}
      <View style={styles.filterLegend}>
        <View style={styles.filterLegendHeader}>
          <Text style={styles.filterLegendTitle}>Filter by Quest</Text>
          {filteredQuestIds.length > 0 && (
            <TouchableOpacity
              onPress={() => setFilteredQuestIds([])}
              style={styles.clearFilterButton}
            >
              <Text style={styles.clearFilterText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.arcsContainer}>
          {Object.entries(getQuestsByArc()).map(([arcKey, { arc, quests: arcQuests }]) => {
            if (arcQuests.length === 0) return null;
            
            const isExpanded = expandedArcs[arc.$id] !== false; // Default to expanded
            const arcColor = arc.color || COLORS.accent.primary;
            const selectedCount = arcQuests.filter(q => filteredQuestIds.includes(q.$id)).length;
            
            return (
              <View key={arcKey} style={styles.arcSection}>
                {/* Arc Header */}
                <TouchableOpacity
                  style={[styles.arcHeader, { borderLeftColor: arcColor }]}
                  onPress={() => toggleArcSection(arc.$id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.arcHeaderLeft}>
                    {arc.icon ? (
                      <Ionicons name={arc.icon} size={18} color={arcColor} />
                    ) : (
                      <View style={[styles.arcIconPlaceholder, { backgroundColor: `${arcColor}20` }]}>
                        <Text style={[styles.arcIconText, { color: arcColor }]}>
                          {arc.name?.[0]?.toUpperCase() || 'A'}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.arcHeaderTitle}>{arc.name}</Text>
                    {selectedCount > 0 && (
                      <View style={[styles.arcSelectedBadge, { backgroundColor: `${arcColor}20` }]}>
                        <Text style={[styles.arcSelectedText, { color: arcColor }]}>
                          {selectedCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
                
                {/* Arc Quests */}
                {isExpanded && (
                  <View style={styles.arcQuestsContainer}>
                    {arcQuests.map((quest) => {
                      const isSelected = filteredQuestIds.includes(quest.$id);
                      
                      return (
                        <TouchableOpacity
                          key={quest.$id}
                          ref={(ref) => (questRefs.current[quest.$id] = ref)}
                          style={[
                            styles.questFilterItem,
                            isSelected && styles.questFilterItemSelected,
                            { borderColor: arcColor },
                          ]}
                          onPress={() => {
                            closePopover();
                            toggleQuestFilter(quest.$id);
                          }}
                          onLongPress={(e) => handleQuestLongPress(quest, arc, e)}
                          delayLongPress={300}
                        >
                          <View style={[styles.questFilterDot, { backgroundColor: arcColor }]} />
                          <Text 
                            style={[
                              styles.questFilterText,
                              isSelected && styles.questFilterTextSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {quest.name}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color={arcColor} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
        
        <Text style={styles.filterLegendHint}>
          {filteredQuestIds.length === 0 
            ? 'Tap quests to filter calendar by specific quests'
            : `${filteredQuestIds.length} quest${filteredQuestIds.length > 1 ? 's' : ''} selected`
          }
        </Text>
      </View>

      {/* Details Modal */}
      <QuestCalendarDetailsModal
        visible={selectedDate !== null}
        onClose={() => {
          setSelectedDate(null);
          setSelectedDateDetails([]);
        }}
        date={selectedDate}
        questDetails={selectedDateDetails}
      />

      {/* Quest Name Popover */}
      <Modal
        visible={popoverVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closePopover}
      >
        <TouchableOpacity
          style={styles.popoverOverlay}
          activeOpacity={1}
          onPress={closePopover}
        >
          <Animated.View
            style={[
              styles.popover,
              {
                top: popoverPosition.y - 50,
                left: Math.max(10, Math.min(popoverPosition.x - 100, Dimensions.get('window').width - 210)),
                opacity: popoverAnim,
                borderColor: popoverArc?.color || COLORS.accent.primary,
                ...createGlow(popoverArc?.color || COLORS.glows.primary, 0.4),
                transform: [
                  {
                    scale: popoverAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <LinearGradient
              colors={popoverArc?.color 
                ? [popoverArc.color, `${popoverArc.color}CC`]
                : COLORS.gradients.xp
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.popoverBorder}
            />
            <View style={styles.popoverContent}>
              {popoverQuest && (
                <>
                  <View style={styles.popoverHeader}>
                    <Ionicons 
                      name="information-circle" 
                      size={16} 
                      color={popoverArc?.color || COLORS.accent.primary} 
                    />
                    <Text style={styles.popoverTitle}>Quest Name</Text>
                    {popoverArc && (
                      <View style={[styles.popoverArcBadge, { backgroundColor: `${popoverArc.color}20` }]}>
                        <Text style={[styles.popoverArcText, { color: popoverArc.color }]}>
                          {popoverArc.name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.popoverText}>{popoverQuest.name}</Text>
                </>
              )}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButton: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  calendarGrid: {
    marginBottom: 20,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '13.5%',
    aspectRatio: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
    backgroundColor: COLORS.elevated,
    minHeight: 44,
    paddingTop: 4,
  },
  dayEmpty: {
    width: '13.5%',
    aspectRatio: 1,
    marginBottom: 4,
  },
  dayWithMargin: {
    marginRight: '0.5%',
  },
  dayToday: {
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
    backgroundColor: COLORS.surface,
  },
  dayText: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  dayTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  dayTextToday: {
    color: COLORS.accent.primary,
    fontWeight: '700',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    right: 3,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  moreDotsText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginLeft: 1,
  },
  filterLegend: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  filterLegendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLegendTitle: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.elevated,
  },
  clearFilterText: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    color: COLORS.accent.primary,
    fontWeight: '600',
  },
  arcsContainer: {
    marginBottom: 12,
    gap: 8,
  },
  arcSection: {
    backgroundColor: COLORS.elevated,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  arcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 3,
    backgroundColor: COLORS.surface,
  },
  arcHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  arcIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arcIconText: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    fontWeight: '700',
  },
  arcHeaderTitle: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  arcSelectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  arcSelectedText: {
    ...TYPOGRAPHY.stat,
    fontSize: 11,
    fontWeight: '700',
  },
  arcQuestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
  },
  questsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  questFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.elevated,
    borderWidth: 2,
    gap: 8,
    minWidth: 100,
  },
  questFilterItemSelected: {
    backgroundColor: COLORS.surface,
  },
  questFilterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  questFilterText: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  questFilterTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  filterLegendHint: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  popoverOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  popover: {
    position: 'absolute',
    width: 200,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  popoverBorder: {
    height: 3,
    width: '100%',
  },
  popoverContent: {
    padding: 12,
  },
  popoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  popoverTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popoverArcBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  popoverArcText: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '600',
  },
  popoverText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
});

