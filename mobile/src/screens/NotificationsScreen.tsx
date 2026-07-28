import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text } from "react-native";
import { AppButton, Badge, Card, EmptyState, ErrorBanner, LoadingState, Row, Screen, Subtitle, Title } from "../components/ui";
import { getNotificationsForUser, markAllNotificationsRead, markNotificationRead, type AppNotification } from "../services/notificationService";
import type { User } from "../services/authService";
import { colors, dateTime, message } from "../theme";

export function NotificationsScreen({
  user,
  onOpenCustomerCampaign,
  onOpenCollaboratorActivities
}: {
  user: User;
  onOpenCustomerCampaign: (campaignId: number) => void;
  onOpenCollaboratorActivities: () => void;
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setNotifications(await getNotificationsForUser(user));
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const markAll = async () => {
    await markAllNotificationsRead(user.id, notifications.map(notification => notification.id));
    await load();
  };

  const open = async (notification: AppNotification) => {
    await markNotificationRead(user.id, notification.id);
    if (notification.target === "customer.detail" && notification.targetId) onOpenCustomerCampaign(notification.targetId);
    if (notification.target === "collaborator.activities") onOpenCollaboratorActivities();
  };

  if (loading) return <LoadingState label="Đang tải thông báo" />;

  const unread = notifications.filter(notification => !notification.read).length;

  return <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <Screen>
      <Card tone="dark">
        <Badge tone="blue">{user.role}</Badge>
        <Title light>Trung tâm thông báo</Title>
        <Subtitle light>{unread > 0 ? `${unread} thông báo chưa đọc` : "Không có thông báo mới"}</Subtitle>
      </Card>
      <ErrorBanner messageText={error} />
      <AppButton variant="outline" disabled={notifications.length === 0} onPress={() => void markAll()} icon="checkmark-done-outline">Đánh dấu tất cả đã đọc</AppButton>
      {notifications.length === 0 ? <EmptyState title="Chưa có thông báo" description="Thông báo sẽ xuất hiện khi campaign, submission, thanh toán hoặc ví có cập nhật." icon="notifications-outline" /> :
        notifications.map(notification => <Card key={notification.id} tone={notification.read ? "default" : "blue"}>
          <Row spread wrap>
            <Badge tone={notification.tone === "slate" ? "slate" : notification.tone}>{notification.type}</Badge>
            {!notification.read && <Badge tone="blue">Mới</Badge>}
          </Row>
          <Text style={styles.cardTitle}>{notification.title}</Text>
          <Text style={styles.description}>{notification.description}</Text>
          <Text style={styles.meta}>{dateTime(notification.createdAt)}</Text>
          <AppButton variant="dark" onPress={() => void open(notification)} icon="open-outline">Mở</AppButton>
        </Card>)}
    </Screen>
  </ScrollView>;
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  description: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21
  },
  meta: {
    color: colors.muted,
    fontSize: 12
  }
});
