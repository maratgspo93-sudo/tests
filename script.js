/* =========================================================
   TEACHER QUIZ — script.js
   One shared JS file used by every page.

   HOW THIS FILE IS ORGANIZED
   1. Constants & storage helpers  (localStorage read/write)
   2. Small utility functions      (id/code generation, formatting)
   3. One "init" function per page (each page's <body> has a
      data-page="..." attribute that tells us which init to run)
   4. A single DOMContentLoaded listener at the bottom that reads
      data-page and calls the matching init function.

   WHY localStorage?
   This first version has no backend server, so everything a
   teacher creates (tests) and every result a student produces is
   saved in the browser's localStorage. That's why it only works
   on the same browser/device for now. The "Future Development"
   notes in README.md explain how this maps onto a real database
   later (MongoDB) without changing much of this file's shape.
   ========================================================= */

/* ---------------------------------------------------------
   1. CONSTANTS & STORAGE HELPERS
   --------------------------------------------------------- */

const STORAGE_KEYS = {
  TESTS: 'tq_tests',
  RESULTS: 'tq_results'
};

const SUBJECTS = [
  'Մաթեմատիկա',
  'Հայ լեզու',
  'Հայ պատմություն',
  'Անգլերեն',
  'Ֆիզիկա',
  'Քիմիա',
  'Կենսաբանություն',
  'Աշխարհագրություն',
  'Համակարգչային գիտություն'
];

const GRADES = Array.from({ length: 12 }, (_, i) => `Դասարան ${i + 1}`);

// Read the full list of tests from localStorage (or [] if none saved yet)
function getTests() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TESTS)) || [];
  } catch (e) {
    return [];
  }
}

// Overwrite the full list of tests in localStorage
function saveTests(tests) {
  localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
}

// Read the full list of student results from localStorage
function getResults() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS)) || [];
  } catch (e) {
    return [];
  }
}

// Overwrite the full list of results in localStorage
function saveResults(results) {
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
}

/* ---------------------------------------------------------
   2. UTILITY FUNCTIONS
   --------------------------------------------------------- */

// Short helper so we don't type document.getElementById() everywhere
function qs(id) {
  return document.getElementById(id);
}

// Generates a random internal id, e.g. for a new test or result.
// (Not shown to users — the *test code* below is what students type in.)
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Generates a short, human-friendly 6-character test code, e.g. "K7M2QX".
// Ambiguous characters (0/O, 1/I/L) are excluded so students can type it
// correctly from a whiteboard or a screen share.
function generateTestCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Make sure it doesn't collide with an existing test's code
  const existing = getTests().map(t => t.code);
  return existing.includes(code) ? generateTestCode() : code;
}

// Formats a number of seconds as mm:ss for the countdown timer
function formatTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// Formats an ISO date string as a short readable date
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

/* ===========================================================
   HOME PAGE  (index.html)
   =========================================================== */
function initHomePage() {
  const tests = getTests();
  const results = getResults();

  const totalTests = tests.length;
  const uniqueStudents = new Set(results.map(r => r.studentName.trim().toLowerCase())).size;
  const avgScore = results.length
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
    : 0;

  if (qs('stat-tests')) qs('stat-tests').textContent = totalTests;
  if (qs('stat-students')) qs('stat-students').textContent = uniqueStudents;
  if (qs('stat-submissions')) qs('stat-submissions').textContent = results.length;
  if (qs('stat-avg')) qs('stat-avg').textContent = avgScore + '%';
}

/* ===========================================================
   TEACHER DASHBOARD  (teacher.html)
   =========================================================== */
function initTeacherDashboard() {
  renderDashboardStats();
  renderTestList();

  // The AI panel button is intentionally disabled — see README.md
  // "AI Feature for Future Version" for what this will do later.
  const aiBtn = qs('ai-generate-btn');
  if (aiBtn) {
    aiBtn.addEventListener('click', () => {
      alert('Այս հայեցակարգային կոճակը նախադիտ է: Ապագա տարբերակում սա AI ծառայություն կանի, որպեսզի ինքնաբերմիջ սևակցի հարցերը ձեր թեմայի նկարագրությունից:');
    });
  }
}

