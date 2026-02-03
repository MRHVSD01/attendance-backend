const Attendance = require("../models/Attendance");
const csv = require("csv-parser");
const fs = require("fs");

// =======================
// UPLOAD / PASTE HANDLER
// =======================

exports.uploadAttendance = async (req, res) => {
  try {
    // clear previous records
    console.log("REQ BODY:", req.body);
    // await Attendance.deleteMany({});
    await Attendance.deleteMany({ sessionId });


    // =======================
    // PASTE TEXT MODE
    // =======================
    if (req.body.text && req.body.text.trim() !== "") {
      const raw = req.body.text.trim();
      const lines = raw.replace(/\r/g, "").split("\n");

      // find header row
      const headerIndex = lines.findIndex(
        (line) =>
          line.includes("Subject Code") &&
          line.includes("Present") &&
          line.includes("Absent")
      );

      if (headerIndex === -1) {
        return res.status(400).json({ error: "Invalid ERP attendance format" });
      }

      const dataLines = lines.slice(headerIndex + 1);

      for (const line of dataLines) {
        if (!line.trim()) continue;

        const cols = line.split("\t");
        if (cols.length < 9) continue;

        const attended = Number(cols[4]) + Number(cols[5]) + Number(cols[6]);
        const total = attended + Number(cols[7]);

        const percentage = Number(((attended / total) * 100).toFixed(2));

        let riskLevel = "GREEN";
        if (percentage < 65) riskLevel = "RED";
        else if (percentage < 75) riskLevel = "YELLOW";

        await Attendance.create({
          subjectCode: cols[1],
          subjectName: cols[2],
          subjectType: cols[3],

          attended,
          total,
          percentage,
          riskLevel,

          originalAttended: attended,
          originalTotal: total,
          originalPercentage: percentage,
          originalRiskLevel: riskLevel,
        });
      }

      return res.json({ success: true });
    }

    // =======================
    // FILE UPLOAD MODE (CSV)
    // =======================
    if (req.files && req.files.length > 0) {
      const filePath = req.files[0].path;

      const records = [];

      fs.createReadStream(filePath)
        .pipe(
          csv({
            separator: ",",
            skipLines: 1,
          })
        )
        .on("data", (row) => {
          const attended =
            Number(row.Present) + Number(row.OD) + Number(row.Makeup);
          const total = attended + Number(row.Absent);

          const percentage = Number(((attended / total) * 100).toFixed(2));

          let riskLevel = "GREEN";
          if (percentage < 65) riskLevel = "RED";
          else if (percentage < 75) riskLevel = "YELLOW";

          records.push({
            subjectCode: row["Subject Code"],
            subjectName: row.Subject,
            subjectType: row["Subject Type"],
            attended,
            total,
            percentage,
            riskLevel,
          });
        })
        .on("end", async () => {
          await Attendance.insertMany(records);
          fs.unlinkSync(filePath);
          res.json({ success: true });
        });

      return;
    }

    return res.status(400).json({ error: "No input provided" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


// =======================
// GET ATTENDANCE
// =======================
exports.getAttendance = async (req, res) => {

  const sessionId = req.body.sessionId || req.query.sessionId;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID missing" });
  }

  const data = await Attendance.find({ sessionId });

  const priority = { RED: 1, YELLOW: 2, GREEN: 3 };

  data.sort((a, b) => {
    if (priority[a.riskLevel] !== priority[b.riskLevel]) {
      return priority[a.riskLevel] - priority[b.riskLevel];
    }
    return a.percentage - b.percentage;
  });

  res.json(data);
};


// =======================
// SIMULATE ATTEND
// =======================
exports.simulateAttend = async (req, res) => {
  const { id } = req.body;

  const sessionId = req.body.sessionId || req.query.sessionId;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID missing" });
  }

  const s = await Attendance.find({ sessionId });

  if (!s) return res.status(404).json({ error: "Subject not found" });

  s.attended += 1;
  s.total += 1;
  s.percentage = Number(((s.attended / s.total) * 100).toFixed(2));

  if (s.percentage < 65) s.riskLevel = "RED";
  else if (s.percentage < 75) s.riskLevel = "YELLOW";
  else s.riskLevel = "GREEN";

  await s.save();
  res.json(s);
};


// =======================
// SIMULATE MISS
// =======================
exports.simulateMiss = async (req, res) => {
  const { id } = req.body;

  const sessionId = req.body.sessionId || req.query.sessionId;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID missing" });
  }

  const s = await Attendance.find({ sessionId });

  if (!s) return res.status(404).json({ error: "Subject not found" });

  s.total += 1;
  s.percentage = Number(((s.attended / s.total) * 100).toFixed(2));

  if (s.percentage < 65) s.riskLevel = "RED";
  else if (s.percentage < 75) s.riskLevel = "YELLOW";
  else s.riskLevel = "GREEN";

  await s.save();
  res.json(s);
};


// =======================
// TARGET PLANNING
// =======================
exports.targetPlan = async (req, res) => {
  const { id, target } = req.body;
  
  const sessionId = req.body.sessionId || req.query.sessionId;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID missing" });
  }

  const s = await Attendance.find({ sessionId });

  if (target >= 100) {
    return res.json({ result: "Not achievable" });
  }

  if (s.percentage >= target) {
    return res.json({ result: 0 });
  }

  const k = Math.ceil((target * s.total - 100 * s.attended) / (100 - target));

  res.json({ result: k });
};


