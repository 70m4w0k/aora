import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants';

export default function StatisticsSection({ statistics }) {
  if (!statistics) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>STATISTICS</Text>
      </View>
      
      {/* Weekly Summary */}
      <View style={styles.statCard}>
        <Text style={styles.statCardTitle}>This Week</Text>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.weeklySummary.completions}</Text>
            <Text style={styles.statLabel}>Completions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[
              styles.statValue,
              statistics.weeklySummary.change >= 0 ? { color: COLORS.accent.success } : { color: COLORS.accent.danger }
            ]}>
              {statistics.weeklySummary.change >= 0 ? '+' : ''}{statistics.weeklySummary.change.toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>vs Last Week</Text>
          </View>
        </View>
      </View>

      {/* Monthly Summary */}
      <View style={styles.statCard}>
        <Text style={styles.statCardTitle}>This Month</Text>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.monthlySummary.completions}</Text>
            <Text style={styles.statLabel}>Completions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[
              styles.statValue,
              statistics.monthlySummary.change >= 0 ? { color: COLORS.accent.success } : { color: COLORS.accent.danger }
            ]}>
              {statistics.monthlySummary.change >= 0 ? '+' : ''}{statistics.monthlySummary.change.toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>vs Last Month</Text>
          </View>
        </View>
      </View>

      {/* Progress Trends - Enhanced Bar Chart */}
      <View style={styles.statCard}>
        <Text style={styles.statCardTitle}>4-Week Completion Trend</Text>
        <View style={styles.chartContainer}>
          <View style={styles.barChart}>
            {statistics.trends.map((trend, index) => {
              const maxCompletions = Math.max(...statistics.trends.map(t => t.completions), 1);
              const barHeight = maxCompletions > 0 ? (trend.completions / maxCompletions) * 100 : 0;
              const isCurrentWeek = index === statistics.trends.length - 1;
              
              return (
                <View key={index} style={styles.barChartItem}>
                  <View style={styles.barChartBarContainer}>
                    <Animated.View
                      style={[
                        styles.barChartBar,
                        {
                          height: `${barHeight}%`,
                          backgroundColor: isCurrentWeek ? COLORS.accent.primary : COLORS.accent.primary + '80',
                          borderColor: isCurrentWeek ? COLORS.accent.primary : 'transparent',
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.barChartLabel} numberOfLines={1}>
                    {trend.week.length > 10 ? trend.week.substring(0, 8) + '...' : trend.week}
                  </Text>
                  <Text style={styles.barChartValue}>{trend.completions}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.chartYAxis}>
            <Text style={styles.chartYAxisLabel}>{Math.max(...statistics.trends.map(t => t.completions), 1)}</Text>
            <Text style={styles.chartYAxisLabel}>0</Text>
          </View>
        </View>
      </View>

      {/* Arc Completion Rates - Enhanced Horizontal Bar Chart */}
      <View style={styles.statCard}>
        <Text style={styles.statCardTitle}>Completion Rates by Arc</Text>
        <View style={styles.horizontalBarChart}>
          {statistics.arcStats.map((arcStat) => {
            const maxRate = Math.max(...statistics.arcStats.map(a => a.completionRate), 100);
            const barWidth = maxRate > 0 ? (arcStat.completionRate / maxRate) * 100 : 0;
            
            return (
              <View key={arcStat.arcId} style={styles.horizontalBarChartItem}>
                <View style={styles.horizontalBarChartHeader}>
                  <View style={styles.horizontalBarChartLabelContainer}>
                    <View style={[styles.horizontalBarChartIndicator, { backgroundColor: arcStat.arcColor || COLORS.accent.primary }]} />
                    <Text style={styles.horizontalBarChartLabel} numberOfLines={1}>
                      {arcStat.arcName}
                    </Text>
                  </View>
                  <Text style={styles.horizontalBarChartValue}>
                    {arcStat.completionRate.toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.horizontalBarChartBarContainer}>
                  <Animated.View
                    style={[
                      styles.horizontalBarChartBar,
                      {
                        width: `${barWidth}%`,
                        backgroundColor: arcStat.arcColor || COLORS.accent.primary,
                      }
                    ]}
                  />
                </View>
                <View style={styles.horizontalBarChartDetails}>
                  <Text style={styles.horizontalBarChartDetailText}>
                    {arcStat.weeklyCompletions} this week • {arcStat.monthlyCompletions} this month
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Arc Comparison Chart */}
      {statistics.arcStats.length > 1 && (
        <View style={styles.statCard}>
          <Text style={styles.statCardTitle}>Arc Comparison</Text>
          <View style={styles.comparisonChart}>
            <View style={styles.comparisonChartBars}>
              {statistics.arcStats.map((arcStat) => {
                const maxCompletions = Math.max(...statistics.arcStats.map(a => a.weeklyCompletions), 1);
                const barHeight = maxCompletions > 0 ? (arcStat.weeklyCompletions / maxCompletions) * 100 : 0;
                
                return (
                  <View key={arcStat.arcId} style={styles.comparisonChartItem}>
                    <View style={styles.comparisonChartBarContainer}>
                      <Animated.View
                        style={[
                          styles.comparisonChartBar,
                          {
                            height: `${barHeight}%`,
                            backgroundColor: arcStat.arcColor || COLORS.accent.primary,
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.comparisonChartValue}>{arcStat.weeklyCompletions}</Text>
                    <Text style={styles.comparisonChartLabel} numberOfLines={1}>
                      {arcStat.arcName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    marginTop: 8,
  },
  barChart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  barChartItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barChartBarContainer: {
    width: '80%',
    height: '85%',
    justifyContent: 'flex-end',
  },
  barChartBar: {
    width: '100%',
    borderRadius: 4,
    borderWidth: 2,
    minHeight: 4,
  },
  barChartLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  barChartValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  chartYAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingTop: 5,
  },
  chartYAxisLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  horizontalBarChart: {
    gap: 12,
  },
  horizontalBarChartItem: {
    marginBottom: 8,
  },
  horizontalBarChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  horizontalBarChartLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  horizontalBarChartIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  horizontalBarChartLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  horizontalBarChartValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  horizontalBarChartBarContainer: {
    height: 8,
    backgroundColor: COLORS.elevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  horizontalBarChartBar: {
    height: '100%',
    borderRadius: 4,
  },
  horizontalBarChartDetails: {
    marginTop: 2,
  },
  horizontalBarChartDetailText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  comparisonChart: {
    marginTop: 8,
  },
  comparisonChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 150,
    paddingHorizontal: 8,
  },
  comparisonChartItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  comparisonChartBarContainer: {
    width: '70%',
    height: '90%',
    justifyContent: 'flex-end',
  },
  comparisonChartBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  comparisonChartValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  comparisonChartLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
});

