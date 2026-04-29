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
const studentSelect = document.getElementById("studentSelect");
const newStudentName = document.getElementById("newStudentName");
const curriculumGrid = document.getElementById("curriculumGrid");
const gradeDialog = document.getElementById("gradeDialog");
const dialogCourseTitle = document.getElementById("dialogCourseTitle");
const gradeSelect = document.getElementById("gradeSelect");
const courseNotes = document.getElementById("courseNotes");

let state = loadState();
let activeCourse = null;
function makeId() {
  return globalThis.crypto?.randomUUID?.() || `student-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

renderStudentOptions();
renderCurriculum();

function createDefaultState() {
  const starterId = makeId();
  return { activeStudentId: starterId, students: { [starterId]: { id: starterId, name: "New Student", courses: {} } } };
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed?.students || typeof parsed.students !== "object") return createDefaultState();
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
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const getActiveStudent = () => state.students[state.activeStudentId] || state.students[Object.keys(state.students)[0]];

function renderStudentOptions() {
  studentSelect.innerHTML = "";
  Object.values(state.students).forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    opt.selected = s.id === state.activeStudentId;
    studentSelect.appendChild(opt);
  });
}

function renderCurriculum() {
  curriculumGrid.innerHTML = "";
  const template = document.getElementById("courseCardTemplate");
  const active = getActiveStudent();
  if (!active || !template?.content?.firstElementChild) return;
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
    curriculumGrid.appendChild(section);
  });
}

function openGradeDialog(key, code, name) {
  activeCourse = key;
  const student = getActiveStudent();
  if (!student.courses || typeof student.courses !== "object") student.courses = {};
  const record = student.courses[key] || {};
  dialogCourseTitle.textContent = `${code} — ${name}`;
  gradeSelect.value = record.grade || "";
  courseNotes.value = record.notes || "";
  gradeDialog.showModal();
}

document.getElementById("saveGradeBtn").addEventListener("click", (e) => {
  e.preventDefault();
  if (!activeCourse) return;
  const student = getActiveStudent();
  if (!student.courses || typeof student.courses !== "object") student.courses = {};
  student.courses[activeCourse] = { grade: gradeSelect.value, notes: courseNotes.value.trim() };
  persist();
  renderCurriculum();
  gradeDialog.close();
});

document.getElementById("addStudentBtn").addEventListener("click", () => {
  const name = newStudentName.value.trim(); if (!name) return;
  const id = makeId();
  state.students[id] = { id, name, courses: {} }; state.activeStudentId = id; newStudentName.value = "";
  persist(); renderStudentOptions(); renderCurriculum();
});
studentSelect.addEventListener("change", () => { state.activeStudentId = studentSelect.value; persist(); renderCurriculum(); });
document.getElementById("renameStudentBtn").addEventListener("click", () => {
  const name = prompt("Enter new student name", getActiveStudent().name);
  if (!name) return; getActiveStudent().name = name.trim(); persist(); renderStudentOptions();
});
document.getElementById("deleteStudentBtn").addEventListener("click", () => {
  if (Object.keys(state.students).length === 1) return alert("At least one student profile must remain.");
  if (!confirm(`Delete ${getActiveStudent().name}?`)) return;
  delete state.students[state.activeStudentId]; state.activeStudentId = Object.keys(state.students)[0];
  persist(); renderStudentOptions(); renderCurriculum();
});
document.getElementById("exportBtn").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
  a.download = "meen-advising-records.json"; a.click(); URL.revokeObjectURL(a.href);
});
document.getElementById("importInput").addEventListener("change", async (e) => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!imported?.students || typeof imported.students !== "object") return alert("Invalid file format");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
    state = loadState();
    persist(); renderStudentOptions(); renderCurriculum();
  } catch {
    alert("Could not import JSON file");
  } finally {
    e.target.value = "";
  }
});
