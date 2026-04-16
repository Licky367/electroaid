/* ================= GET WEEK RANGE (ISO MONDAY → SUNDAY) ================= */
exports.getWeekRange = (weekString) => {

    if (!weekString || !weekString.includes("W")) {
        throw new Error("Invalid week format. Expected YYYY-W##");
    }

    const [yearStr, weekStr] = weekString.split("-W");

    const year = Number(yearStr);
    const week = Number(weekStr);

    if (!year || !week) {
        throw new Error("Invalid week values");
    }

    /* ISO week logic:
       Week 1 = week with first Thursday of year
    */
    const simple = new Date(year, 0, 1 + (week - 1) * 7);

    const dayOfWeek = simple.getDay();
    const ISOweekStart = new Date(simple);

    if (dayOfWeek <= 4) {
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
        ISOweekStart.setDate(simple.getDate() + (8 - simple.getDay()));
    }

    ISOweekStart.setHours(0, 0, 0, 0);

    const ISOweekEnd = new Date(ISOweekStart);
    ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
    ISOweekEnd.setHours(23, 59, 59, 999);

    return {
        weekStart: ISOweekStart,
        weekEnd: ISOweekEnd
    };
};