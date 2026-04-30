const curriculum = [
  { quarter: 1, courses: [["MATH 240", "Precalculus", 5], ["ENGR 120", "Engineering Problem Solving I", 2], ["CHEM 100", "Chemistry Fundamentals", 3], ["FYE 100", "First-Year Experience", 1], ["COMM 101", "Communication", 3]] },
  { quarter: 2, courses: [["MATH 241", "Calculus I", 5], ["ENGR 121", "Engineering Problem Solving II", 2], ["CHEM 101", "General Chemistry I", 3], ["CHEM 103", "General Chemistry I Lab", 1], ["ENGL 101", "Composition I", 3]] },
  { quarter: 3, courses: [["MATH 242", "Calculus II", 5], ["ENGR 122", "Engineering Problem Solving III", 2], ["PHYS 201", "Engineering Physics I", 3], ["CHEM 102", "General Chemistry II", 3]] },
  { quarter: 4, courses: [] },
  { quarter: 5, courses: [["MATH 243", "Calculus III", 5], ["ENGR 220", "Statics", 3], ["MEMT 202", "Materials Science", 3], ["ENGL 102", "Composition II", 3]] },
  { quarter: 6, courses: [["MATH 244", "Differential Equations", 3], ["ENGR 221", "Electrical Engineering & Circuits I", 3], ["MEMT 203", "Mechanics of Materials", 3], ["BISC 101", "Biological Science", 3]] },
  { quarter: 7, courses: [["MATH 245", "Linear Algebra", 3], ["ENGR 222", "Thermodynamics", 3], ["PHYS 202", "Engineering Physics II", 3], ["MEMT 313", "Manufacturing Processes", 3]] },
  { quarter: 8, courses: [] },
  { quarter: 9, courses: [["MEEN 360", "Fluid Mechanics", 3], ["MEEN 382", "Experimental Methods", 3], ["MEMT 212", "Materials Lab", 1], ["2 Social Sci", "Social Science Electives", 2]] },
  { quarter: 10, courses: [["MATH 351", "Engineering Statistics", 3], ["MEEN 332", "Heat Transfer", 3], ["MEEN 363", "Mechanical Design I", 3], ["MEEN 321", "Dynamics & Vibrations", 3]] },
  { quarter: 11, courses: [["INEN 300", "Engineering Economy", 3], ["MEEN 353", "Mechatronics", 3], ["MEEN 371", "Machine Design", 3], ["MEEN 361", "Kinematics", 3]] },
  { quarter: 12, courses: [] }
];
const seasons = ["Fall", "Winter", "Spring", "Summer"];
const gradeOptions = ["A", "B", "C", "D", "F", "W", "I", "ENR"];
const gradePoints = { A: 4, B: 3, C: 2, D: 1, F: 0 };
const STORAGE_KEY = "meen-advising-tracker-v1";
const app = { state: null, els: {} };

const makeId = () => (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `student-${Date.now()}`;
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(app.state));
const getActiveStudent = () => app.state.students[app.state.activeStudentId] || app.state.students[Object.keys(app.state.students)[0]];
const isPassing = (g) => ["A", "B", "C", "D"].includes(g);
const isPrereqEligible = (g) => ["A", "B", "C", "D", "ENR"].includes(g);

function createDefaultState() { const id = makeId(); return { activeStudentId: id, yearCount: 4, curriculumRules: {}, students: { [id]: { id, name: "New Student", courses: {}, placements: {}, repeats: {} } } }; }
function loadState() { try { const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); if (!p || !p.students) return createDefaultState(); if (!p.yearCount || p.yearCount < 4) p.yearCount = 4; if (!p.curriculumRules || typeof p.curriculumRules !== "object") p.curriculumRules = {}; Object.values(p.students).forEach((st) => { if (!st.placements) st.placements = {}; if (!st.repeats) st.repeats = {}; if (!st.courses) st.courses = {}; }); return p; } catch { return createDefaultState(); } }

function calculateGpa(student) {
  let pts = 0, hrs = 0;
  curriculum.forEach((q) => q.courses.forEach(([code, , ch]) => {
    const grade = (student.courses[`Q${q.quarter}:${code}`] || {}).grade;
    if (grade in gradePoints) { pts += gradePoints[grade] * ch; hrs += ch; }
  }));
  return hrs ? (pts / hrs).toFixed(2) : "--";
}


function attemptedHoursForQuarter(student, quarterNumber) {
  let attempted = 0;
  getQuarterItems(student, quarterNumber).forEach((item) => {
    const rec = student.courses[item.key] || {};
    if (rec.grade) attempted += Number(item.credits) || 0;
  });
  return attempted;
}


function hasPassingGradeForCode(student, courseCode) {
  return Object.entries(student.courses || {}).some(([key, rec]) => key.endsWith(`:${courseCode}`) && isPrereqEligible(rec.grade));
}

function prereqsMet(student, rule) {
  if (!rule || !rule.prereq) return true;
  const required = rule.prereq.split(",").map((v) => v.trim()).filter(Boolean);
  if (!required.length) return true;
  return required.every((code) => hasPassingGradeForCode(student, code));
}


