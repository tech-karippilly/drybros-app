/**
 * Earnings screen
 * Matches the provided design (custom header, tabs, summary cards, history list).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../typography';
import { normalizeHeight, normalizeWidth } from '../utils/responsive';
import { COLORS, EARNINGS_COLORS, EARNINGS_LAYOUT, EARNINGS_STRINGS } from '../constants';
import { getDriverDailyStatsApi } from '../services/api/driverDailyStats';
import { getDriverMonthlyStatsApi } from '../services/api/driverEarnings';
import { getDriverTransactionsApi, getDriverTransactionSummaryApi } from '../services/api/driverTransactions';
import type { DriverDailyStats } from '../services/api/driverDailyStats';
import type { DriverMonthlyStats } from '../services/api/driverEarnings';
import type { DriverTransaction } from '../services/api/driverTransactions';

type EarningsPeriod = 'daily' | 'monthly' | 'yearly';

type HeaderProps = {
  title: string;
  onBack: () => void;
};

function EarningsHeader({ title, onBack }: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" onPress={onBack} style={styles.headerIconBtn} hitSlop={12}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={normalizeWidth(EARNINGS_LAYOUT.HEADER_ICON_SIZE)}
          color={COLORS.textPrimary}
        />
      </TouchableOpacity>

      <Text variant="body" weight="semiBold" style={styles.headerTitle}>
        {title}
      </Text>

      {/* Spacer to keep title centered */}
      <View style={styles.headerRightSpacer} />
    </View>
  );
}

type TabsProps = {
  value: EarningsPeriod;
  onChange: (next: EarningsPeriod) => void;
};

