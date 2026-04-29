const curriculum = [
  { quarter: "Quarter 1", courses: [["MATH 240", "Precalculus"], ["ENGR 120", "Engineering Problem Solving I"], ["CHEM 100", "Chemistry Fundamentals"], ["FYE 100", "First-Year Experience"], ["COMM 101", "Communication"]] },
  { quarter: "Quarter 2", courses: [["MATH 241", "Calculus I"], ["ENGR 121", "Engineering Problem Solving II"], ["CHEM 101", "General Chemistry I"], ["CHEM 103", "General Chemistry I Lab"], ["ENGL 101", "Composition I"]] },
  { quarter: "Quarter 3", courses: [["MATH 242", "Calculus II"], ["ENGR 122", "Engineering Problem Solving III"], ["PHYS 201", "Engineering Physics I"], ["CHEM 102", "General Chemistry II"]] },
  { quarter: "Quarter 4", courses: [["MATH 243", "Calculus III"], ["ENGR 220", "Statics"], ["MEMT 202", "Materials Science"], ["ENGL 102", "Composition II"]] },
  { quarter: "Quarter 5", courses: [["MATH 244", "Differential Equations"], ["ENGR 221", "Electrical Engineering & Circuits I"], ["MEMT 203", "Mechanics of Materials"], ["BISC 101", "Biological Science"]] },
  { quarter: "Quarter 6", courses: [["MATH 245", "Linear Algebra"], ["ENGR 222", "Thermodynamics"], ["PHYS 202", "Engineering Physics II"], ["MEMT 313", "Manufacturing Processes"]] },
  { quarter: "Quarter 7", courses: [["MEEN 360", "Fluid Mechanics"], ["MEEN 382", "Experimental Methods"], ["MEMT 212", "Materials Lab"], ["2 Social Sci", "Social Science Electives"]] },
  { quarter: "Quarter 8", courses: [["MATH 351", "Engineering Statistics"], ["MEEN 332", "Heat Transfer"], ["MEEN 363", "Mechanical Design I"], ["MEEN 321", "Dynamics & Vibrations"]] },
  { quarter: "Quarter 9", courses: [["INEN 300", "Engineering Economy"], ["MEEN 353", "Mechatronics"], ["MEEN 371", "Machine Design"], ["MEEN 361", "Kinematics"]] },
  { quarter: "Quarter 10", courses: [["INEN 406", "Senior Seminar"], ["MEEN 451", "Mechanical Design II"], ["MEEN 462", "Machine Element Design"], ["MEEN 480", "Senior Design I"]] },
  { quarter: "Quarter 11", courses: [["3 MEEN elect", "Mechanical Engineering Elective"], ["4 COES elect", "COES Technical Elective"], ["MEEN 481", "Senior Design II"], ["2.5 Hum-anity", "Humanities Elective"]] },
  { quarter: "Quarter 12", courses: [["3 MEEN elect", "Mechanical Engineering Elective"], ["4 COES elect", "COES Technical Elective"], ["MEEN 482", "Design Project Continuation"], ["ART 290", "Arts Elective"]] }
];

const STORAGE_KEY = "meen-advising-tracker-v1";
const app = { state: null, activeCourse: null, els: {} };

