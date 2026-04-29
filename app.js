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
const gradeOptions = ["A", "B", "C", "D", "F", "W", "I"];
const gradePoints = { A: 4, B: 3, C: 2, D: 1, F: 0 };
const STORAGE_KEY = "meen-advising-tracker-v1";
const app = { state: null, els: {} };

const makeId = () => (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `student-${Date.now()}`;
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(app.state));
const getActiveStudent = () => app.state.students[app.state.activeStudentId] || app.state.students[Object.keys(app.state.students)[0]];
const isPassing = (g) => ["A", "B", "C", "D"].includes(g);

function createDefaultState() { const id = makeId(); return { activeStudentId: id, yearCount: 4, students: { [id]: { id, name: "New Student", courses: {} } } }; }
function loadState() { try { const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); if (!p || !p.students) return createDefaultState(); if (!p.yearCount || p.yearCount < 4) p.yearCount = 4; return p; } catch { return createDefaultState(); } }

function calculateGpa(student) {
  let pts = 0, hrs = 0;
  curriculum.forEach((q) => q.courses.forEach(([code, , ch]) => {
    const grade = (student.courses[`Q${q.quarter}:${code}`] || {}).grade;
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
      quarterBlock.innerHTML = `<h3>${seasons[seasonIdx]} (Q${quarterNumber})</h3>`;

      if (!quarterData || !quarterData.courses.length) {
        quarterBlock.innerHTML += `<p class="empty-quarter">No scheduled courses</p>`;
      } else {
        quarterData.courses.forEach(([code, name, credits]) => {
          const key = `Q${quarterNumber}:${code}`;
          const rec = student.courses[key] || {};
          const card = document.createElement("article");
          card.className = `course-card ${isPassing(rec.grade) ? "complete" : ""}`;
          card.innerHTML = `
            <div class="course-code">${code}</div>
            <div class="course-name">${name} (${credits} cr)</div>
            <div class="course-grade">Grade: ${rec.grade || "Not Taken"}</div>
            <div class="grade-buttons" data-key="${key}"></div>
          `;

          const buttonWrap = card.querySelector(".grade-buttons");
          gradeOptions.forEach((grade) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = `grade-btn ${rec.grade === grade ? "selected" : ""}`;
            b.textContent = grade;
            b.addEventListener("click", () => {
              student.courses[key] = { ...(student.courses[key] || {}), grade };
              persist();
              renderCurriculum();
            });
            buttonWrap.appendChild(b);
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

function init() {
  app.els = {
    studentSelect: document.getElementById("studentSelect"), newStudentName: document.getElementById("newStudentName"), curriculumGrid: document.getElementById("curriculumGrid"), addStudentBtn: document.getElementById("addStudentBtn"), renameStudentBtn: document.getElementById("renameStudentBtn"), deleteStudentBtn: document.getElementById("deleteStudentBtn"), exportBtn: document.getElementById("exportBtn"), importInput: document.getElementById("importInput"), gpaValue: document.getElementById("gpaValue"), toggleDebugBtn: document.getElementById("toggleDebugBtn"), debugPanel: document.getElementById("debugPanel"), addYearBtn: document.getElementById("addYearBtn")
  };
  app.state = loadState();

  app.els.addStudentBtn.addEventListener("click", () => { const name = app.els.newStudentName.value.trim(); if (!name) return; const id = makeId(); app.state.students[id] = { id, name, courses: {} }; app.state.activeStudentId = id; app.els.newStudentName.value = ""; persist(); renderStudentOptions(); renderCurriculum(); });
  app.els.studentSelect.addEventListener("change", () => { app.state.activeStudentId = app.els.studentSelect.value; persist(); renderCurriculum(); });
  app.els.renameStudentBtn.addEventListener("click", () => { const s = getActiveStudent(); const name = prompt("Enter new student name", s.name); if (!name || !name.trim()) return; s.name = name.trim(); persist(); renderStudentOptions(); });
  app.els.deleteStudentBtn.addEventListener("click", () => { if (Object.keys(app.state.students).length === 1) return alert("At least one student profile must remain."); if (!confirm(`Delete ${getActiveStudent().name}?`)) return; delete app.state.students[app.state.activeStudentId]; app.state.activeStudentId = Object.keys(app.state.students)[0]; persist(); renderStudentOptions(); renderCurriculum(); });
  app.els.exportBtn.addEventListener("click", () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(app.state, null, 2)], { type: "application/json" })); a.download = "meen-advising-records.json"; a.click(); URL.revokeObjectURL(a.href); });
  app.els.importInput.addEventListener("change", async (e) => { const file = e.target.files[0]; if (!file) return; try { app.state = JSON.parse(await file.text()); persist(); renderStudentOptions(); renderCurriculum(); } catch { alert("Could not import JSON file."); } finally { e.target.value = ""; } });
  app.els.toggleDebugBtn.addEventListener("click", () => { app.els.debugPanel.style.display = app.els.debugPanel.style.display === "none" ? "block" : "none"; });
  app.els.addYearBtn.addEventListener("click", () => { app.state.yearCount += 1; persist(); renderCurriculum(); });

  renderStudentOptions();
  renderCurriculum();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
