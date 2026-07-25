import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { AdminUnsupportedScreen } from "./src/screens/AdminUnsupportedScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { CollaboratorActivitiesScreen, CollaboratorMarketplaceScreen, CollaboratorParticipationScreen } from "./src/screens/CollaboratorScreens";
import { CustomerCampaignDetailScreen, CustomerCreateCampaignScreen, CustomerDashboardScreen } from "./src/screens/CustomerScreens";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { getCurrentUser, logout, type User } from "./src/services/authService";
import { colors } from "./src/theme";

type AppRoute =
  | { name: "customer.dashboard" }
  | { name: "customer.create" }
  | { name: "customer.detail"; campaignId: number }
  | { name: "collaborator.marketplace" }
  | { name: "collaborator.activities" }
  | { name: "collaborator.participation"; participationId: number }
  | { name: "notifications" }
  | { name: "profile" };

interface TabItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: AppRoute;
  active: (route: AppRoute) => boolean;
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [route, setRoute] = useState<AppRoute>({ name: "customer.dashboard" });

  useEffect(() => {
    void (async () => {
      const current = await getCurrentUser();
      setUser(current);
      if (current?.role === "Collaborator") setRoute({ name: "collaborator.marketplace" });
      if (current?.role === "Customer") setRoute({ name: "customer.dashboard" });
      setBooting(false);
    })();
  }, []);

  const tabs = useMemo<TabItem[]>(() => {
    if (!user) return [];
    if (user.role === "Customer") {
      return [
        { label: "Campaign", icon: "clipboard-outline", route: { name: "customer.dashboard" }, active: item => item.name.startsWith("customer.dashboard") || item.name === "customer.detail" },
        { label: "Tạo mới", icon: "add-circle-outline", route: { name: "customer.create" }, active: item => item.name === "customer.create" },
        { label: "Thông báo", icon: "notifications-outline", route: { name: "notifications" }, active: item => item.name === "notifications" },
        { label: "Hồ sơ", icon: "person-outline", route: { name: "profile" }, active: item => item.name === "profile" }
      ];
    }
    if (user.role === "Collaborator") {
      return [
        { label: "Market", icon: "search-outline", route: { name: "collaborator.marketplace" }, active: item => item.name === "collaborator.marketplace" || item.name === "collaborator.participation" },
        { label: "Công việc", icon: "wallet-outline", route: { name: "collaborator.activities" }, active: item => item.name === "collaborator.activities" },
        { label: "Thông báo", icon: "notifications-outline", route: { name: "notifications" }, active: item => item.name === "notifications" },
        { label: "Hồ sơ", icon: "person-outline", route: { name: "profile" }, active: item => item.name === "profile" }
      ];
    }
    return [];
  }, [user]);

  const onAuthenticated = (nextUser: User) => {
    setUser(nextUser);
    if (nextUser.role === "Collaborator") setRoute({ name: "collaborator.marketplace" });
    else setRoute({ name: "customer.dashboard" });
  };

  const onLogout = async () => {
    await logout();
    setUser(null);
    setRoute({ name: "customer.dashboard" });
  };

  if (booting) {
    return <SafeAreaView style={styles.center}><Text style={styles.brandText}>SureVey</Text></SafeAreaView>;
  }

  if (!user) {
    return <><ExpoStatusBar style="dark" /><AuthScreen onAuthenticated={onAuthenticated} /></>;
  }

  if (user.role === "Admin") {
    return <><ExpoStatusBar style="light" /><AdminUnsupportedScreen user={user} onLogout={() => void onLogout()} /></>;
  }

  return <SafeAreaView style={styles.root}>
    <ExpoStatusBar style="dark" />
    <StatusBar barStyle="dark-content" />
    <View style={styles.header}>
      <View style={styles.logo}><Text style={styles.logoText}>S</Text></View>
      <View style={styles.headerText}>
        <Text style={styles.appName}>SureVey</Text>
        <Text style={styles.userLine} numberOfLines={1}>{user.name} - {user.role}</Text>
      </View>
      <Pressable onPress={() => void onLogout()} style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={20} color={colors.text} />
      </Pressable>
    </View>

    <View style={styles.content}>{renderRoute(route, setRoute, user)}</View>
    <View style={styles.tabs}>
      {tabs.map(tab => {
        const active = tab.active(route);
        return <Pressable key={tab.label} onPress={() => setRoute(tab.route)} style={styles.tabItem}>
          <Ionicons name={tab.icon} size={22} color={active ? colors.primary : colors.muted} />
          <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
        </Pressable>;
      })}
    </View>
  </SafeAreaView>;
}

function renderRoute(route: AppRoute, navigate: (route: AppRoute) => void, user: User) {
  if (route.name === "customer.dashboard") return <CustomerDashboardScreen navigate={navigate} />;
  if (route.name === "customer.create") return <CustomerCreateCampaignScreen navigate={navigate} />;
  if (route.name === "customer.detail") return <CustomerCampaignDetailScreen campaignId={route.campaignId} navigate={navigate} />;
  if (route.name === "collaborator.marketplace") return <CollaboratorMarketplaceScreen navigate={navigate} />;
  if (route.name === "collaborator.activities") return <CollaboratorActivitiesScreen navigate={navigate} />;
  if (route.name === "collaborator.participation") return <CollaboratorParticipationScreen participationId={route.participationId} navigate={navigate} />;
  if (route.name === "notifications") {
    return <NotificationsScreen
      user={user}
      onOpenCustomerCampaign={campaignId => navigate({ name: "customer.detail", campaignId })}
      onOpenCollaboratorActivities={() => navigate({ name: "collaborator.activities" })}
    />;
  }
  if (route.name === "profile") return <ProfileScreen />;
  return <ScrollView />;
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  },
  center: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center"
  },
  brandText: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: "900"
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  logo: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  logoText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900"
  },
  headerText: {
    flex: 1
  },
  appName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  userLine: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  content: {
    flex: 1
  },
  tabs: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    paddingBottom: 8,
    paddingTop: 8
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
    gap: 3
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  tabLabelActive: {
    color: colors.primary
  }
});
