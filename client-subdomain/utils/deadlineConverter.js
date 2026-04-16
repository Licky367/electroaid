exports.convertDeadline = (deadline) => {
    try {
        const local = new Date(deadline);

        const utc = new Date(local.toLocaleString("en-US", { timeZone: "UTC" }));

        const eat = new Date(
            utc.toLocaleString("en-US", { timeZone: "Africa/Nairobi" })
        );

        return { utcDate: utc, eatDate: eat };

    } catch {
        const fallback = new Date(deadline);
        return { utcDate: fallback, eatDate: fallback };
    }
};