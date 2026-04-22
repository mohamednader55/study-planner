// ============================================
// storage.js — All localStorage read/write
// ============================================

const Storage = (() => {

  const KEYS = {
    SUBJECTS:  'sp_subjects',
    TASKS:     'sp_tasks',
    PROGRESS:  'sp_progress',
    STREAK:    'sp_streak',
    LAST_OPEN: 'sp_last_open',
  };

  // ── Subjects ──────────────────────────────

  function getSubjects() {
    return JSON.parse(localStorage.getItem(KEYS.SUBJECTS) || '[]');
  }

  function saveSubjects(subjects) {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  }

  function addSubject(subject) {
    const subjects = getSubjects();
    subject.id = 'sub_' + Date.now();
    subject.createdAt = new Date().toISOString();
    subjects.push(subject);
    saveSubjects(subjects);
    return subject;
  }

  function updateSubject(id, updates) {
    const subjects = getSubjects().map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    saveSubjects(subjects);
  }

  function deleteSubject(id) {
    const subjects = getSubjects().filter(s => s.id !== id);
    saveSubjects(subjects);
    // Also remove its tasks
    const tasks = getTasks().filter(t => t.subjectId !== id);
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  }

  // ── Tasks ─────────────────────────────────

  function getTasks() {
    return JSON.parse(localStorage.getItem(KEYS.TASKS) || '[]');
  }

  function getTasksForDate(dateStr) {
    return getTasks().filter(t => t.date === dateStr);
  }

  function saveTasks(tasks) {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  }

  function saveTasksForDate(dateStr, tasks) {
    const all = getTasks().filter(t => t.date !== dateStr);
    localStorage.setItem(KEYS.TASKS, JSON.stringify([...all, ...tasks]));
  }

  function markTaskComplete(taskId, done) {
    const tasks = getTasks().map(t =>
      t.id === taskId ? { ...t, completed: done, completedAt: done ? new Date().toISOString() : null } : t
    );
    saveTasks(tasks);
    updateStreak();
  }

  // ── Progress ──────────────────────────────

  function getProgress() {
    return JSON.parse(localStorage.getItem(KEYS.PROGRESS) || '{}');
  }

  function incrementProgress(subjectId, hours) {
    const progress = getProgress();
    if (!progress[subjectId]) progress[subjectId] = { sessionsCompleted: 0, hoursStudied: 0 };
    progress[subjectId].sessionsCompleted++;
    progress[subjectId].hoursStudied += hours;
    localStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
  }

  function decrementProgress(subjectId, hours) {
    const progress = getProgress();
    if (progress[subjectId]) {
      progress[subjectId].sessionsCompleted = Math.max(0, progress[subjectId].sessionsCompleted - 1);
      progress[subjectId].hoursStudied = Math.max(0, progress[subjectId].hoursStudied - hours);
    }
    localStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
  }

  // ── Streak ────────────────────────────────

  function getStreak() {
    return JSON.parse(localStorage.getItem(KEYS.STREAK) || '{"count":0,"lastDate":null}');
  }

  function updateStreak() {
    const streak   = getStreak();
    const today    = new Date().toISOString().split('T')[0];
    const tasks    = getTasksForDate(today);
    const anyDone  = tasks.some(t => t.completed);

    if (!anyDone) return;

    if (streak.lastDate === today) return; // already counted today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];

    if (streak.lastDate === yStr) {
      streak.count++;
    } else if (streak.lastDate !== today) {
      streak.count = 1;
    }
    streak.lastDate = today;
    localStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
  }

  // ── Last open (for auto-adjust) ───────────

  function getLastOpen() {
    return localStorage.getItem(KEYS.LAST_OPEN);
  }

  function setLastOpen(dateStr) {
    localStorage.setItem(KEYS.LAST_OPEN, dateStr);
  }

  // ── Public API ────────────────────────────

  return {
    getSubjects, saveSubjects, addSubject, updateSubject, deleteSubject,
    getTasks, getTasksForDate, saveTasks, saveTasksForDate, markTaskComplete,
    getProgress, incrementProgress, decrementProgress,
    getStreak, updateStreak,
    getLastOpen, setLastOpen,
  };

})();