const padDateTimePart = (value: number) => String(value).padStart(2, "0");

export function localDateTimeToUtcIso(localDateTime: string): string {
  if (!localDateTime) return "";
  return new Date(localDateTime).toISOString();
}

export function localDateAndTimeToUtcIso(date: string, time: string): string {
  if (!date || !time) return "";
  return localDateTimeToUtcIso(`${date}T${time}`);
}

export function utcIsoToLocalDateTimeInputValue(value: string | null | undefined): string {
  if (!value) return "";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value.slice(0, 16);
  }

  return [
    parsedDate.getFullYear(),
    padDateTimePart(parsedDate.getMonth() + 1),
    padDateTimePart(parsedDate.getDate()),
  ].join("-") + `T${padDateTimePart(parsedDate.getHours())}:${padDateTimePart(parsedDate.getMinutes())}`;
}