function coreqsMet(student, rule) {
  if (!rule || !rule.coreq) return true;
  const required = rule.coreq.split(",").map((v) => v.trim()).filter(Boolean);
  if (!required.length) return true;
  return required.every((code) => hasPassingGradeForCode(student, code));
}

function requirementsMet(student, rule) {
  return prereqsMet(student, rule) && coreqsMet(student, rule);
}

function getQuarterItems(student, quarterNumber) {
  const items = [];
  curriculum.forEach((q) => q.courses.forEach(([code, name, credits]) => {
    const baseKey = `Q${q.quarter}:${code}`;
    const assigned = Number(student.placements[baseKey] || q.quarter);
    if (assigned === quarterNumber) items.push({ key: baseKey, ruleKey: baseKey, code, name, credits });
  }));
  Object.entries(student.repeats || {}).forEach(([repeatKey, r]) => {
    const assigned = Number(student.placements[repeatKey] || r.quarter || quarterNumber);
    if (assigned === quarterNumber) items.push({ key: repeatKey, ruleKey: r.originKey || repeatKey, code: r.code, name: `${r.name} (Repeat)`, credits: r.credits });
  });
  return items;
}

function renderStudentOptions() {
  app.els.studentSelect.innerHTML = "";
  Object.values(app.state.students).forEach((s) => {
    const opt = document.createElement("option"); opt.value = s.id; opt.textContent = s.name; opt.selected = s.id === app.state.activeStudentId; app.els.studentSelect.appendChild(opt);
  });
}

function renderCurriculum() {
  const student = getActiveStudent();
  app.els.curriculumGrid.innerHTML = "";

  for (let year = 0; year < app.state.yearCount; year++) {
    const row = document.createElement("section");
    row.className = "year-row";
    row.innerHTML = `<h2>Year ${year + 1}</h2>`;

    const quarterGrid = document.createElement("div");
    quarterGrid.className = "year-quarter-grid";

    for (let seasonIdx = 0; seasonIdx < 4; seasonIdx++) {
      const quarterNumber = year * 4 + seasonIdx + 1;
      const quarterData = curriculum.find((q) => q.quarter === quarterNumber) || { quarter: quarterNumber, courses: [] };

      const quarterBlock = document.createElement("div");
      quarterBlock.className = "quarter-block";
      quarterBlock.addEventListener("dragover", (ev) => ev.preventDefault());
      quarterBlock.addEventListener("drop", (ev) => {
        ev.preventDefault();
        const courseKey = ev.dataTransfer.getData("text/course-key");
        if (!courseKey) return;
        student.placements[courseKey] = quarterNumber;
        if (student.repeats[courseKey]) student.repeats[courseKey].quarter = quarterNumber;
        persist();
        renderCurriculum();
      });
      const attempted = attemptedHoursForQuarter(student, quarterNumber);
      quarterBlock.innerHTML = `<h3>${seasons[seasonIdx]} (Q${quarterNumber}) <span class="attempted-hours">Attempted: ${attempted} hrs</span></h3>`;

      const quarterItems = getQuarterItems(student, quarterNumber);
      if (!quarterItems.length) {
        quarterBlock.innerHTML += `<p class="empty-quarter">No scheduled courses</p>`;
      } else {
        quarterItems.forEach(({ key, ruleKey, code, name, credits }) => {
          const rec = student.courses[key] || {};
          const rule = app.state.curriculumRules[ruleKey] || {};
          const prereqOk = requirementsMet(student, rule);
          const card = document.createElement("article");
          card.draggable = true;
          card.dataset.courseKey = key;
          card.addEventListener("dragstart", (ev) => ev.dataTransfer.setData("text/course-key", key));
          card.className = `course-card ${isPassing(rec.grade) ? "complete" : ""} ${prereqOk ? "" : "locked"}`;
          card.innerHTML = `
            <div class="course-code">${code}</div>
            <div class="course-name">${name} (${credits} cr)</div>
            <div class="course-grade">Grade: ${rec.grade || "Not Taken"}</div>
            <div class="course-reqs">Pre-req: ${rule.prereq || "—"} | Co-req: ${rule.coreq || "—"}</div>
            ${prereqOk ? "" : `<div class="prereq-warning">Prerequisites not yet met</div>`}
            <div class="grade-buttons" data-key="${key}"></div>
            <button type="button" class="repeat-btn">Copy to Later Quarter</button>
          `;

          const buttonWrap = card.querySelector(".grade-buttons");
          const reqBtn = document.createElement("button");
          reqBtn.type = "button";
          reqBtn.className = "req-btn";
          reqBtn.textContent = "Reqs";
          reqBtn.addEventListener("click", () => {
            const current = app.state.curriculumRules[key] || {};
            const prereq = prompt("Global pre-requisite courses (comma-separated)", current.prereq || "") || "";
            const coreq = prompt("Global co-requisite courses (comma-separated)", current.coreq || "") || "";
            app.state.curriculumRules[key] = { prereq: prereq.trim(), coreq: coreq.trim() };
            persist();
            renderCurriculum();
            renderCurriculumRules();
          });
          buttonWrap.appendChild(reqBtn);
          gradeOptions.forEach((grade) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = `grade-btn ${rec.grade === grade ? "selected" : ""}`;
            b.textContent = grade;
            b.addEventListener("click", () => {
              if (!prereqOk) return;
              const current = student.courses[key] || {};
              const nextGrade = current.grade === grade ? "" : grade;
              student.courses[key] = { ...current, grade: nextGrade };
              persist();
              renderCurriculum();
              renderCurriculumRules();
            });
            buttonWrap.appendChild(b);
          });
          const repeatBtn = card.querySelector(".repeat-btn");
          repeatBtn.addEventListener("click", () => {
            const target = Number(prompt("Copy to which quarter number?", String(quarterNumber + 1)));
            if (!target || target <= quarterNumber) return;
            const repeatId = `${key}:R${Date.now()}`;
            student.repeats[repeatId] = { originKey: ruleKey, code, name: name.replace(" (Repeat)", ""), credits, quarter: target };
            student.placements[repeatId] = target;
            persist();
            renderCurriculum();
          });
          quarterBlock.appendChild(card);
        });
      }
      quarterGrid.appendChild(quarterBlock);
    }

    row.appendChild(quarterGrid);
    app.els.curriculumGrid.appendChild(row);
  }
  app.els.gpaValue.textContent = calculateGpa(student);
}


