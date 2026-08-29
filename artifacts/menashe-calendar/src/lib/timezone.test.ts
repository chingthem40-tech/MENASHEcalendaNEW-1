import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarDateInTimeZone,
  zonedDateTime,
} from "./timezone";

test("selected timezone controls the calendar date near midnight", () => {
  const instant = new Date("2026-08-29T20:30:00.000Z");
  const indiaDate = calendarDateInTimeZone(instant, "Asia/Kolkata");
  const newYorkDate = calendarDateInTimeZone(instant, "America/New_York");

  assert.equal(
    `${indiaDate.getFullYear()}-${indiaDate.getMonth() + 1}-${indiaDate.getDate()}`,
    "2026-8-30",
  );
  assert.equal(
    `${newYorkDate.getFullYear()}-${newYorkDate.getMonth() + 1}-${newYorkDate.getDate()}`,
    "2026-8-29",
  );
  assert.equal(
    zonedDateTime(indiaDate, 8, 0, "Asia/Kolkata").toISOString(),
    "2026-08-30T02:30:00.000Z",
  );
});

test("civil reminders resolve independently across a DST transition", () => {
  const before = new Date(2026, 2, 7, 12);
  const after = new Date(2026, 2, 8, 12);
  assert.equal(
    zonedDateTime(before, 8, 0, "America/New_York").toISOString(),
    "2026-03-07T13:00:00.000Z",
  );
  assert.equal(
    zonedDateTime(after, 8, 0, "America/New_York").toISOString(),
    "2026-03-08T12:00:00.000Z",
  );
});