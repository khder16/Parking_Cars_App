// utils/sendNotifications.js
import admin from "firebase-admin";

// Initialize Firebase Admin SDK
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(),
//   });
// }

export const sendNotification = async (userId, message, fcmToken) => {
  try {
    if (!fcmToken) {
      console.log("No FCM token available for user:", userId);
      return;
    }

    const notification = {
      notification: {
        title: "Repair Order Update",
        body: message,
      },
      data: {
        type: "repair_order_update",
        userId: userId.toString(),
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      token: fcmToken,
    };

    // Send the notification
    const response = await admin.messaging().send(notification);
    console.log("Notification sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};
