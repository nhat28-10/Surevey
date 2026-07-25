import { StyleSheet, View } from "react-native";
import { AppButton, Card, Subtitle, Title } from "../components/ui";
import type { User } from "../services/authService";

export function AdminUnsupportedScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  return <View style={styles.root}>
    <Card tone="dark">
      <Title light>Admin dùng web dashboard</Title>
      <Subtitle light>
        Tài khoản {user.email} là Admin. Mobile app hiện chỉ dành cho Customer và Collaborator để tạo, làm khảo sát và quản lý ví.
      </Subtitle>
      <AppButton variant="outline" onPress={onLogout} icon="log-out-outline">Đăng xuất</AppButton>
    </Card>
  </View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    padding: 18
  }
});
