// hooks/usePushNotifications.js
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// Foreground behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function handleRegistrationError(msg) {
  console.warn(msg);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (!Device.isDevice) {
    handleRegistrationError("Must use physical device for push notifications.");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    handleRegistrationError("Permission not granted for push notifications.");
    return;
  }

  const projectId =
    (Constants?.expoConfig?.extra?.eas && Constants.expoConfig.extra.eas.projectId) ||
    (Constants?.easConfig && Constants.easConfig.projectId);

  if (!projectId) {
    handleRegistrationError("EAS projectId missing in app config.");
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}

export function usePushNotifications(enabled) {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let sub1;
    let sub2;

    (async () => {
      if (!enabled) return;

      const token = await registerForPushNotificationsAsync();
      if (token) setExpoPushToken(token);

      sub1 = Notifications.addNotificationReceivedListener((n) => {
        setNotification(n);
      });

      sub2 = Notifications.addNotificationResponseReceivedListener((response) => {
        // Handle deep links here via response.notification.request.content.data
        console.log("Notification response:", response);
      });
    })();

    return () => {
      if (sub1?.remove) sub1.remove();
      if (sub2?.remove) sub2.remove();
    };
  }, [enabled]);
  console.log(expoPushToken)
  return { expoPushToken, notification };
}

export async function sendPushNotification(to) {
  if (!to) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      sound: "default",
      title: "Hello from Root",
      body: "This is a test notification",
      data: { screen: "inbox" },
    }),
  });
}
