import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/styles';
import type { SessionLog } from '@/hooks/use-session-logger';

const { width } = Dimensions.get('window');
const GRAPH_WIDTH = width - 48;
const GRAPH_HEIGHT = 160;
const BAR_COUNT = 7;

function getDayLabel(dateStr: string) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
}

function getLastNDates(n: number): string[] {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function LogScreen() {
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const raw = await AsyncStorage.getItem('session_logs');
      const parsed: SessionLog[] = raw ? JSON.parse(raw) : [];
      setLogs(parsed.reverse()); // newest first
    } catch (e) {
      console.error('Failed to load logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    await AsyncStorage.removeItem('session_logs');
    setLogs([]);
  };

  // Build weekly graph data — average alertness per day for last 7 days
  const last7 = getLastNDates(BAR_COUNT);
  const weekData = last7.map((date) => {
    const dayLogs = logs.filter(l => l.date === date);
    if (dayLogs.length === 0) return { date, score: null, alerts: 0 };
    const avg = Math.round(dayLogs.reduce((sum, l) => sum + l.avgAlertnessScore, 0) / dayLogs.length);
    const alerts = dayLogs.reduce((sum, l) => sum + l.totalAlerts, 0);
    return { date, score: avg, alerts };
  });

  const maxScore = 100;

  // Summary stats
  const totalAlerts = logs.reduce((s, l) => s + l.totalAlerts, 0);
  const avgAlertness = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + l.avgAlertnessScore, 0) / logs.length)
    : null;

  return (
    <ScrollView style={logStyles.container} contentContainerStyle={{ paddingBottom: 20 }}>

      {/* Summary cards */}
      <View style={logStyles.summaryRow}>
        <View style={logStyles.summaryCard}>
          <Text style={logStyles.summaryValue}>{avgAlertness !== null ? `${avgAlertness}%` : '—'}</Text>
          <Text style={logStyles.summaryLabel}>Avg Alertness</Text>
        </View>
        <View style={logStyles.summaryCard}>
          <Text style={logStyles.summaryValue}>{totalAlerts}</Text>
          <Text style={logStyles.summaryLabel}>Total Alerts</Text>
        </View>
        <View style={logStyles.summaryCard}>
          <Text style={logStyles.summaryValue}>{logs.length}</Text>
          <Text style={logStyles.summaryLabel}>Sessions</Text>
        </View>
      </View>

      {/* Weekly Graph */}
      <View style={logStyles.section}>
        <Text style={logStyles.sectionTitle}>Weekly Alertness</Text>
        <View style={logStyles.graphContainer}>
          {/* Y axis labels */}
          <View style={logStyles.yAxis}>
            {[100, 75, 50, 25, 0].map(v => (
              <Text key={v} style={logStyles.yLabel}>{v}</Text>
            ))}
          </View>

          {/* Bars */}
          <View style={logStyles.barsArea}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(v => (
              <View
                key={v}
                style={[logStyles.gridLine, { bottom: (v / maxScore) * GRAPH_HEIGHT }]}
              />
            ))}

            <View style={logStyles.barsRow}>
              {weekData.map((d) => {
                const barH = d.score !== null ? (d.score / maxScore) * GRAPH_HEIGHT : 0;
                const barColor = d.score === null ? '#333'
                  : d.score >= 75 ? '#2ecc71'
                  : d.score >= 50 ? '#f39c12'
                  : colors.red;

                return (
                  <View key={d.date} style={logStyles.barWrapper}>
                    <View style={[logStyles.barBg, { height: GRAPH_HEIGHT }]}>
                      <View style={[logStyles.bar, { height: barH, backgroundColor: barColor }]} />
                    </View>
                    {d.score !== null && (
                      <Text style={logStyles.barScore}>{d.score}%</Text>
                    )}
                    <Text style={logStyles.barLabel}>{getDayLabel(d.date)}</Text>
                    {d.alerts > 0 && (
                      <Text style={logStyles.barAlerts}>{d.alerts}⚠</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Legend */}
        <View style={logStyles.legend}>
          {[
            { color: '#2ecc71', label: 'Alert (75–100%)' },
            { color: '#f39c12', label: 'Moderate (50–74%)' },
            { color: colors.red, label: 'Drowsy (0–49%)' },
          ].map(({ color, label }) => (
            <View key={label} style={logStyles.legendItem}>
              <View style={[logStyles.legendDot, { backgroundColor: color }]} />
              <Text style={logStyles.legendText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Session History */}
      <View style={logStyles.section}>
        <View style={logStyles.sectionHeader}>
          <Text style={logStyles.sectionTitle}>Session History</Text>
          {logs.length > 0 && (
            <TouchableOpacity onPress={clearLogs}>
              <Text style={logStyles.clearBtn}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <Text style={logStyles.emptyText}>Loading...</Text>
        ) : logs.length === 0 ? (
          <View style={logStyles.emptyState}>
            <Ionicons name="analytics-outline" size={40} color="#333" />
            <Text style={logStyles.emptyText}>No sessions yet</Text>
            <Text style={logStyles.emptySubText}>Start a detection session to see your history</Text>
          </View>
        ) : (
          logs.map((log, i) => {
            const date = new Date(log.timestamp);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const scoreColor = log.avgAlertnessScore >= 75 ? '#2ecc71'
              : log.avgAlertnessScore >= 50 ? '#f39c12'
              : colors.red;

            return (
              <View key={i} style={logStyles.sessionCard}>
                <View style={logStyles.sessionLeft}>
                  <Text style={logStyles.sessionDate}>{dateStr}</Text>
                  <Text style={logStyles.sessionTime}>{timeStr}</Text>
                  <View style={logStyles.sessionMeta}>
                    <Text style={logStyles.sessionMetaText}>⚠ {log.totalAlerts} alerts</Text>
                    <Text style={logStyles.sessionMetaText}>  {log.totalFrames} frames</Text>
                  </View>
                </View>
                <View style={logStyles.sessionRight}>
                  <Text style={[logStyles.sessionScore, { color: scoreColor }]}>
                    {log.avgAlertnessScore}%
                  </Text>
                  <Text style={logStyles.sessionScoreLabel}>alertness</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const logStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  clearBtn: {
    fontSize: 12,
    color: colors.red,
  },
  graphContainer: {
    flexDirection: 'row',
    height: GRAPH_HEIGHT + 40,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 12,
  },
  yAxis: {
    justifyContent: 'space-between',
    marginRight: 6,
    height: GRAPH_HEIGHT,
  },
  yLabel: {
    fontSize: 9,
    color: '#555',
  },
  barsArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#222',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: GRAPH_HEIGHT,
    gap: 6,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barBg: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  barScore: {
    fontSize: 8,
    color: '#aaa',
    marginTop: 2,
  },
  barLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  barAlerts: {
    fontSize: 8,
    color: colors.red,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  sessionLeft: {
    gap: 2,
  },
  sessionDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  sessionTime: {
    fontSize: 11,
    color: '#555',
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  sessionMetaText: {
    fontSize: 10,
    color: '#555',
  },
  sessionRight: {
    alignItems: 'center',
  },
  sessionScore: {
    fontSize: 24,
    fontWeight: '800',
  },
  sessionScoreLabel: {
    fontSize: 9,
    color: '#555',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#444',
    fontSize: 12,
    textAlign: 'center',
  },
});