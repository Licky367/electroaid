const { getUSDtoKES } = require("../../utils/exchangeRate");

function getWeekRange(weekStr){
    const [year, week] = weekStr.split("-W").map(Number);

    const firstJan = new Date(year, 0, 1);
    const days = (week - 1) * 7;

    const sunday = new Date(firstJan);
    sunday.setDate(firstJan.getDate() - firstJan.getDay() + days);
    sunday.setHours(0,0,0,0);

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23,59,59,999);

    return { sunday, saturday };
}

function getWeekFromDate(dateStr){
    const date = new Date(dateStr);

    const firstJan = new Date(date.getFullYear(),0,1);
    const days = Math.floor((date - firstJan)/(24*60*60*1000));
    const week = Math.ceil((days + firstJan.getDay() + 1)/7);

    return `${date.getFullYear()}-W${String(week).padStart(2,'0')}`;
}

function getCurrentWeek(){
    const now = new Date();
    const firstJan = new Date(now.getFullYear(),0,1);
    const days = Math.floor((now-firstJan)/(24*60*60*1000));
    const week = Math.ceil((days+firstJan.getDay()+1)/7);
    return `${now.getFullYear()}-W${String(week).padStart(2,'0')}`;
}

async function getSafeRate(){
    try{
        if(process.env.USE_LIVE_EXCHANGE === "true"){
            const live = await getUSDtoKES();
            if(live && !isNaN(live)) return Number(live);
        }
    }catch(err){
        console.error("Live rate failed, using fallback");
    }

    return Number(process.env.FALLBACK_USD_TO_KES || 130);
}

module.exports = {
    getWeekRange,
    getWeekFromDate,
    getCurrentWeek,
    getSafeRate
};