function renderCurriculumRules() {
  if (!app.els.rulesGrid) return;
  app.els.rulesGrid.innerHTML = "";
  curriculum.forEach((q) => q.courses.forEach(([code, name]) => {
    const key = `Q${q.quarter}:${code}`;
    const rules = app.state.curriculumRules[key] || {};
    const row = document.createElement("div");
    row.className = "rule-row";
    row.innerHTML = `<strong>${code}</strong> <span>${name}</span><div>Pre: ${rules.prereq || "—"}</div><div>Co: ${rules.coreq || "—"}</div>`;
    app.els.rulesGrid.appendChild(row);
  }));
}

function init() {
  app.els = {
    studentSelect: document.getElementById("studentSelect"), newStudentName: document.getElementById("newStudentName"), curriculumGrid: document.getElementById("curriculumGrid"), addStudentBtn: document.getElementById("addStudentBtn"), renameStudentBtn: document.getElementById("renameStudentBtn"), deleteStudentBtn: document.getElementById("deleteStudentBtn"), exportBtn: document.getElementById("exportBtn"), importInput: document.getElementById("importInput"), gpaValue: document.getElementById("gpaValue"), toggleDebugBtn: document.getElementById("toggleDebugBtn"), debugPanel: document.getElementById("debugPanel"), addYearBtn: document.getElementById("addYearBtn"), rulesGrid: document.getElementById("rulesGrid"), toggleRulesBtn: document.getElementById("toggleRulesBtn"), rulesPanel: document.getElementById("rulesPanel")
  };
  app.state = loadState();

  app.els.addStudentBtn.addEventListener("click", () => { const name = app.els.newStudentName.value.trim(); if (!name) return; const id = makeId(); app.state.students[id] = { id, name, courses: {}, placements: {}, repeats: {} }; app.state.activeStudentId = id; app.els.newStudentName.value = ""; persist(); renderStudentOptions(); renderCurriculum(); });
  app.els.studentSelect.addEventListener("change", () => { app.state.activeStudentId = app.els.studentSelect.value; persist(); renderCurriculum(); });
  app.els.renameStudentBtn.addEventListener("click", () => { const s = getActiveStudent(); const name = prompt("Enter new student name", s.name); if (!name || !name.trim()) return; s.name = name.trim(); persist(); renderStudentOptions(); });
  app.els.deleteStudentBtn.addEventListener("click", () => { if (Object.keys(app.state.students).length === 1) return alert("At least one student profile must remain."); if (!confirm(`Delete ${getActiveStudent().name}?`)) return; delete app.state.students[app.state.activeStudentId]; app.state.activeStudentId = Object.keys(app.state.students)[0]; persist(); renderStudentOptions(); renderCurriculum(); });
  app.els.exportBtn.addEventListener("click", () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(app.state, null, 2)], { type: "application/json" })); a.download = "meen-advising-records.json"; a.click(); URL.revokeObjectURL(a.href); });
  app.els.importInput.addEventListener("change", async (e) => { const file = e.target.files[0]; if (!file) return; try { app.state = JSON.parse(await file.text()); persist(); renderStudentOptions(); renderCurriculum(); } catch { alert("Could not import JSON file."); } finally { e.target.value = ""; } });
  app.els.toggleDebugBtn.addEventListener("click", () => { app.els.debugPanel.style.display = app.els.debugPanel.style.display === "none" ? "block" : "none"; });
  app.els.addYearBtn.addEventListener("click", () => { app.state.yearCount += 1; persist(); renderCurriculum(); });
  app.els.toggleRulesBtn.addEventListener("click", () => { app.els.rulesPanel.style.display = app.els.rulesPanel.style.display === "none" ? "block" : "none"; });

  renderStudentOptions();
  renderCurriculum();
  renderCurriculumRules();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