function makeId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `student-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function debug(message, extra = "") {
  if (!app.els.debugLog) return;
  const ts = new Date().toISOString();
  app.els.debugLog.textContent += `[${ts}] ${message}${extra ? ` | ${extra}` : ""}\n`;
  app.els.debugLog.scrollTop = app.els.debugLog.scrollHeight;
}

function createDefaultState() {
  const starterId = makeId();
  return { activeStudentId: starterId, students: { [starterId]: { id: starterId, name: "New Student", courses: {} } } };
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || !parsed.students || typeof parsed.students !== "object") return createDefaultState();

    const ids = Object.keys(parsed.students);
    if (!ids.length) return createDefaultState();

    ids.forEach((id) => {
      const student = parsed.students[id] || {};
      if (!student.id) student.id = id;
      if (!student.name) student.name = "Student";
      if (!student.courses || typeof student.courses !== "object") student.courses = {};
      parsed.students[id] = student;
    });

    const activeId = parsed.activeStudentId && parsed.students[parsed.activeStudentId] ? parsed.activeStudentId : ids[0];
    return { ...parsed, activeStudentId: activeId };
  } catch {
    return createDefaultState();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(app.state));
}

function getActiveStudent() {
  if (!app.state || !app.state.students) return null;
  return app.state.students[app.state.activeStudentId] || app.state.students[Object.keys(app.state.students)[0]] || null;
}

function renderStudentOptions() {
  app.els.studentSelect.innerHTML = "";
  Object.values(app.state.students).forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    opt.selected = s.id === app.state.activeStudentId;
    app.els.studentSelect.appendChild(opt);
  });
}

function renderCurriculum() {
  app.els.curriculumGrid.innerHTML = "";
  const template = app.els.courseCardTemplate;
  const active = getActiveStudent();

  if (!template || !template.content || !template.content.firstElementChild) {
    debug("Render blocked", "courseCardTemplate not found");
    return;
  }
  if (!active) {
    debug("Render blocked", "No active student");
    return;
  }

  curriculum.forEach((term) => {
    const section = document.createElement("section");
    section.className = "semester";
    section.innerHTML = `<h2>${term.quarter}</h2>`;

    term.courses.forEach(([code, name]) => {
      const node = template.content.firstElementChild.cloneNode(true);
      const key = `${term.quarter}:${code}`;
      const record = (active.courses && active.courses[key]) || {};
      node.querySelector(".course-code").textContent = code;
      node.querySelector(".course-name").textContent = name;
      node.querySelector(".course-grade").textContent = record.grade ? `Grade: ${record.grade}` : "Not Taken";
      if (record.grade) node.classList.add("graded");
      node.addEventListener("click", () => openGradeDialog(key, code, name));
      section.appendChild(node);
    });

    app.els.curriculumGrid.appendChild(section);
  });
  debug("Render complete", `quarters=${curriculum.length}`);
}

function openGradeDialog(key, code, name) {
  app.activeCourse = key;
  const student = getActiveStudent();
  if (!student) return;
  if (!student.courses || typeof student.courses !== "object") student.courses = {};
  const record = student.courses[key] || {};
  app.els.dialogCourseTitle.textContent = `${code} — ${name}`;
  app.els.gradeSelect.value = record.grade || "";
  app.els.courseNotes.value = record.notes || "";
  app.els.gradeDialog.showModal();
}

function wireEvents() {
  app.els.saveGradeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const student = getActiveStudent();
    if (!student || !app.activeCourse) return;
    if (!student.courses || typeof student.courses !== "object") student.courses = {};
    student.courses[app.activeCourse] = { grade: app.els.gradeSelect.value, notes: app.els.courseNotes.value.trim() };
    persist();
    renderCurriculum();
    app.els.gradeDialog.close();
  });

  app.els.addStudentBtn.addEventListener("click", () => {
    const name = app.els.newStudentName.value.trim();
    if (!name) return;
    const id = makeId();
    app.state.students[id] = { id, name, courses: {} };
    app.state.activeStudentId = id;
    app.els.newStudentName.value = "";
    persist();
    renderStudentOptions();
    renderCurriculum();
  });

  app.els.studentSelect.addEventListener("change", () => {
    app.state.activeStudentId = app.els.studentSelect.value;
    persist();
    renderCurriculum();
  });

  app.els.renameStudentBtn.addEventListener("click", () => {
    const active = getActiveStudent();
    if (!active) return;
    const name = prompt("Enter new student name", active.name);
    if (!name || !name.trim()) return;
    active.name = name.trim();
    persist();
    renderStudentOptions();
  });

  app.els.deleteStudentBtn.addEventListener("click", () => {
    if (Object.keys(app.state.students).length === 1) return alert("At least one student profile must remain.");
    const active = getActiveStudent();
    if (!active || !confirm(`Delete ${active.name}?`)) return;
    delete app.state.students[app.state.activeStudentId];
    app.state.activeStudentId = Object.keys(app.state.students)[0];
    persist();
    renderStudentOptions();
    renderCurriculum();
  });

  app.els.exportBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(app.state, null, 2)], { type: "application/json" }));
    a.download = "meen-advising-records.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  app.els.importInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!imported || !imported.students || typeof imported.students !== "object") return alert("Invalid file format");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
      app.state = loadState();
      persist();
      renderStudentOptions();
      renderCurriculum();
      debug("Import success", file.name);
    } catch (error) {
      alert("Could not import JSON file.");
      debug("Import failed", (error && error.message) || "unknown error");
    } finally {
      e.target.value = "";
    }
  });

  app.els.toggleDebugBtn.addEventListener("click", () => {
    app.els.debugPanel.hidden = !app.els.debugPanel.hidden;
  });
}

function init() {
  app.els = {
    studentSelect: document.getElementById("studentSelect"),
    newStudentName: document.getElementById("newStudentName"),
    curriculumGrid: document.getElementById("curriculumGrid"),
    gradeDialog: document.getElementById("gradeDialog"),
    dialogCourseTitle: document.getElementById("dialogCourseTitle"),
    gradeSelect: document.getElementById("gradeSelect"),
    courseNotes: document.getElementById("courseNotes"),
    saveGradeBtn: document.getElementById("saveGradeBtn"),
    addStudentBtn: document.getElementById("addStudentBtn"),
    renameStudentBtn: document.getElementById("renameStudentBtn"),
    deleteStudentBtn: document.getElementById("deleteStudentBtn"),
    exportBtn: document.getElementById("exportBtn"),
    importInput: document.getElementById("importInput"),
    courseCardTemplate: document.getElementById("courseCardTemplate"),
    debugPanel: document.getElementById("debugPanel"),
    debugLog: document.getElementById("debugLog"),
    toggleDebugBtn: document.getElementById("toggleDebugBtn")
  };

  app.state = loadState();
  wireEvents();
  renderStudentOptions();
  renderCurriculum();
  debug("Init complete", `students=${Object.keys(app.state.students).length}`);
}

function safeInit() {
  try {
    init();
  } catch (error) {
    console.error("Initialization failed", error);
    const grid = document.getElementById("curriculumGrid");
    if (grid) grid.innerHTML = `<p role="alert">Initialization failed. Open debug panel and browser console.</p>`;
    const debugLog = document.getElementById("debugLog");
    if (debugLog) debugLog.textContent = `Fatal init error: ${(error && error.message) || "unknown"}`;
    const debugPanel = document.getElementById("debugPanel");
    if (debugPanel) debugPanel.hidden = false;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", safeInit);
} else {
  safeInit();
}
