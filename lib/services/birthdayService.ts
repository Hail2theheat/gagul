/**
 * Birthday Service
 * DESIGN.md §15.2: Detect user birthdays for special fire animation
 *
 * Checks if today matches the user's birthday (month + day, ignoring year)
 */

/**
 * Check if today is the user's birthday
 * @param birthdate - ISO date string (YYYY-MM-DD) or Date object
 * @returns true if today matches the birth month and day
 */
export function isTodayBirthday(birthdate: string | Date | null | undefined): boolean {
  if (!birthdate) return false;

  try {
    const birth = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
    const today = new Date();

    // Compare month (0-11) and day (1-31)
    return (
      birth.getMonth() === today.getMonth() &&
      birth.getDate() === today.getDate()
    );
  } catch (error) {
    console.error('Invalid birthdate:', error);
    return false;
  }
}

/**
 * Get the user's age if today is their birthday
 * @param birthdate - ISO date string (YYYY-MM-DD) or Date object
 * @returns age number if birthday, null otherwise
 */
export function getBirthdayAge(birthdate: string | Date | null | undefined): number | null {
  if (!isTodayBirthday(birthdate)) return null;

  try {
    const birth = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
    const today = new Date();
    return today.getFullYear() - birth!.getFullYear();
  } catch (error) {
    return null;
  }
}