function EarningsTabs({ value, onChange }: TabsProps) {
  const tabs: Array<{ key: EarningsPeriod; label: string }> = [
    { key: 'daily', label: EARNINGS_STRINGS.PERIOD_DAILY },
    { key: 'monthly', label: EARNINGS_STRINGS.PERIOD_MONTHLY },
    { key: 'yearly', label: EARNINGS_STRINGS.PERIOD_YEARLY },
  ];

  return (
    <View style={styles.tabsWrap}>
      <View style={styles.tabsTrack}>
        {tabs.map((t) => {
          const isActive = value === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={() => onChange(t.key)}
              style={[styles.tabPill, isActive && styles.tabPillActive]}
            >
              <Text
                variant="body"
                weight="semiBold"
                style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

type SummaryCardProps = {
  period: EarningsPeriod;
  dailyStats?: DriverDailyStats | null;
  monthlyStats?: DriverMonthlyStats | null;
  loading: boolean;
};

function SummaryCard({ period, dailyStats, monthlyStats, loading }: SummaryCardProps) {
  const formatCurrency = (amount?: number | null) => {
    if (amount == null || isNaN(amount)) return '₹ 0';
    return `₹ ${amount.toLocaleString('en-IN')}`;
  };

  const getPeriodLabel = () => {
    if (period === 'daily') return EARNINGS_STRINGS.TODAY;
    if (period === 'monthly') return 'This Month';
    return 'This Year';
  };

  const getTotalEarnings = () => {
    if (period === 'daily' && dailyStats) {
      return formatCurrency(dailyStats.amountRunToday);
    }
    if (period === 'monthly' && monthlyStats) {
      return formatCurrency(monthlyStats.totalAmount);
    }
    return '₹ 0';
  };

  const getIncentives = () => {
    if (period === 'daily' && dailyStats) {
      return formatCurrency(dailyStats.incentiveToday);
    }
    if (period === 'monthly' && monthlyStats) {
      return formatCurrency(monthlyStats.totalIncentive);
    }
    return '₹ 0';
  };

  const getPenalties = () => {
    if (period === 'monthly' && monthlyStats) {
      return formatCurrency(monthlyStats.totalPenalties);
    }
    return '₹ 0';
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text variant="body" weight="semiBold" style={styles.sectionTitle}>
        {getPeriodLabel()}
      </Text>

      <View style={styles.totalBox}>
        <Text variant="h4" weight="semiBold" style={styles.totalAmount}>
          {getTotalEarnings()}
        </Text>
        <Text variant="caption" style={styles.subLabel}>
          {EARNINGS_STRINGS.TOTAL_EARNINGS}
        </Text>
      </View>

      <View style={styles.twoColRow}>
        <View style={[styles.smallBox, styles.incentiveBox]}>
          <Text variant="h4" weight="semiBold" style={styles.smallAmount}>
            {getIncentives()}
          </Text>
          <Text variant="caption" style={styles.subLabel}>
            {EARNINGS_STRINGS.INCENTIVES}
          </Text>
        </View>

        <View style={[styles.smallBox, styles.bonusBox]}>
          <Text variant="h4" weight="semiBold" style={styles.smallAmount}>
            {getPenalties()}
          </Text>
          <Text variant="caption" style={styles.subLabel}>
            Penalties
          </Text>
        </View>
      </View>
    </View>
  );
}

type EarningsHistoryCardProps = {
  period: EarningsPeriod;
  transactions: DriverTransaction[];
  monthlyStats?: DriverMonthlyStats | null;
  loading: boolean;
};

function EarningsHistoryCard({ period, transactions, monthlyStats, loading }: EarningsHistoryCardProps) {
  const formatCurrency = (amount?: number | string | null) => {
    if (amount == null) return '₹ 0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '₹ 0';
    return `₹ ${numAmount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // For daily view, show transactions
  if (period === 'daily') {
    if (transactions.length === 0) {
      return (
        <View style={styles.card}>
          <Text variant="body" weight="semiBold" style={styles.sectionTitle}>
            Recent Transactions
          </Text>
          <Text variant="caption" style={[styles.subLabel, { textAlign: 'center', marginTop: 20 }]}>
            No transactions found
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text variant="body" weight="semiBold" style={styles.sectionTitle}>
          Recent Transactions
        </Text>

        {transactions.slice(0, 10).map((transaction, idx) => (
          <View key={transaction.id} style={[styles.historyRow, idx > 0 && styles.historyRowDivider]}>
            <View style={styles.transactionHeader}>
              <Text variant="caption" style={styles.historyDate}>
                {formatDate(transaction.createdAt)}
              </Text>
              <Text
                variant="caption"
                style={[
                  styles.transactionType,
                  transaction.transactionType === 'CREDIT' ? styles.creditText : styles.debitText,
                ]}
              >
                {transaction.type}
              </Text>
            </View>

            <View style={styles.historyCols}>
              <View style={[styles.historyCol, { flex: 2 }]}>
                <Text variant="caption" style={styles.historyColLabel}>
                  Description
                </Text>
                <Text variant="body" weight="semiBold" style={styles.historyValue}>
                  {transaction.description || transaction.type}
                </Text>
              </View>

              <View style={styles.historyCol}>
                <Text variant="caption" style={styles.historyColLabel}>
                  Amount
                </Text>
                <Text
                  variant="body"
                  weight="semiBold"
                  style={[
                    styles.historyValue,
                    transaction.transactionType === 'CREDIT' ? styles.creditText : styles.debitText,
                  ]}
                >
                  {transaction.transactionType === 'CREDIT' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  // For monthly view, show daily stats
  if (period === 'monthly' && monthlyStats?.dailyStats) {
    if (monthlyStats.dailyStats.length === 0) {
      return (
        <View style={styles.card}>
          <Text variant="body" weight="semiBold" style={styles.sectionTitle}>
            {EARNINGS_STRINGS.HISTORY_TITLE}
          </Text>
          <Text variant="caption" style={[styles.subLabel, { textAlign: 'center', marginTop: 20 }]}>
            No earnings data found
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text variant="body" weight="semiBold" style={styles.sectionTitle}>
          {EARNINGS_STRINGS.HISTORY_TITLE}
        </Text>

        {monthlyStats.dailyStats.slice(0, 10).map((row, idx) => (
          <View key={row.date} style={[styles.historyRow, idx > 0 && styles.historyRowDivider]}>
            <Text variant="caption" style={styles.historyDate}>
              {formatDate(row.date)}
            </Text>

            <View style={styles.historyCols}>
              <View style={styles.historyCol}>
                <Text variant="caption" style={styles.historyColLabel}>
                  {EARNINGS_STRINGS.COL_EARNINGS}
                </Text>
                <Text variant="body" weight="semiBold" style={styles.historyValue}>
                  {formatCurrency(row.totalAmount)}
                </Text>
              </View>

              <View style={styles.historyCol}>
                <Text variant="caption" style={styles.historyColLabel}>
                  {EARNINGS_STRINGS.COL_INCENTIVE}
                </Text>
                <Text variant="body" weight="semiBold" style={styles.historyValue}>
                  {formatCurrency(row.incentive)}
                </Text>
              </View>

              <View style={styles.historyCol}>
                <Text variant="caption" style={styles.historyColLabel}>
                  Trips
                </Text>
                <Text variant="body" weight="semiBold" style={styles.historyValue}>
                  {row.tripsCount}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text variant="body" weight="semiBold" style={styles.sectionTitle}>
        {EARNINGS_STRINGS.HISTORY_TITLE}
      </Text>
      <Text variant="caption" style={[styles.subLabel, { textAlign: 'center', marginTop: 20 }]}>
        No data available
      </Text>
    </View>
  );
}

export function EarningScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<EarningsPeriod>('daily');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State for daily data
  const [dailyStats, setDailyStats] = useState<DriverDailyStats | null>(null);
  
  // State for monthly data
  const [monthlyStats, setMonthlyStats] = useState<DriverMonthlyStats | null>(null);
  
  // State for transactions
  const [transactions, setTransactions] = useState<DriverTransaction[]>([]);

  const fetchDailyData = useCallback(async () => {
    try {
      const stats = await getDriverDailyStatsApi();
      setDailyStats(stats);

      // Fetch recent transactions for daily view
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7); // Last 7 days
      
      const txResponse = await getDriverTransactionsApi({
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        limit: 50,
      });
      setTransactions(txResponse.data);
    } catch (error) {
      console.error('Error fetching daily data:', error);
    }
  }, []);

  const fetchMonthlyData = useCallback(async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const stats = await getDriverMonthlyStatsApi({ year, month });
      setMonthlyStats(stats);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  }, []);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      if (period === 'daily') {
        await fetchDailyData();
      } else if (period === 'monthly') {
        await fetchMonthlyData();
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, fetchDailyData, fetchMonthlyData]);

  useEffect(() => {
    fetchData();
  }, [period]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Status bar: white background + dark icons */}
      <StatusBar style="dark" backgroundColor={COLORS.white} />

      <EarningsHeader title={EARNINGS_STRINGS.TITLE} onBack={() => navigation.goBack()} />
      <View style={styles.headerDivider} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <EarningsTabs value={period} onChange={setPeriod} />
        <SummaryCard period={period} dailyStats={dailyStats} monthlyStats={monthlyStats} loading={loading} />
        <EarningsHistoryCard
          period={period}
          transactions={transactions}
          monthlyStats={monthlyStats}
          loading={loading}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EARNINGS_COLORS.SCREEN_BG,
  },
  header: {
    height: normalizeHeight(EARNINGS_LAYOUT.HEADER_HEIGHT),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: normalizeWidth(EARNINGS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
  },
  headerIconBtn: {
    width: normalizeWidth(EARNINGS_LAYOUT.HEADER_SIDE_BTN_SIZE),
    height: normalizeHeight(EARNINGS_LAYOUT.HEADER_SIDE_BTN_SIZE),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: normalizeWidth(EARNINGS_LAYOUT.HEADER_TITLE_FONT_SIZE),
  },
  headerRightSpacer: {
    width: normalizeWidth(EARNINGS_LAYOUT.HEADER_SIDE_BTN_SIZE),
    height: normalizeHeight(EARNINGS_LAYOUT.HEADER_SIDE_BTN_SIZE),
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: EARNINGS_COLORS.DIVIDER,
  },
  scrollContent: {
    paddingHorizontal: normalizeWidth(EARNINGS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
    paddingBottom: normalizeHeight(EARNINGS_LAYOUT.LIST_BOTTOM_PADDING),
  },
  tabsWrap: {
    paddingTop: normalizeHeight(14),
    paddingBottom: normalizeHeight(10),
  },
  tabsTrack: {
    backgroundColor: EARNINGS_COLORS.TAB_BG,
    borderRadius: normalizeWidth(EARNINGS_LAYOUT.TAB_PILL_RADIUS),
    padding: normalizeWidth(4),
    height: normalizeHeight(EARNINGS_LAYOUT.TABS_HEIGHT),
    flexDirection: 'row',
    gap: normalizeWidth(8),
    alignItems: 'center',
  },
  tabPill: {
    flex: 1,
    height: normalizeHeight(EARNINGS_LAYOUT.TAB_PILL_HEIGHT),
    borderRadius: normalizeWidth(EARNINGS_LAYOUT.TAB_PILL_RADIUS),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: EARNINGS_COLORS.TAB_ACTIVE_BG,
  },
  tabLabel: {
    letterSpacing: 0,
  },
  tabLabelActive: {
    color: EARNINGS_COLORS.TAB_ACTIVE_TEXT,
  },
  tabLabelInactive: {
    color: EARNINGS_COLORS.TAB_INACTIVE_TEXT,
  },
  card: {
    backgroundColor: EARNINGS_COLORS.CARD_BG,
    borderRadius: normalizeWidth(EARNINGS_LAYOUT.CARD_RADIUS),
    padding: normalizeWidth(18),
    marginTop: normalizeHeight(14),
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    marginBottom: normalizeHeight(12),
  },
  totalBox: {
    backgroundColor: EARNINGS_COLORS.TOTAL_BG,
    borderRadius: normalizeWidth(EARNINGS_LAYOUT.INNER_CARD_RADIUS),
    padding: normalizeWidth(18),
  },
  totalAmount: {
    color: COLORS.textPrimary,
  },
  subLabel: {
    color: EARNINGS_COLORS.SUBTEXT,
    marginTop: normalizeHeight(6),
  },
  twoColRow: {
    marginTop: normalizeHeight(14),
    flexDirection: 'row',
    gap: normalizeWidth(EARNINGS_LAYOUT.GAP),
  },
  smallBox: {
    flex: 1,
    borderRadius: normalizeWidth(EARNINGS_LAYOUT.INNER_CARD_RADIUS),
    padding: normalizeWidth(18),
  },
  incentiveBox: {
    backgroundColor: EARNINGS_COLORS.INCENTIVE_BG,
  },
  bonusBox: {
    backgroundColor: EARNINGS_COLORS.BONUS_BG,
  },
  smallAmount: {
    color: COLORS.textPrimary,
  },
  historyRow: {
    paddingVertical: normalizeHeight(EARNINGS_LAYOUT.HISTORY_ROW_VERTICAL_PADDING),
  },
  historyRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: EARNINGS_COLORS.DIVIDER,
  },
  historyDate: {
    color: EARNINGS_COLORS.SUBTEXT,
    marginBottom: normalizeHeight(12),
  },
  historyCols: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyCol: {
    flex: 1,
  },
  historyColLabel: {
    color: EARNINGS_COLORS.SUBTEXT,
    marginBottom: normalizeHeight(6),
  },
  historyValue: {
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    minHeight: normalizeHeight(200),
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalizeHeight(8),
  },
  transactionType: {
    paddingHorizontal: normalizeWidth(8),
    paddingVertical: normalizeHeight(4),
    borderRadius: normalizeWidth(4),
    fontSize: normalizeWidth(10),
    fontWeight: '600',
  },
  creditText: {
    color: '#10B981',
  },
  debitText: {
    color: '#EF4444',
  },
});

export default EarningScreen;
