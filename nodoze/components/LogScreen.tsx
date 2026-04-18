import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from '@/constants/styles';
import type { SessionLog } from '@/hooks/use-session-logger';

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

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const raw = await AsyncStorage.getItem('session_logs');
      const parsed: SessionLog[] = raw ? JSON.parse(raw) : [];
      setLogs(parsed.reverse());
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

  const last7 = getLastNDates(BAR_COUNT);
  const weekData = last7.map((date) => {
    const dayLogs = logs.filter(l => l.date === date);
    if (dayLogs.length === 0) return { date, score: null, alerts: 0 };
    const avg = Math.round(dayLogs.reduce((sum, l) => sum + l.avgAlertnessScore, 0) / dayLogs.length);
    const alerts = dayLogs.reduce((sum, l) => sum + l.totalAlerts, 0);
    return { date, score: avg, alerts };
  });

  const totalAlerts = logs.reduce((s, l) => s + l.totalAlerts, 0);
  const avgAlertness = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + l.avgAlertnessScore, 0) / logs.length)
    : null;

  return (
    <ScrollView style={styles.logContainer} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{avgAlertness !== null ? `${avgAlertness}%` : '—'}</Text>
          <Text style={styles.summaryLabel}>Avg Alertness</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalAlerts}</Text>
          <Text style={styles.summaryLabel}>Total Alerts</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{logs.length}</Text>
          <Text style={styles.summaryLabel}>Sessions</Text>
        </View>
      </View>

      {/* Weekly Graph */}
      <View style={styles.logSection}>
        <Text style={styles.sectionTitle}>Weekly Alertness</Text>
        <View style={styles.graphContainer}>
          <View style={styles.yAxis}>
            {[100, 75, 50, 25, 0].map(v => (
              <Text key={v} style={styles.yLabel}>{v}</Text>
            ))}
          </View>
          <View style={styles.barsArea}>
            {[0, 25, 50, 75, 100].map(v => (
              <View key={v} style={[styles.gridLine, { bottom: (v / 100) * GRAPH_HEIGHT }]} />
            ))}
            <View style={styles.barsRow}>
              {weekData.map((d) => {
                const barH = d.score !== null ? (d.score / 100) * GRAPH_HEIGHT : 0;
                const barColor = d.score === null ? '#333'
                  : d.score >= 75 ? '#2ecc71'
                  : d.score >= 50 ? '#f39c12'
                  : colors.red;
                return (
                  <View key={d.date} style={styles.barWrapper}>
                    <View style={[styles.barBg, { height: GRAPH_HEIGHT }]}>
                      <View style={[styles.bar, { height: barH, backgroundColor: barColor }]} />
                    </View>
                    {d.score !== null && <Text style={styles.barScore}>{d.score}%</Text>}
                    <Text style={styles.barLabel}>{getDayLabel(d.date)}</Text>
                    {d.alerts > 0 && <Text style={styles.barAlerts}>{d.alerts}⚠</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { color: '#2ecc71', label: 'Alert', range: '75–100%' },
            { color: '#f39c12', label: 'Moderate', range: '50–74%' },
            { color: colors.red, label: 'Drowsy', range: '0–49%' },
          ].map(({ color, label, range }) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendLabel}>{label}</Text>
              <Text style={styles.legendRange}>{range}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Session History */}
      <View style={styles.logSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Session History</Text>
          {logs.length > 0 && (
            <TouchableOpacity onPress={clearLogs}>
              <Text style={styles.clearBtn}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No sessions yet</Text>
            <Text style={styles.emptySubText}>Start a detection session to see your history</Text>
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
              <View key={i} style={styles.sessionCard}>
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionDate}>{dateStr}</Text>
                  <Text style={styles.sessionTime}>{timeStr}</Text>
                  <View style={styles.sessionMeta}>
                    <View style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText}>⚠ {log.totalAlerts} alerts</Text>
                    </View>
                    <View style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText}>◈ {log.totalFrames} frames</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.sessionRight}>
                  <Text style={[styles.sessionScore, { color: scoreColor }]}>
                    {log.avgAlertnessScore}%
                  </Text>
                  <Text style={styles.sessionScoreLabel}>alertness</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}