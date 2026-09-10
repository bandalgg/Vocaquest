import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
export async function setReminder(time: string, enabled: boolean) {
  if (Platform.OS === "web")
    throw Error("학습 알림은 Android/iOS 앱에서 설정할 수 있습니다.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    throw Error("시간을 HH:MM 형식으로 입력해 주세요.");
  if (enabled) {
    if (Platform.OS === "android")
      await Notifications.setNotificationChannelAsync("study", {
        name: "학습 알림",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    const p = await Notifications.requestPermissionsAsync();
    if (!p.granted) throw Error("기기 설정에서 알림을 허용해 주세요.");
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (enabled) {
    const [hour, minute] = time.split(":").map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "VOCA QUEST · 오늘의 작은 성장",
        body: "오늘의 단어와 복습 퀘스트가 기다리고 있어요.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: "study",
      },
    });
  }
}