// =======================
// AGGREGATE ATTENDANCE
// =======================
exports.getAggregateAttendance = async (req, res) => {
  const sessionId = req.body.sessionId || req.query.sessionId;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID missing" });
  }

  const records = await Attendance.find({ sessionId });

  let totalAttended = 0;
  let totalClasses = 0;

  records.forEach((r) => {
    totalAttended += r.attended;
    totalClasses += r.total;
  });

  const percentage =
    totalClasses === 0
      ? 0
      : Number(((totalAttended / totalClasses) * 100).toFixed(2));

  let riskLevel = "GREEN";
  if (percentage < 65) riskLevel = "RED";
  else if (percentage < 75) riskLevel = "YELLOW";

  res.json({
    totalAttended,
    totalClasses,
    percentage,
    riskLevel,
  });
};


// =======================
// AGGREGATE TARGET PLAN (ADVANCED)
// =======================
exports.aggregateTargetPlan = async (req, res) => {
  const { target } = req.body;

  if (target >= 100) {
    return res.json({ type: "invalid", result: "Not achievable" });
  }

  const sessionId = req.body.sessionId || req.query.sessionId;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID missing" });
  }

  const records = await Attendance.find({ sessionId });

  let A = 0;
  let T = 0;

  records.forEach((r) => {
    A += r.attended;
    T += r.total;
  });

  const currentPercent = Number(((A / T) * 100).toFixed(2));

  // CASE 1: Need to ATTEND more
  if (currentPercent < target) {
    const k = Math.ceil((target * T - 100 * A) / (100 - target));

    return res.json({
      type: "attend",
      value: k,
      currentPercent,
    });
  }

  // CASE 2: Can MISS safely
  const m = Math.floor((100 * A - target * T) / target);

  return res.json({
    type: "miss",
    value: m < 0 ? 0 : m,
    currentPercent,
  });
};


// =======================
// RESET ATTENDANCE
// =======================
exports.resetAttendance = async (req, res) => {

  const sessionId = req.body.sessionId || req.query.sessionId;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID missing" });
  }

  const records = await Attendance.find({ sessionId });

  for (const r of records) {
    r.attended = r.originalAttended;
    r.total = r.originalTotal;
    r.percentage = r.originalPercentage;
    r.riskLevel = r.originalRiskLevel;
    await r.save();
  }

  res.json({ success: true });
};

// =======================
// SUBJECT SAFE MISS
// =======================
exports.getSafeMissPerSubject = async (req, res) => {

  const sessionId = req.body.sessionId || req.query.sessionId;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID missing" });
  }

  const records = await Attendance.find({ sessionId });

  const result = records.map(s => {
    const A = s.attended;
    const T = s.total;
    const minPercent = 75;

    let m = Math.floor((100 * A - minPercent * T) / minPercent);
    if (m < 0) m = 0;

    return {
      _id: s._id,
      safeMiss: m
    };
  });

  res.json(result);
};