function renderDashboardStats() {
  const tests = getTests();
  const results = getResults();

  const published = tests.filter(t => t.published).length;
  const uniqueStudents = new Set(results.map(r => r.studentName.trim().toLowerCase())).size;
  const avgScore = results.length
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
    : 0;

  qs('dash-total-tests').textContent = tests.length;
  qs('dash-published-tests').textContent = published;
  qs('dash-total-students').textContent = uniqueStudents;
  qs('dash-avg-score').textContent = tests.length ? avgScore + '%' : '—';
}

function renderTestList() {
  const tests = getTests().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const results = getResults();
  const listEl = qs('test-list');
  if (!listEl) return;

  if (tests.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state card">
        <div class="emoji">📝</div>
        <p>Դուք դեռ ոչ մի թեստ չեք ստեղծել:</p>
        <a href="create-test.html" class="btn btn-primary" style="margin-top:14px;">Ստեղծել ձեր առաջին թեստը</a>
      </div>`;
    return;
  }

  listEl.innerHTML = tests.map(test => {
    const attempts = results.filter(r => r.testId === test.id).length;
    return `
      <div class="test-row card">
        <div class="test-row-main">
          <span class="title">${escapeHtml(test.title)}</span>
          <span class="meta">${escapeHtml(test.subject)} · ${escapeHtml(test.grade)} · ${test.questions.length} հարց · ${test.timeLimit} րոպե</span>
        </div>
        <span class="test-code-tag">${test.code}</span>
        <span class="badge ${test.published ? 'badge-published' : 'badge-draft'}">${test.published ? 'Հրատարակված' : 'Սևագիր'}</span>
        <span class="meta" style="min-width:90px;">${attempts} փորձ</span>
        <div class="test-row-actions">
          <a class="btn btn-outline btn-sm" href="create-test.html?id=${test.id}">Խմբագրել</a>
          <a class="btn btn-secondary btn-sm" href="dashboard.html?testId=${test.id}">Արդյունքներ</a>
          <button class="btn btn-outline btn-sm" onclick="togglePublish('${test.id}')">${test.published ? 'Հրատարակում հանել' : 'Հրատարակել'}</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTest('${test.id}')">Ջնջել</button>
        </div>
      </div>`;
  }).join('');
}

function togglePublish(id) {
  const tests = getTests();
  const test = tests.find(t => t.id === id);
  if (!test) return;
  test.published = !test.published;
  saveTests(tests);
  renderDashboardStats();
  renderTestList();
}

function deleteTest(id) {
  if (!confirm('Ջնջե՞ք այս թեստը և դրա բոլոր ուսանողային արդյունքները: Սա չի կարող հետ կանչվել:')) return;
  const tests = getTests().filter(t => t.id !== id);
  saveTests(tests);
  // Cascade delete: remove any results that belonged to this test
  const results = getResults().filter(r => r.testId !== id);
  saveResults(results);
  renderDashboardStats();
  renderTestList();
}

/* ===========================================================
   CREATE / EDIT TEST  (create-test.html)
   =========================================================== */

let questionCounter = 0; // used to generate unique ids for question blocks in the form

function initCreateTestPage() {
  // Fill the Subject / Grade dropdowns
  const subjectSelect = qs('field-subject');
  const gradeSelect = qs('field-grade');
  subjectSelect.innerHTML = SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('');
  gradeSelect.innerHTML = GRADES.map(g => `<option value="${g}">${g}</option>`).join('');

  const params = new URLSearchParams(location.search);
  const editId = params.get('id');
  let editingTest = null;

  if (editId) {
    editingTest = getTests().find(t => t.id === editId) || null;
  }

  if (editingTest) {
    qs('page-title').textContent = 'Թեստ խմբագրել';
    qs('field-title').value = editingTest.title;
    qs('field-description').value = editingTest.description;
    subjectSelect.value = editingTest.subject;
    gradeSelect.value = editingTest.grade;
    qs('field-time-limit').value = editingTest.timeLimit;
    editingTest.questions.forEach(q => addQuestionBlock(q));
  } else {
    addQuestionBlock(); // start with one empty question
  }

  qs('add-question-btn').addEventListener('click', () => addQuestionBlock());

  qs('save-draft-btn').addEventListener('click', () => handleSaveTest(editingTest, false));
  qs('publish-btn').addEventListener('click', () => handleSaveTest(editingTest, true));
}

// Adds one question block to the form. If `data` is passed, the block is
// pre-filled (used when editing an existing test).
function addQuestionBlock(data) {
  questionCounter++;
  const qid = 'q' + questionCounter;
  const options = data ? data.options : ['', '', '', ''];
  const correctIndex = data ? data.correctIndex : 0;

  const wrapper = document.createElement('div');
  wrapper.className = 'question-block';
  wrapper.dataset.qid = qid;
  wrapper.innerHTML = `
    <div class="question-block-header">
      <span class="q-label">Հարց</span>
      <button type="button" class="btn btn-danger btn-sm remove-question-btn">Հեռացնել</button>
    </div>
    <div class="field">
      <label>Հարցի տեքստ</label>
      <input type="text" class="q-text" placeholder="օր. Ո՞րն է Հայաստանի մայրաքաղաքը:" value="${escapeHtml(data ? data.text : '')}">
    </div>
    <label>Պատասխանի ընտրանքներ (ընտրեք ճիշտը)</label>
    ${[0, 1, 2, 3].map(i => `
      <div class="option-row">
        <input type="radio" name="correct-${qid}" value="${i}" ${i === correctIndex ? 'checked' : ''}>
        <span class="opt-label">${String.fromCharCode(65 + i)}</span>
        <input type="text" class="q-option" placeholder="Ընտրանք ${String.fromCharCode(65 + i)}" value="${escapeHtml(options[i] || '')}">
      </div>`).join('')}
  `;

  wrapper.querySelector('.remove-question-btn').addEventListener('click', () => {
    wrapper.remove();
    renumberQuestionBlocks();
  });

  qs('questions-container').appendChild(wrapper);
  renumberQuestionBlocks();
}

// Updates the visible "Question 1", "Question 2"... labels after add/remove
function renumberQuestionBlocks() {
  const blocks = document.querySelectorAll('.question-block');
  blocks.forEach((block, i) => {
    block.querySelector('.q-label').textContent = `Հարց ${i + 1}`;
  });
}

// Reads every question block currently in the form into a plain array,
// e.g. [{ text, options: [...], correctIndex }, ...]
function collectQuestionsFromForm() {
  const blocks = document.querySelectorAll('.question-block');
  const questions = [];
  blocks.forEach(block => {
    const text = block.querySelector('.q-text').value.trim();
    const optionInputs = block.querySelectorAll('.q-option');
    const options = Array.from(optionInputs).map(inp => inp.value.trim());
    const checkedRadio = block.querySelector('input[type="radio"]:checked');
    const correctIndex = checkedRadio ? parseInt(checkedRadio.value, 10) : null;
    questions.push({ text, options, correctIndex });
  });
  return questions;
}

function handleSaveTest(editingTest, publish) {
  const errorBox = qs('form-error');
  errorBox.classList.remove('show');

  const title = qs('field-title').value.trim();
  const description = qs('field-description').value.trim();
  const subject = qs('field-subject').value;
  const grade = qs('field-grade').value;
  const timeLimit = parseInt(qs('field-time-limit').value, 10);
  const questions = collectQuestionsFromForm();

  // ---- Validation ----
  if (!title) return showFormError('Խնդրում եմ մուտքագրել թեստի վերնագիր:');
  if (!timeLimit || timeLimit < 1) return showFormError('Խնդրում եմ սահմանել ժամանակային սահմանափակում առնվազն 1 րոպե:');
  if (questions.length === 0) return showFormError('Ավելացրեք առնվազն մեկ հարց:');

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.text) return showFormError(`Հարց ${i + 1} պետք է հարցի տեքստ:`)
    if (q.options.some(o => !o)) return showFormError(`Հարց ${i + 1} պետք է բոլոր 4 պատասխանի ընտրանքները լրացված լինեն:`)
    if (q.correctIndex === null) return showFormError(`Հարց ${i + 1} պետք է ճիշտ պատասխան ընտրված լինի:`);
  }

  const tests = getTests();

  if (editingTest) {
    // Update the existing test in place
    editingTest.title = title;
    editingTest.description = description;
    editingTest.subject = subject;
    editingTest.grade = grade;
    editingTest.timeLimit = timeLimit;
    editingTest.questions = questions;
    editingTest.published = publish;
    saveTests(tests);
    showSaveSuccess(editingTest.code, publish);
  } else {
    const newTest = {
      id: generateId(),
      code: generateTestCode(),
      title, description, subject, grade, timeLimit, questions,
      published: publish,
      createdAt: new Date().toISOString()
    };
    tests.push(newTest);
    saveTests(tests);
    showSaveSuccess(newTest.code, publish);
  }
}

function showFormError(message) {
  const errorBox = qs('form-error');
  errorBox.textContent = message;
  errorBox.classList.add('show');
  errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showSaveSuccess(code, published) {
  const box = qs('form-success');
  box.classList.add('show');
  box.innerHTML = `
    <strong>${published ? 'Թեստը հրատարակված է:' : 'Սևագիրը պահպանված է:'}</strong><br>
    ${published ? 'Ուսանողները այժմ կարող են միանալ այս կոդով.' : 'Ձեր թեստի կոդը (հրատարակելուց հետո) կլինի.'}
    <div class="success-code">${code}</div>
    <div style="margin-top:10px;"><a href="teacher.html" class="btn btn-primary btn-sm">Վերադառնալ Հաշվապահ</a></div>
  `;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ===========================================================
   STUDENT TEST ENTRY  (student.html)
   =========================================================== */
function initStudentEntryPage() {
  qs('entry-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const errorBox = qs('entry-error');
    errorBox.classList.remove('show');

    const name = qs('field-student-name').value.trim();
    const code = qs('field-test-code').value.trim().toUpperCase();

    if (!name) { errorBox.textContent = 'Խնդրում եմ մուտքագրել ձեր անունը:'; errorBox.classList.add('show'); return; }
    if (!code) { errorBox.textContent = 'Խնդրում եմ մուտքագրել թեստի կոդը:'; errorBox.classList.add('show'); return; }

    const test = getTests().find(t => t.code.toUpperCase() === code);
    if (!test) { errorBox.textContent = 'Այդ կոդով թեստ չի գտնվել: Խնդրում եմ ստուգել այն և նորից փորձել:'; errorBox.classList.add('show'); return; }
    if (!test.published) { errorBox.textContent = 'Այս թեստը դեռ հրատարակված չէ ուսուչի կողմից:'; errorBox.classList.add('show'); return; }
    if (test.questions.length === 0) { errorBox.textContent = 'Այս թեստը դեռ հարցեր չունի:'; errorBox.classList.add('show'); return; }

    // Save the attempt info for test.html to pick up, then go there
    sessionStorage.setItem('tq_attempt', JSON.stringify({
      testId: test.id,
      studentName: name,
      startedAt: Date.now()
    }));
    sessionStorage.removeItem('tq_answers'); // clear any leftover answers from a previous attempt
    window.location.href = 'test.html';
  });
}

/* ===========================================================
   TEST-TAKING PAGE  (test.html)
   =========================================================== */

let tqTest = null;
let tqAttempt = null;
let tqAnswers = [];
let tqCurrentQ = 0;
let tqRemainingSeconds = 0;
let tqTimerInterval = null;

function initTestPage() {
  const attemptRaw = sessionStorage.getItem('tq_attempt');
  if (!attemptRaw) { window.location.href = 'student.html'; return; }
  tqAttempt = JSON.parse(attemptRaw);

  tqTest = getTests().find(t => t.id === tqAttempt.testId);
  if (!tqTest) { window.location.href = 'student.html'; return; }

  const savedAnswers = sessionStorage.getItem('tq_answers');
  tqAnswers = savedAnswers ? JSON.parse(savedAnswers) : new Array(tqTest.questions.length).fill(null);

  qs('test-title').textContent = tqTest.title;
  qs('test-subtitle').textContent = `${tqTest.subject} · ${tqTest.grade} · ${tqTest.questions.length} հարցեր`;

  renderQuestionNav();
  renderCurrentQuestion();
  startTimer();

  qs('prev-btn').addEventListener('click', () => { tqCurrentQ--; renderCurrentQuestion(); });
  qs('next-btn').addEventListener('click', () => { tqCurrentQ++; renderCurrentQuestion(); });
  qs('submit-btn').addEventListener('click', () => submitTest(false));
}

function renderQuestionNav() {
  const nav = qs('question-nav');
  nav.innerHTML = tqTest.questions.map((_, i) => `
    <button type="button" class="q-nav-btn" data-index="${i}">${i + 1}</button>
  `).join('');
  nav.querySelectorAll('.q-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tqCurrentQ = parseInt(btn.dataset.index, 10);
      renderCurrentQuestion();
    });
  });
}

function renderCurrentQuestion() {
  const q = tqTest.questions[tqCurrentQ];
  const total = tqTest.questions.length;

  qs('q-count').textContent = `Հարց ${tqCurrentQ + 1} ${total}-ից`;
  qs('q-text').textContent = q.text;
  qs('progress-fill').style.width = `${((tqCurrentQ + 1) / total) * 100}%`;

  qs('options-container').innerHTML = q.options.map((opt, i) => `
    <div class="option-choice ${tqAnswers[tqCurrentQ] === i ? 'selected' : ''}" data-index="${i}">
      <span class="option-letter">${String.fromCharCode(65 + i)}</span>
      <span>${escapeHtml(opt)}</span>
    </div>`).join('');

  qs('options-container').querySelectorAll('.option-choice').forEach(el => {
    el.addEventListener('click', () => {
      tqAnswers[tqCurrentQ] = parseInt(el.dataset.index, 10);
      sessionStorage.setItem('tq_answers', JSON.stringify(tqAnswers));
      renderCurrentQuestion();
      updateNavHighlights();
    });
  });

  qs('prev-btn').disabled = tqCurrentQ === 0;
  const isLast = tqCurrentQ === total - 1;
  qs('next-btn').style.display = isLast ? 'none' : 'inline-flex';
  qs('submit-btn').style.display = isLast ? 'inline-flex' : 'none';

  updateNavHighlights();
}

function updateNavHighlights() {
  document.querySelectorAll('.q-nav-btn').forEach((btn, i) => {
    btn.classList.toggle('answered', tqAnswers[i] !== null);
    btn.classList.toggle('current', i === tqCurrentQ);
  });
}

function startTimer() {
  tqRemainingSeconds = tqTest.timeLimit * 60;
  updateTimerDisplay();
  tqTimerInterval = setInterval(() => {
    tqRemainingSeconds--;
    updateTimerDisplay();
    if (tqRemainingSeconds <= 0) {
      clearInterval(tqTimerInterval);
      submitTest(true); // auto-submit when time runs out
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = qs('timer-display');
  el.textContent = formatTime(tqRemainingSeconds);
  el.parentElement.classList.toggle('low', tqRemainingSeconds <= 30);
}

function submitTest(auto) {
  if (tqTimerInterval) clearInterval(tqTimerInterval);

  if (!auto) {
    const unanswered = tqAnswers.filter(a => a === null).length;
    if (unanswered > 0 && !confirm(`Դուք ունեք ${unanswered} չպատասխանված հարց: Ուղարկե՞լ, այնուամենայնիվ:`)) {
      startTimer(); // resume the countdown if they cancel
      return;
    }
  }

  const total = tqTest.questions.length;
  let correct = 0;
  tqTest.questions.forEach((q, i) => {
    if (tqAnswers[i] === q.correctIndex) correct++;
  });
  const incorrect = total - correct;
  const percentage = Math.round((correct / total) * 100);
  const timeUsedSeconds = (tqTest.timeLimit * 60) - Math.max(0, tqRemainingSeconds);

  const result = {
    id: generateId(),
    testId: tqTest.id,
    testCode: tqTest.code,
    testTitle: tqTest.title,
    studentName: tqAttempt.studentName,
    total, correct, incorrect, percentage,
    timeUsedSeconds,
    answers: tqAnswers,
    submittedAt: new Date().toISOString()
  };

  const results = getResults();
  results.push(result);
  saveResults(results);

  sessionStorage.setItem('tq_last_result_id', result.id);
  sessionStorage.removeItem('tq_attempt');
  sessionStorage.removeItem('tq_answers');

  window.location.href = 'results.html';
}

/* ===========================================================
   RESULTS PAGE  (results.html)
   =========================================================== */
function initResultsPage() {
  const params = new URLSearchParams(location.search);
  const resultId = params.get('id') || sessionStorage.getItem('tq_last_result_id');

  if (!resultId) { window.location.href = 'index.html'; return; }

  const result = getResults().find(r => r.id === resultId);
  if (!result) { window.location.href = 'index.html'; return; }

  const test = getTests().find(t => t.id === result.testId);

  qs('result-student-name').textContent = result.studentName;
  qs('result-test-title').textContent = result.testTitle;
  qs('result-percentage').textContent = result.percentage + '%';
  document.documentElement.style.setProperty('--pct', result.percentage);
  qs('score-ring').style.setProperty('--pct', result.percentage);

  qs('result-correct').textContent = result.correct;
  qs('result-incorrect').textContent = result.incorrect;
  qs('result-time').textContent = formatTime(result.timeUsedSeconds);

  qs('review-toggle-btn').addEventListener('click', () => {
    const list = qs('review-list');
    const isShowing = list.classList.toggle('show');
    qs('review-toggle-btn').textContent = isShowing ? 'Պատասխանները թաքցնել' : 'Պատասխանները ստուգել';
    if (isShowing && test) renderReview(test, result);
  });
}

function renderReview(test, result) {
  qs('review-list').innerHTML = test.questions.map((q, i) => {
    const studentAnswer = result.answers[i];
    return `
      <div class="review-item card">
        <div class="q-text">${i + 1}. ${escapeHtml(q.text)}</div>
        ${q.options.map((opt, j) => {
          let cls = '';
          if (j === q.correctIndex) cls = 'correct';
          else if (j === studentAnswer) cls = 'wrong-picked';
          return `<div class="review-option ${cls}">
            <span class="option-letter" style="width:22px;height:22px;font-size:11px;">${String.fromCharCode(65 + j)}</span>
            ${escapeHtml(opt)}
            ${j === q.correctIndex ? ' ✓ Ճիշտ պատասխան' : ''}
            ${j === studentAnswer && j !== q.correctIndex ? ' ✗ Ձեր պատասխան' : ''}
          </div>`;
        }).join('')}
      </div>`;
  }).join('');
}

/* ===========================================================
   TEST RESULTS DASHBOARD  (dashboard.html)
   =========================================================== */
function initTestResultsDashboardPage() {
  const tests = getTests();
  const select = qs('test-select');
  select.innerHTML = '<option value="">Ընտրեք թեստ…</option>' +
    tests.map(t => `<option value="${t.id}">${escapeHtml(t.title)} (${t.code})</option>`).join('');

  const params = new URLSearchParams(location.search);
  const testId = params.get('testId');
  if (testId) select.value = testId;

  select.addEventListener('change', () => {
    const url = new URL(location.href);
    if (select.value) url.searchParams.set('testId', select.value);
    else url.searchParams.delete('testId');
    window.location.href = url.toString();
  });

  if (testId) {
    renderTestResultsDashboard(testId);
  } else {
    qs('dashboard-content').innerHTML = `
      <div class="empty-state card">
        <div class="emoji">📊</div>
        <p>Ընտրեք վերևից թեստ՝ ուսանողների արդյունքները տեսնելու համար:</p>
      </div>`;
  }
}

function renderTestResultsDashboard(testId) {
  const test = getTests().find(t => t.id === testId);
  const content = qs('dashboard-content');
  if (!test) { content.innerHTML = '<p>Թեստը չի գտնվել:</p>'; return; }

  const results = getResults()
    .filter(r => r.testId === testId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const avg = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
  const high = results.length ? Math.max(...results.map(r => r.percentage)) : 0;
  const low = results.length ? Math.min(...results.map(r => r.percentage)) : 0;

  if (results.length === 0) {
    content.innerHTML = `
      <div class="card card-pad" style="margin-bottom:22px;">
        <h2 style="font-size:18px;">${escapeHtml(test.title)}</h2>
        <p style="color:var(--text-muted); font-size:14px; margin-top:6px;">${escapeHtml(test.subject)} · ${escapeHtml(test.grade)} · Կոդ. <strong>${test.code}</strong></p>
      </div>
      <div class="empty-state card">
        <div class="emoji">🕒</div>
        <p>Ոչ մի ուսանող դեռ չի հանձնել այս թեստը:</p>
      </div>`;
    return;
  }

  const barColor = (pct) => pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--amber)' : 'var(--danger)';

  content.innerHTML = `
    <div class="card card-pad" style="margin-bottom:22px;">
      <h2 style="font-size:18px;">${escapeHtml(test.title)}</h2>
      <p style="color:var(--text-muted); font-size:14px; margin-top:6px;">${escapeHtml(test.subject)} · ${escapeHtml(test.grade)} · Կոդ. <strong>${test.code}</strong></p>
    </div>

    <div class="dash-stats">
      <div class="card dash-stat"><div class="label">Հանձնումներ</div><div class="value">${results.length}</div></div>
      <div class="card dash-stat"><div class="label">Միջին միավոր</div><div class="value">${avg}%</div></div>
      <div class="card dash-stat"><div class="label">Առավելագույն միավոր</div><div class="value">${high}%</div></div>
      <div class="card dash-stat"><div class="label">Նվազագույն միավոր</div><div class="value">${low}%</div></div>
    </div>

    <div class="card card-pad" style="margin-bottom:22px;">
      <h3 style="font-size:15.5px; margin-bottom:16px;">Միավորների բաշխում</h3>
      <div class="bar-chart">
        ${results.map(r => `
          <div class="bar-row">
            <span class="bar-name">${escapeHtml(r.studentName)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${r.percentage}%; background:${barColor(r.percentage)};"></div></div>
            <span class="bar-pct">${r.percentage}%</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="results-table-wrap">
        <table class="results-table">
          <thead>
            <tr><th>Ուսանող</th><th>Միավոր</th><th>Տոկոս</th><th>Ծախսված ժամանակ</th><th>Հանձնվել է</th><th></th></tr>
          </thead>
          <tbody>
            ${results.map(r => `
              <tr>
                <td>${escapeHtml(r.studentName)}</td>
                <td>${r.correct}/${r.total}</td>
                <td><strong>${r.percentage}%</strong></td>
                <td>${formatTime(r.timeUsedSeconds)}</td>
                <td>${formatDate(r.submittedAt)}</td>
                <td><a class="btn btn-outline btn-sm" href="results.html?id=${r.id}">Դիտել</a></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ---------------------------------------------------------
   3 & 4. PAGE ROUTER
   Runs on every page. Reads <body data-page="..."> and calls
   the matching init function above.
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  const routes = {
    home: initHomePage,
    teacher: initTeacherDashboard,
    'create-test': initCreateTestPage,
    student: initStudentEntryPage,
    test: initTestPage,
    results: initResultsPage,
    dashboard: initTestResultsDashboardPage
  };
  if (routes[page]) routes[page]();

  // Mobile nav toggle (shared across pages that include #mobile-menu-btn)
  const menuBtn = qs('mobile-menu-btn');
  const mobileMenu = qs('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  }
});
