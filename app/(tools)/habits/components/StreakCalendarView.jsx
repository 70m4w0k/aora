import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { getQuestCompletions } from '../../../../lib/appwrite';

export default function StreakCalendarView({ quests, arcs, userId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [streakData, setStreakData] = useState({}); // { dateKey: { questId: streakCount } }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quests.length > 0 && userId) {
      loadStreakData();
    } else {
      setLoading(false);
    }
  }, [quests, userId, currentMonth]);

  const loadStreakData = async () => {
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
      
      // Process completions and calculate streaks
      completionsResults.forEach(({ questId, completions }) => {
        // Sort completions by date
        const sortedCompletions = [...completions].sort((a, b) => {
          const dateA = new Date(a.completedAt || a.$createdAt);
          const dateB = new Date(b.completedAt || b.$createdAt);
          return dateA - dateB;
        });
        
        // Calculate streak for each day in the month
        for (let day = 1; day <= endDate.getDate(); day++) {
          const date = new Date(year, month, day);
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          if (!data[dateKey]) {
            data[dateKey] = {};
          }
          
          // Calculate streak up to this date
          const streak = calculateStreakUpToDate(date, sortedCompletions);
          data[dateKey][questId] = streak;
        }
      });
      
      setStreakData(data);
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreakUpToDate = (targetDate, completions) => {
    if (completions.length === 0) return 0;
    
    const targetDateStr = targetDate.toISOString().split('T')[0];
    let streak = 0;
    let currentDate = new Date(targetDate);
    currentDate.setHours(0, 0, 0, 0);
    
    // Check backwards from target date
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasCompletion = completions.some(c => {
        const completionDate = new Date(c.completedAt || c.$createdAt);
        return completionDate.toISOString().split('T')[0] === dateStr;
      });
      
      if (hasCompletion) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getDayStreakColor = (dateKey) => {
    const dayData = streakData[dateKey];
    if (!dayData || Object.keys(dayData).length === 0) {
      return COLORS.elevated; // No activity
    }
    
    // Get max streak for this day across all quests
    const maxStreak = Math.max(...Object.values(dayData));
    
    // Color intensity based on streak length
    if (maxStreak === 0) return COLORS.elevated;
    if (maxStreak >= 30) return COLORS.accent.success + 'FF'; // 30+ days - bright green
    if (maxStreak >= 14) return COLORS.accent.success + 'CC'; // 14-29 days - medium green
    if (maxStreak >= 7) return COLORS.accent.warning + 'CC'; // 7-13 days - orange
    if (maxStreak >= 3) return COLORS.accent.warning + '99'; // 3-6 days - light orange
    return COLORS.accent.primary + '99'; // 1-2 days - light purple
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
      const dayData = streakData[dateKey] || {};
      const maxStreak = Object.keys(dayData).length > 0 ? Math.max(...Object.values(dayData)) : 0;
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push({
        day,
        date,
        dateKey,
        maxStreak,
        isToday,
      });
    }
    
    return (
      <View style={styles.streakCalendarGrid}>
        {/* Day labels */}
        <View style={styles.streakCalendarWeekRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <View key={day} style={styles.streakCalendarDayLabel}>
              <Text style={styles.streakCalendarDayLabelText}>{day}</Text>
            </View>
          ))}
        </View>
        
        {/* Calendar days */}
        <View style={styles.streakCalendarDays}>
          {days.map((dayData, index) => {
            if (dayData === null) {
              return <View key={`empty-${index}`} style={styles.streakCalendarDay} />;
            }
            
            const { day, dateKey, maxStreak, isToday } = dayData;
            const color = getDayStreakColor(dateKey);
            const dayDataObj = streakData[dateKey] || {};
            const questCount = Object.keys(dayDataObj).length;
            
            return (
              <TouchableOpacity
                key={dateKey}
                style={[
                  styles.streakCalendarDay,
                  { backgroundColor: color },
                  isToday && styles.streakCalendarDayToday,
                ]}
                onPress={() => {
                  if (questCount > 0) {
                    const questDetails = Object.entries(dayDataObj).map(([questId, streak]) => {
                      const quest = quests.find(q => q.$id === questId);
                      const arc = quest ? arcs.find(a => {
                        const aId = typeof quest.arcId === 'object' ? quest.arcId.$id : quest.arcId;
                        return a.$id === aId;
                      }) : null;
                      return { quest, arc, streak };
                    }).filter(item => item.quest);
                    
                    Alert.alert(
                      `${day}/${month + 1}/${year}`,
                      questDetails.map(({ quest, streak }) => 
                        `${quest.name}: ${streak} day streak`
                      ).join('\n') || 'No completions'
                    );
                  }
                }}
              >
                <Text style={[
                  styles.streakCalendarDayText,
                  maxStreak > 0 && styles.streakCalendarDayTextActive,
                  isToday && styles.streakCalendarDayTextToday,
                ]}>
                  {day}
                </Text>
                {maxStreak > 0 && (
                  <View style={styles.streakCalendarDayBadge}>
                    <Ionicons name="flame" size={8} color={COLORS.accent.warning} />
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
      <View style={styles.streakCalendarLoading}>
        <ActivityIndicator size="small" color={COLORS.accent.primary} />
        <Text style={styles.streakCalendarLoadingText}>Loading streak data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.streakCalendarContainer}>
      {/* Month Navigation */}
      <View style={styles.streakCalendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.streakCalendarNavButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday} style={styles.streakCalendarMonthButton}>
          <Text style={styles.streakCalendarMonthText}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextMonth} style={styles.streakCalendarNavButton}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      {renderCalendar()}

      {/* Legend */}
      <View style={styles.streakCalendarLegend}>
        <Text style={styles.streakCalendarLegendTitle}>Streak Intensity</Text>
        <View style={styles.streakCalendarLegendItems}>
          <View style={styles.streakCalendarLegendItem}>
            <View style={[styles.streakCalendarLegendColor, { backgroundColor: COLORS.elevated }]} />
            <Text style={styles.streakCalendarLegendText}>No streak</Text>
          </View>
          <View style={styles.streakCalendarLegendItem}>
            <View style={[styles.streakCalendarLegendColor, { backgroundColor: COLORS.accent.primary + '99' }]} />
            <Text style={styles.streakCalendarLegendText}>1-2 days</Text>
          </View>
          <View style={styles.streakCalendarLegendItem}>
            <View style={[styles.streakCalendarLegendColor, { backgroundColor: COLORS.accent.warning + '99' }]} />
            <Text style={styles.streakCalendarLegendText}>3-6 days</Text>
          </View>
          <View style={styles.streakCalendarLegendItem}>
            <View style={[styles.streakCalendarLegendColor, { backgroundColor: COLORS.accent.warning + 'CC' }]} />
            <Text style={styles.streakCalendarLegendText}>7-13 days</Text>
          </View>
          <View style={styles.streakCalendarLegendItem}>
            <View style={[styles.streakCalendarLegendColor, { backgroundColor: COLORS.accent.success + 'CC' }]} />
            <Text style={styles.streakCalendarLegendText}>14-29 days</Text>
          </View>
          <View style={styles.streakCalendarLegendItem}>
            <View style={[styles.streakCalendarLegendColor, { backgroundColor: COLORS.accent.success + 'FF' }]} />
            <Text style={styles.streakCalendarLegendText}>30+ days</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  streakCalendarContainer: {
    marginTop: 20,
  },
  streakCalendarLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  streakCalendarLoadingText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 12,
  },
  streakCalendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakCalendarNavButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakCalendarMonthButton: {
    flex: 1,
    alignItems: 'center',
  },
  streakCalendarMonthText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  streakCalendarGrid: {
    marginBottom: 20,
  },
  streakCalendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  streakCalendarDayLabel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  streakCalendarDayLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  streakCalendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  streakCalendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
  },
  streakCalendarDayToday: {
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
  },
  streakCalendarDayText: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  streakCalendarDayTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  streakCalendarDayTextToday: {
    color: COLORS.accent.primary,
    fontWeight: '700',
  },
  streakCalendarDayBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  streakCalendarLegend: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  streakCalendarLegendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  streakCalendarLegendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  streakCalendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakCalendarLegendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  streakCalendarLegendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

