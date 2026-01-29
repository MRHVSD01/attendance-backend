module.exports = (row) => {
  const required = [
    "Subject Code",
    "Subject",
    "Subject Type",
    "Present",
    "OD",
    "Makeup",
    "Absent",
  ];

  for (let key of required) {
    if (!(key in row)) return false;
  }

  if (!["Lecture", "Lab"].includes(row["Subject Type"])) return false;
  return true;
};
