const PDFDocument = require("pdfkit");
const {
    buildInvoice,
    getInvoiceByDate,
    getHistory
} = require("../services/expertInvoiceService");

exports.renderPage = (req, res)=>{
    res.render("expert-invoice");
};

exports.getInvoice = async (req,res)=>{
    try{
        const { week } = req.query;
        const expertId = req.session.expert;

        if(!week){
            return res.status(400).json({ message:"Week required" });
        }

        const data = await buildInvoice(expertId, week);

        res.json({
            week: data.week,
            weekRange: `${data.sunday.toDateString()} - ${data.saturday.toDateString()}`,
            assignments: data.assignments,
            totalUSD: data.totalUSD,
            totalKES: data.totalKES,
            status: data.status,
            transactionCode: data.transactionCode
        });

    }catch(err){
        console.error(err);
        res.status(500).json({ message:"Server error" });
    }
};

exports.getInvoiceByDate = async (req,res)=>{
    try{
        const { date } = req.query;
        const expertId = req.session.EXPERT_ID;

        if(!date){
            return res.status(400).json({ message:"Date required" });
        }

        const data = await getInvoiceByDate(expertId, date);

        res.json({
            week: data.week,
            weekRange: `${data.sunday.toDateString()} - ${data.saturday.toDateString()}`,
            assignments: data.assignments,
            totalUSD: data.totalUSD,
            totalKES: data.totalKES,
            status: data.status,
            transactionCode: data.transactionCode
        });

    }catch(err){
        console.error(err);
        res.status(500).json({ message:"Error loading invoice" });
    }
};

exports.getHistory = async (req,res)=>{
    try{
        const expertId = req.session.EXPERT_ID;
        const history = await getHistory(expertId);
        res.json({ history });
    }catch(err){
        console.error(err);
        res.status(500).json({ message:"History error" });
    }
};

exports.downloadInvoice = async (req,res)=>{
    try{
        const { week } = req.query;
        const expertId = req.session.EXPERT_ID;

        if(!week){
            return res.status(400).json({ message:"Week required" });
        }

        const data = await buildInvoice(expertId, week);

        const doc = new PDFDocument({ margin: 40 });

        res.setHeader("Content-Type","application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=Invoice_${week}.pdf`
        );

        doc.pipe(res);

        doc.fontSize(18).text("Electro-Aid Weekly Invoice", { align: "center" });
        doc.moveDown();

        doc.text(`Week: ${week}`);
        doc.text(`Range: ${data.sunday.toDateString()} - ${data.saturday.toDateString()}`);
        doc.text(`Status: ${data.status}`);

        if(data.transactionCode){
            doc.text(`Transaction: ${data.transactionCode}`);
        }

        doc.moveDown();
        doc.text("Assignments:", { underline: true });

        data.assignments.forEach(a=>{
            doc.text(`${a.reference} | ${a.title || "-"} | USD ${a.payoutUSD} | KES ${a.payoutKES}`);
        });

        doc.moveDown();
        doc.text(`Total USD: ${data.totalUSD}`);
        doc.text(`Total KES: ${data.totalKES}`);

        doc.end();

    }catch(err){
        console.error(err);
        res.status(500).json({ message:"PDF generation failed" });
    }
};