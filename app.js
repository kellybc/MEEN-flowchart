const curriculum = [
  { semester: "Freshman 1", courses: [["MATH 240", "Calculus I"], ["ENGR 120", "Engineering Problem Solving"], ["CHEM 100", "Chemistry Fundamentals"], ["COMM 101", "Communication"]] },
  { semester: "Freshman 2", courses: [["MATH 241", "Calculus II"], ["ENGR 121", "Engineering Graphics"], ["CHEM 101", "General Chemistry I"], ["ENGL 101", "Composition I"]] },
  { semester: "Sophomore 1", courses: [["MATH 243", "Calculus III"], ["ENGR 220", "Statics"], ["PHYS 201", "Engineering Physics I"], ["MEMT 202", "Materials"]] },
  { semester: "Sophomore 2", courses: [["MATH 244", "Differential Equations"], ["ENGR 221", "Dynamics"], ["PHYS 202", "Engineering Physics II"], ["MEMT 203", "Mechanics of Materials"]] },
  { semester: "Junior 1", courses: [["MATH 245", "Linear Algebra"], ["ENGR 222", "Thermodynamics"], ["MEEN 360", "Fluid Mechanics"], ["MEEN 363", "Mechanical Design I"]] },
  { semester: "Junior 2", courses: [["MATH 351", "Statistics"], ["MEMT 313", "Manufacturing"], ["MEEN 332", "Heat Transfer"], ["MEEN 371", "Machine Design"]] },
  { semester: "Senior 1", courses: [["INEN 300", "Engineering Economy"], ["MEEN 353", "Mechatronics"], ["MEEN 451", "Mechanical Design II"], ["MEEN 480", "Capstone I"]] },
  { semester: "Senior 2", courses: [["INEN 406", "Senior Seminar"], ["MEEN 462", "Controls"], ["MEEN 481", "Capstone II"], ["MEEN Elective", "Technical Elective"]] },
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

renderStudentOptions();
renderCurriculum();

function loadState() {
  const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (parsed?.students && parsed.activeStudentId) return parsed;
  const starterId = crypto.randomUUID();
  return {
    activeStudentId: starterId,
    students: {
      [starterId]: { id: starterId, name: "New Student", courses: {} }
    }
  };
}

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function getActiveStudent() { return state.students[state.activeStudentId]; }

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

  curriculum.forEach((sem) => {
    const section = document.createElement("section");
    section.className = "semester";
    section.innerHTML = `<h2>${sem.semester}</h2>`;

    sem.courses.forEach(([code, name]) => {
      const key = code;
      const node = template.content.firstElementChild.cloneNode(true);
      const record = active.courses[key] || {};
      node.dataset.course = key;
      node.querySelector(".course-code").textContent = code;
      node.querySelector(".course-name").textContent = name;
      node.querySelector(".course-grade").textContent = record.grade ? `Grade: ${record.grade}` : "Not Taken";
      if (record.grade) node.classList.add("graded");
      node.addEventListener("click", () => openGradeDialog(code, name));
      section.appendChild(node);
    });

    curriculumGrid.appendChild(section);
  });
}

function openGradeDialog(code, name) {
  activeCourse = code;
  const record = getActiveStudent().courses[code] || {};
  dialogCourseTitle.textContent = `${code} — ${name}`;
  gradeSelect.value = record.grade || "";
  courseNotes.value = record.notes || "";
  gradeDialog.showModal();
}

document.getElementById("saveGradeBtn").addEventListener("click", (e) => {
  e.preventDefault();
  if (!activeCourse) return;
  const student = getActiveStudent();
  student.courses[activeCourse] = { grade: gradeSelect.value, notes: courseNotes.value.trim() };
  persist();
  renderCurriculum();
  gradeDialog.close();
});

document.getElementById("addStudentBtn").addEventListener("click", () => {
  const name = newStudentName.value.trim();
  if (!name) return;
  const id = crypto.randomUUID();
  state.students[id] = { id, name, courses: {} };
  state.activeStudentId = id;
  newStudentName.value = "";
  persist();
  renderStudentOptions();
  renderCurriculum();
});

studentSelect.addEventListener("change", () => {
  state.activeStudentId = studentSelect.value;
  persist();
  renderCurriculum();
});

document.getElementById("renameStudentBtn").addEventListener("click", () => {
  const name = prompt("Enter new student name", getActiveStudent().name);
  if (!name) return;
  getActiveStudent().name = name.trim();
  persist();
  renderStudentOptions();
});

document.getElementById("deleteStudentBtn").addEventListener("click", () => {
  const ids = Object.keys(state.students);
  if (ids.length === 1) return alert("At least one student profile must remain.");
  if (!confirm(`Delete ${getActiveStudent().name}?`)) return;
  delete state.students[state.activeStudentId];
  state.activeStudentId = Object.keys(state.students)[0];
  persist();
  renderStudentOptions();
  renderCurriculum();
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "meen-advising-records.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById("importInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  const imported = JSON.parse(text);
  if (!imported?.students || !imported?.activeStudentId) return alert("Invalid file format");
  state = imported;
  persist();
  renderStudentOptions();
  renderCurriculum();
});
