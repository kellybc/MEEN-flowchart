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

const STORAGE_KEY = "meen-advising-tracker-v1";
const app = { state: null, activeCourse: null, els: {} };
const seasons = ["Fall", "Winter", "Spring", "Summer"];
const gradePoints = { A: 4, B: 3, C: 2, D: 1, F: 0 };

function makeId() { return (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") ? globalThis.crypto.randomUUID() : `student-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function debug(message) { if (app.els.debugLog) app.els.debugLog.textContent += `${message}\n`; }
function createDefaultState() { const id = makeId(); return { activeStudentId: id, students: { [id]: { id, name: "New Student", courses: {} } } }; }

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || !parsed.students || typeof parsed.students !== "object") return createDefaultState();
    const ids = Object.keys(parsed.students); if (!ids.length) return createDefaultState();
    ids.forEach((id) => { const s = parsed.students[id] || {}; if (!s.id) s.id = id; if (!s.name) s.name = "Student"; if (!s.courses || typeof s.courses !== "object") s.courses = {}; parsed.students[id] = s; });
    const active = parsed.students[parsed.activeStudentId] ? parsed.activeStudentId : ids[0];
    return { ...parsed, activeStudentId: active };
  } catch { return createDefaultState(); }
}

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(app.state)); }
function getActiveStudent() { return app.state.students[app.state.activeStudentId] || app.state.students[Object.keys(app.state.students)[0]]; }
function isPassing(g) { return ["A", "B", "C", "D", "P"].includes(g); }

function calculateGpa(student) {
  let pts = 0, hrs = 0;
  curriculum.forEach((q) => q.courses.forEach(([code, , ch]) => {
    const key = `Q${q.quarter}:${code}`;
    const grade = student.courses[key] && student.courses[key].grade;
    if (grade in gradePoints) { pts += gradePoints[grade] * ch; hrs += ch; }
  }));
  return hrs ? (pts / hrs).toFixed(2) : "--";
}

function renderStudentOptions() {
  app.els.studentSelect.innerHTML = "";
  Object.values(app.state.students).forEach((s) => {
    const opt = document.createElement("option"); opt.value = s.id; opt.textContent = s.name; opt.selected = s.id === app.state.activeStudentId; app.els.studentSelect.appendChild(opt);
  });
}

function renderCurriculum() {
  app.els.curriculumGrid.innerHTML = "";
  const template = app.els.courseCardTemplate;
  const student = getActiveStudent();
  if (!template || !student) return;

  seasons.forEach((season, idx) => {
    const column = document.createElement("section");
    column.className = "season-column";
    column.innerHTML = `<h2>${season}</h2>`;

    curriculum.filter((q) => (q.quarter - 1) % 4 === idx).forEach((q) => {
      const block = document.createElement("div");
      block.className = "quarter-block";
      block.innerHTML = `<h3>Quarter ${q.quarter}</h3>`;

      if (!q.courses.length) {
        const empty = document.createElement("p"); empty.className = "empty-quarter"; empty.textContent = "No scheduled courses"; block.appendChild(empty);
      }

      q.courses.forEach(([code, name, credits]) => {
        const node = template.content.firstElementChild.cloneNode(true);
        const key = `Q${q.quarter}:${code}`;
        const rec = student.courses[key] || {};
        node.querySelector(".course-code").textContent = code;
        node.querySelector(".course-name").textContent = `${name} (${credits} cr)`;
        node.querySelector(".course-grade").textContent = rec.grade ? `Grade: ${rec.grade}` : "Not Taken";
        if (isPassing(rec.grade)) node.classList.add("complete");
        else if (rec.grade) node.classList.add("graded");
        node.addEventListener("click", () => openGradeDialog(key, code, name));
        block.appendChild(node);
      });

      column.appendChild(block);
    });

    app.els.curriculumGrid.appendChild(column);
  });

  app.els.gpaValue.textContent = calculateGpa(student);
}

