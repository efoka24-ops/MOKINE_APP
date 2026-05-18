import db from '../db/index.js';

// Global io instance (set by app.js)
let ioInstance = null;
export const setIO = (io) => { ioInstance = io; };

/**
 * Internal helper — create a notification and push to user via socket.
 * Called by other controllers (consultations, appointments, etc.)
 * NOTE: This is intentionally synchronous-fire-and-forget for simplicity.
 */
export const pushNotification = (userId, { type = 'info', title, message, link = null }) => {
  const notif = {
    id: Date.now().toString(),
    userId,
    type,
    title: title || 'Notification',
    message,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.insert(notif).catch(e => console.error('[DB] notification insert error:', e.message));
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit('new_notification', notif);
  }
  return notif;
};

export const markAllAsRead = async (req, res) => {
  try {
    await db.notifications.updateWhere(
      n => n.userId === req.user.id && !n.read,
      { read: true, readAt: new Date().toISOString() }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllNotifications = async (req, res) => {
  try {
    const userNotifications = await db.notifications.filter(n => n.userId === req.user.id);
    res.status(200).json(userNotifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const all = await db.notifications.filter(n => n.userId === req.user.id && !n.read);
    res.status(200).json({ unreadCount: all.length });
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
