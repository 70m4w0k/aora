export const getFirstDayOfWeek = (weekNumber, year = 2024) => {
  // Create a date for January 1st of the given year
  const firstDayOfYear = new Date(year, 0, 1);

  // Get the day of the week for January 1st (0 = Sunday, 6 = Saturday)
  const firstDayWeekDay = firstDayOfYear.getDay();

  // Calculate the day difference to reach the first Monday (week starts on Monday)
  const dayOffset = firstDayWeekDay === 0 ? 6 : firstDayWeekDay - 1;

  // Calculate the first Monday of the year
  const firstMonday = new Date(firstDayOfYear);
  firstMonday.setDate(firstDayOfYear.getDate() + ((7 - dayOffset) % 7));

  // Calculate the start date of the requested week number
  const firstDayOfRequestedWeek = new Date(firstMonday);
  firstDayOfRequestedWeek.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

  return firstDayOfRequestedWeek.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const getWeekNumberByDate = (date) => {
  // Set the start of the year to January 1st
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  // Calculate the number of days between the current date and the start of the year
  const dayOfYear =
    Math.floor(
      (date -
        startOfYear +
        (startOfYear.getTimezoneOffset() - date.getTimezoneOffset()) * 60000) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  // Calculate the week number by dividing the day of the year by 7
  const weekNumber = Math.ceil(dayOfYear / 7);

  return weekNumber;
};