function openGradeDialog(key, code, name) {
  app.activeCourse = key;
  const s = getActiveStudent(); const rec = s.courses[key] || {};
  app.els.dialogCourseTitle.textContent = `${code} — ${name}`;
  app.els.gradeSelect.value = rec.grade || "";
  app.els.courseNotes.value = rec.notes || "";
  app.els.gradeDialog.showModal();
}

function wireEvents() {
  app.els.saveGradeBtn.addEventListener("click", (e) => { e.preventDefault(); const s = getActiveStudent(); if (!app.activeCourse) return; s.courses[app.activeCourse] = { grade: app.els.gradeSelect.value, notes: app.els.courseNotes.value.trim() }; persist(); renderCurriculum(); app.els.gradeDialog.close(); });
  app.els.addStudentBtn.addEventListener("click", () => { const name = app.els.newStudentName.value.trim(); if (!name) return; const id = makeId(); app.state.students[id] = { id, name, courses: {} }; app.state.activeStudentId = id; app.els.newStudentName.value = ""; persist(); renderStudentOptions(); renderCurriculum(); });
  app.els.studentSelect.addEventListener("change", () => { app.state.activeStudentId = app.els.studentSelect.value; persist(); renderCurriculum(); });
  app.els.renameStudentBtn.addEventListener("click", () => { const s = getActiveStudent(); const n = prompt("Enter new student name", s.name); if (!n || !n.trim()) return; s.name = n.trim(); persist(); renderStudentOptions(); });
  app.els.deleteStudentBtn.addEventListener("click", () => { if (Object.keys(app.state.students).length === 1) return alert("At least one student profile must remain."); if (!confirm(`Delete ${getActiveStudent().name}?`)) return; delete app.state.students[app.state.activeStudentId]; app.state.activeStudentId = Object.keys(app.state.students)[0]; persist(); renderStudentOptions(); renderCurriculum(); });
  app.els.exportBtn.addEventListener("click", () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(app.state, null, 2)], { type: "application/json" })); a.download = "meen-advising-records.json"; a.click(); URL.revokeObjectURL(a.href); });
  app.els.importInput.addEventListener("change", async (e) => { const file = e.target.files[0]; if (!file) return; try { const imported = JSON.parse(await file.text()); if (!imported || !imported.students) return alert("Invalid file format"); localStorage.setItem(STORAGE_KEY, JSON.stringify(imported)); app.state = loadState(); persist(); renderStudentOptions(); renderCurriculum(); } catch { alert("Could not import JSON file."); } finally { e.target.value = ""; } });
  app.els.toggleDebugBtn.addEventListener("click", () => { app.els.debugPanel.style.display = app.els.debugPanel.style.display === "none" ? "block" : "none"; });
}

function init() {
  app.els = {
    studentSelect: document.getElementById("studentSelect"), newStudentName: document.getElementById("newStudentName"), curriculumGrid: document.getElementById("curriculumGrid"), gradeDialog: document.getElementById("gradeDialog"), dialogCourseTitle: document.getElementById("dialogCourseTitle"), gradeSelect: document.getElementById("gradeSelect"), courseNotes: document.getElementById("courseNotes"), saveGradeBtn: document.getElementById("saveGradeBtn"), addStudentBtn: document.getElementById("addStudentBtn"), renameStudentBtn: document.getElementById("renameStudentBtn"), deleteStudentBtn: document.getElementById("deleteStudentBtn"), exportBtn: document.getElementById("exportBtn"), importInput: document.getElementById("importInput"), courseCardTemplate: document.getElementById("courseCardTemplate"), debugPanel: document.getElementById("debugPanel"), debugLog: document.getElementById("debugLog"), toggleDebugBtn: document.getElementById("toggleDebugBtn"), gpaValue: document.getElementById("gpaValue")
  };
  app.state = loadState(); wireEvents(); renderStudentOptions(); renderCurriculum(); debug("Init complete");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
