// ============================================
// app.js — Entry point, wires everything
// ============================================

const App = (() => {

  let editingSubjectId = null;
  const today = new Date().toISOString().split('T')[0];

  // ── Page detection ────────────────────────

  function currentPage() {
    const path = window.location.pathname;
    if (path.includes('subjects'))  return 'subjects';
    if (path.includes('progress'))  return 'progress';
    return 'dashboard';
  }

  // ── Init ──────────────────────────────────

  function init() {
    UI.renderSidebarDate();
    UI.renderStreak();

    const page = currentPage();

    if (page === 'dashboard')  initDashboard();
    if (page === 'subjects')   initSubjects();
    if (page === 'progress')   initProgress();

    // Close modal on overlay click
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) UI.closeModal();
      });
    }
  }

  // ── Dashboard ─────────────────────────────

  function initDashboard() {
    UI.renderGreeting();

    const subjects = Storage.getSubjects();

    // Check for missed days and auto-adjust
    const lastOpen = Storage.getLastOpen();
    if (lastOpen && lastOpen !== today) {
      Scheduler.adjustForMissedDay(subjects, lastOpen);
    }
    Storage.setLastOpen(today);

    // Get today's tasks — regenerate if none exist but subjects do
    let tasks = Storage.getTasksForDate(today);

    if (subjects.length > 0) {
      // Always regenerate if saved tasks don't match current subjects
      const savedSubjectIds = [...new Set(tasks.map(t => t.subjectId))].sort().join(',');
      const currentSubjectIds = subjects.map(s => s.id).sort().join(',');

      if (tasks.length === 0 || savedSubjectIds !== currentSubjectIds) {
        tasks = Scheduler.generateDailyPlan(subjects);
        Storage.saveTasksForDate(today, tasks);
      }
    }

    UI.renderTaskCards(tasks);
    UI.renderUpcomingExams(subjects);
    UI.renderStreak();
  }

  // ── Toggle task completion ─────────────────

  function toggleTask(taskId, done) {
    Storage.markTaskComplete(taskId, done);

    // Update progress tracking
    const tasks    = Storage.getTasksForDate(today);
    const task     = tasks.find(t => t.id === taskId);
    if (task) {
      if (done) Storage.incrementProgress(task.subjectId, task.hours);
      else      Storage.decrementProgress(task.subjectId, task.hours);
    }

    // Re-render
    const updated = Storage.getTasksForDate(today);
    UI.renderTaskCards(updated);
    UI.renderStreak();
    UI.showToast(done ? 'Session marked complete! 🎉' : 'Session unmarked.');
  }

  // ── Subjects page ─────────────────────────

  function initSubjects() {
    renderSubjects();
    bindSubjectModal();
  }

  function renderSubjects() {
    const subjects = Storage.getSubjects();
    UI.renderSubjectCards(subjects);
  }

  function bindSubjectModal() {
    // Open buttons
    ['openModalBtn', 'openModalBtn2'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => {
        editingSubjectId = null;
        UI.openModal(null);
      });
    });

    // Close buttons
    document.getElementById('closeModalBtn')?.addEventListener('click', UI.closeModal);
    document.getElementById('cancelBtn')?.addEventListener('click', UI.closeModal);

    // Difficulty slider live value
    const slider = document.getElementById('difficulty');
    if (slider) {
      slider.addEventListener('input', () => {
        document.getElementById('difficultyVal').textContent = slider.value;
      });
    }

    // Color picker
    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
      });
    });

    // Save subject
    document.getElementById('saveSubjectBtn')?.addEventListener('click', saveSubject);
  }

  function saveSubject() {
    const values = UI.getModalValues();

    // Validation
    if (!values.name) {
      UI.showToast('Please enter a subject name.', 'error');
      return;
    }
    if (!values.examDate) {
      UI.showToast('Please select an exam date.', 'error');
      return;
    }
    if (new Date(values.examDate) <= new Date()) {
      UI.showToast('Exam date must be in the future.', 'error');
      return;
    }

    if (editingSubjectId) {
      Storage.updateSubject(editingSubjectId, values);
      UI.showToast('Subject updated!');
    } else {
      Storage.addSubject(values);
      UI.showToast('Subject added!');
    }

    editingSubjectId = null;
    UI.closeModal();
    renderSubjects();

    // Regenerate today's plan with new subjects
    Storage.saveTasksForDate(today, []);
  }

  function editSubject(id) {
    const subject = Storage.getSubjects().find(s => s.id === id);
    if (!subject) return;
    editingSubjectId = id;
    UI.openModal(subject);
  }

  function deleteSubject(id) {
    const subject = Storage.getSubjects().find(s => s.id === id);
    if (!subject) return;
    if (!confirm(`Delete "${subject.name}"? This cannot be undone.`)) return;
    Storage.deleteSubject(id);
    // Regenerate today's plan
    Storage.saveTasksForDate(today, []);
    renderSubjects();
    UI.showToast('Subject deleted.');
  }

  // ── Progress page ─────────────────────────

  function initProgress() {
    const subjects = Storage.getSubjects();
    UI.renderProgressPage(subjects);
    UI.renderStreak();
  }

  // ── Public API ────────────────────────────

  return { init, toggleTask, editSubject, deleteSubject };

})();

// ── Boot ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', App.init);