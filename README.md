# LA Tech ME Advising Tracker

A lightweight browser app for advising Mechanical Engineering students.

## Run locally (including GitHub Codespaces)

### Option 1: Python (quickest)

```bash
python3 -m http.server 8000
```

Then open:
- Local machine: `http://localhost:8000`
- Codespaces browser preview: open the **Ports** tab, find port `8000`, and click **Open in Browser**.

### Option 2: VS Code Live Server extension

1. Install **Live Server** extension.
2. Right-click `index.html`.
3. Click **Open with Live Server**.

## How to test manually

1. Open the app in your browser.
2. Create a student with **Add Student**.
3. Click a course card and assign a grade + notes.
4. Refresh the page and confirm the grade persists.
5. Switch students and verify each has independent course data.
6. Click **Export JSON** and save the file.
7. Re-import via **Import JSON** and confirm data restores.

## Notes

- Data is stored in browser `localStorage` under key `meen-advising-tracker-v1`.
- This app is static HTML/CSS/JS; no backend is required.


## Release
- Current build: **v0.2.1**
