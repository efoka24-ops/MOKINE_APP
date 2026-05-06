import { notifications } from '../models/mockData.js';

let notificationDatabase = [...notifications];

export const getAllNotifications = (req, res) => {
  try {
    const userNotifications = notificationDatabase.filter(n => n.userId === req.user.id);
    res.status(200).json(userNotifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnreadCount = (req, res) => {
  try {
    const unreadCount = notificationDatabase.filter(n => n.userId === req.user.id && !n.read).length;
    res.status(200).json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = (req, res) => {
  try {
    const notification = notificationDatabase.find(n => n.id === req.params.id && n.userId === req.user.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNotification = (req, res) => {
  try {
    const index = notificationDatabase.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const deletedNotification = notificationDatabase.splice(index, 1);
    res.status(200).json({ message: 'Notification deleted', notification: deletedNotification[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
