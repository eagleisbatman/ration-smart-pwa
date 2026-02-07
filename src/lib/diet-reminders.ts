/**
 * Diet Reminders — lightweight localStorage-backed reminder system.
 *
 * Each reminder has the shape:
 *   { id, dietId, dietTitle, cowName?, reminderDate, note?, createdAt, dismissed }
 *
 * Storage key: "diet_reminders"
 */

export interface DietReminder {
  id: string;
  dietId: string;
  dietTitle: string;
  cowName?: string;
  /** ISO date string (yyyy-MM-dd) */
  reminderDate: string;
  note?: string;
  /** ISO datetime string */
  createdAt: string;
  dismissed: boolean;
}

const STORAGE_KEY = 'diet_reminders';

/** Read all reminders from localStorage. */
export function getDietReminders(): DietReminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DietReminder[];
  } catch {
    return [];
  }
}

/** Persist the full list of reminders. */
function saveReminders(reminders: DietReminder[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

/** Generate a short unique id. */
function uid(): string {
  return `dr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Add a new reminder and return it. */
export function addDietReminder(params: {
  dietId: string;
  dietTitle: string;
  cowName?: string;
  reminderDate: string;
  note?: string;
}): DietReminder {
  const reminders = getDietReminders();

  const reminder: DietReminder = {
    id: uid(),
    dietId: params.dietId,
    dietTitle: params.dietTitle,
    cowName: params.cowName,
    reminderDate: params.reminderDate,
    note: params.note,
    createdAt: new Date().toISOString(),
    dismissed: false,
  };

  reminders.push(reminder);
  saveReminders(reminders);
  return reminder;
}

/** Dismiss a reminder by id. */
export function dismissDietReminder(id: string): void {
  const reminders = getDietReminders();
  const target = reminders.find((r) => r.id === id);
  if (target) {
    target.dismissed = true;
    saveReminders(reminders);
  }
}

/** Get all active (non-dismissed) reminders for a given diet. */
export function getActiveRemindersForDiet(dietId: string): DietReminder[] {
  return getDietReminders().filter(
    (r) => r.dietId === dietId && !r.dismissed
  );
}

/** Check if a diet has any active (non-dismissed) reminder. */
export function hasActiveReminder(dietId: string): boolean {
  return getActiveRemindersForDiet(dietId).length > 0;
}

/**
 * Return reminders that are due (reminderDate <= today) and not dismissed.
 * Used by the notifications store to generate notifications.
 */
export function getDueReminders(): DietReminder[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return getDietReminders().filter((r) => {
    if (r.dismissed) return false;
    const reminderDate = new Date(r.reminderDate);
    reminderDate.setHours(0, 0, 0, 0);
    return reminderDate <= today;
  });
}
