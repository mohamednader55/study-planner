// ============================================
// ui.js — DOM manipulation & rendering
// ============================================

const UI = (() => {

  // ── Sidebar date ──────────────────────────

  function renderSidebarDate() {
    const el = document.getElementById('sidebarDate');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric'
    });
  }

  // ── Greeting emoji based on time ──────────

  function renderGreeting() {
    const el = document.getElementById('greetingEmoji');
    if (!el) return;
    const h = new Date().getHours();
    if (h < 12) el.textContent = '☀️';
    else if (h < 17) el.textContent = '🌤️';
    else el.textContent = '🌙';
  }

  // ── Dashboard: render today's task cards ──

  function renderTaskCards(tasks) {
    const grid      = document.getElementById('taskGrid');
    const section   = document.getElementById('tasksSection');
    const empty     = document.getElementById('emptyState');
    const upcoming  = document.getElementById('upcomingSection');

    if (!grid) return;

    if (tasks.length === 0) {
      if (empty)   empty.style.display   = 'flex';
      if (section) section.style.display = 'none';
      return;
    }

    if (empty)   empty.style.display   = 'none';
    if (section) section.style.display = 'block';
    if (upcoming) upcoming.style.display = 'block';

    grid.innerHTML = tasks.map((task, idx) => `
      <div class="task-card ${task.completed ? 'completed' : ''}"
           id="card_${task.id}"
           style="--card-color: ${task.subjectColor}; animation-delay: ${idx * 0.07}s">
        <div class="task-subject-label">${task.subjectName}</div>
        <div class="task-name">Study Session</div>
        <div class="task-meta">
          <span><i class="fas fa-clock"></i> ${formatHours(task.hours)}</span>
          <span><i class="fas fa-calendar-alt"></i> ${task.daysLeft} day${task.daysLeft !== 1 ? 's' : ''} left</span>
          <span class="priority-badge priority-${task.priority}">${task.priority}</span>
        </div>
        <div class="task-actions">
          <button class="check-btn ${task.completed ? 'done' : ''}"
                  onclick="App.toggleTask('${task.id}', ${!task.completed})">
            <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
            ${task.completed ? 'Done!' : 'Mark Complete'}
          </button>
        </div>
      </div>
    `).join('');

    updateDayProgress(tasks);
  }

  // ── Day progress bar ──────────────────────

  function updateDayProgress(tasks) {
    const bar      = document.getElementById('dayProgressBar');
    const text     = document.getElementById('progressText');
    const countEl  = document.getElementById('completedToday');

    const total = tasks.length;
    const done  = tasks.filter(t => t.completed).length;
    const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

    if (bar)     bar.style.width = pct + '%';
    if (text)    text.textContent = `${done} / ${total} completed`;
    if (countEl) countEl.textContent = done;
  }

  // ── Upcoming exams list ───────────────────

  function renderUpcomingExams(subjects) {
    const list = document.getElementById('examList');
    if (!list) return;

    const sorted = [...subjects]
      .filter(s => Scheduler.daysUntil(s.examDate) > 0)
      .sort((a, b) => Scheduler.daysUntil(a.examDate) - Scheduler.daysUntil(b.examDate));

    list.innerHTML = sorted.map(s => {
      const days = Scheduler.daysUntil(s.examDate);
      const cls  = Scheduler.getPriorityLabel(days);
      return `
        <div class="exam-item">
          <div class="exam-dot" style="background:${s.color}"></div>
          <div class="exam-name">${s.name}</div>
          <div class="exam-date">${formatDate(s.examDate)}</div>
          <div class="exam-days ${cls}">${days}d left</div>
        </div>
      `;
    }).join('');
  }

  // ── Streak display ────────────────────────

  function renderStreak() {
    const el = document.getElementById('streakCount');
    if (!el) return;
    el.textContent = Storage.getStreak().count;
  }

  // ── Subjects page ─────────────────────────

  function renderSubjectCards(subjects) {
    const grid  = document.getElementById('subjectGrid');
    const empty = document.getElementById('emptyState');
    if (!grid) return;

    if (subjects.length === 0) {
      if (empty) empty.style.display = 'flex';
      grid.style.display = 'none';
      return;
    }

    if (empty) empty.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = subjects.map((s, idx) => {
      const days = Scheduler.daysUntil(s.examDate);
      const pct  = Scheduler.getSubjectCompletion(s.id);
      const stars = Array.from({length: 5}, (_, i) =>
        `<i class="fas fa-star ${i < s.difficulty ? 'filled' : 'empty'}"></i>`
      ).join('');

      return `
        <div class="subject-card" style="--card-color:${s.color}; animation-delay:${idx * 0.07}s">
          <div class="subject-card-header">
            <div class="subject-card-name">${s.name}</div>
            <div class="subject-card-actions">
              <button class="icon-btn" onclick="App.editSubject('${s.id}')" title="Edit">
                <i class="fas fa-pen"></i>
              </button>
              <button class="icon-btn delete" onclick="App.deleteSubject('${s.id}')" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="subject-card-meta">
            <span><i class="fas fa-calendar"></i> ${formatDate(s.examDate)}</span>
            <span><i class="fas fa-clock"></i> ${s.dailyHours}h/day goal</span>
            <span><i class="fas fa-hourglass-half"></i> ${days} days left</span>
          </div>
          <div class="difficulty-stars">${stars}</div>
          <div class="subject-mini-progress">
            <div class="subject-mini-progress-label">
              <span>Completion</span><span>${pct}%</span>
            </div>
            <div class="subject-mini-bar">
              <div class="subject-mini-bar-fill" style="width:${pct}%; background:${s.color}"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Progress page ─────────────────────────

  function renderProgressPage(subjects) {
    const empty    = document.getElementById('emptyState');
    const list     = document.getElementById('progressList');
    const heatmap  = document.getElementById('heatmapSection');

    if (subjects.length === 0) {
      if (empty) empty.style.display = 'flex';
      if (list)  list.style.display  = 'none';
      return;
    }

    if (empty)   empty.style.display   = 'none';
    if (list)    list.style.display    = 'block';
    if (heatmap) heatmap.style.display = 'block';

    // Stats
    setEl('totalSubjects', subjects.length);
    setEl('totalCompleted', Scheduler.getTotalSessionsCompleted());
    setEl('totalHours', Scheduler.getTotalHoursStudied().toFixed(1) + 'h');

    const nearest = Scheduler.getNearestExam(subjects);
    setEl('nearestExam', nearest ? Scheduler.daysUntil(nearest.examDate) + 'd' : '—');

    // Per-subject progress bars
    list.innerHTML = subjects.map(s => {
      const pct      = Scheduler.getSubjectCompletion(s.id);
      const progress = Storage.getProgress()[s.id] || {};
      const hours    = (progress.hoursStudied || 0).toFixed(1);
      const sessions = progress.sessionsCompleted || 0;
      const days     = Scheduler.daysUntil(s.examDate);

      return `
        <div class="progress-item">
          <div class="progress-item-header">
            <div class="progress-item-name">${s.name}</div>
            <div class="progress-item-pct">${pct}%</div>
          </div>
          <div class="progress-item-bar">
            <div class="progress-item-fill" style="width:${pct}%; background:${s.color}"></div>
          </div>
          <div class="progress-item-meta">
            <span><i class="fas fa-check"></i> ${sessions} sessions</span>
            <span><i class="fas fa-clock"></i> ${hours}h studied</span>
            <span><i class="fas fa-calendar"></i> ${days} days left</span>
          </div>
        </div>
      `;
    }).join('');

    // Week heatmap
    renderWeekHeatmap();
  }

  function renderWeekHeatmap() {
    const el = document.getElementById('weekHeatmap');
    if (!el) return;
    const week = Scheduler.getWeekActivity();
    el.innerHTML = week.map(day => `
      <div class="heatmap-day ${day.completed > 0 ? 'active' : ''} ${day.isToday ? 'today' : ''}">
        <div class="heatmap-day-name">${day.dayName}</div>
        <div class="heatmap-day-count" style="color:${day.completed > 0 ? '#a855f7' : '#6b6880'}">
          ${day.completed}
        </div>
      </div>
    `).join('');
  }

  // ── Modal helpers ─────────────────────────

  function openModal(subject = null) {
    const overlay = document.getElementById('modalOverlay');
    const title   = document.getElementById('modalTitle');
    if (!overlay) return;

    if (subject) {
      title.textContent = 'Edit Subject';
      document.getElementById('subjectName').value  = subject.name;
      document.getElementById('examDate').value      = subject.examDate;
      document.getElementById('difficulty').value    = subject.difficulty;
      document.getElementById('difficultyVal').textContent = subject.difficulty;
      document.getElementById('dailyHours').value   = subject.dailyHours;
      setActiveColor(subject.color);
    } else {
      title.textContent = 'Add Subject';
      document.getElementById('subjectName').value  = '';
      document.getElementById('examDate').value      = '';
      document.getElementById('difficulty').value    = 3;
      document.getElementById('difficultyVal').textContent = 3;
      document.getElementById('dailyHours').value   = 2;
      setActiveColor('#a855f7');
    }

    overlay.classList.add('open');
  }

  function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('open');
  }

  function getModalValues() {
    return {
      name:       document.getElementById('subjectName').value.trim(),
      examDate:   document.getElementById('examDate').value,
      difficulty: parseInt(document.getElementById('difficulty').value),
      dailyHours: parseFloat(document.getElementById('dailyHours').value) || 2,
      color:      document.querySelector('.color-dot.selected')?.dataset.color || '#a855f7',
    };
  }

  function setActiveColor(color) {
    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.classList.toggle('selected', dot.dataset.color === color);
    });
  }

  // ── Utility ───────────────────────────────

  function formatHours(h) {
    if (h < 1) return `${h * 60} min`;
    if (h === 1) return '1 hour';
    return `${h} hours`;
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  function setEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    toast.style.cssText = `
      position: fixed; bottom: 28px; right: 28px;
      background: ${type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'};
      border: 1px solid ${type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'};
      color: ${type === 'success' ? '#10b981' : '#ef4444'};
      padding: 12px 20px; border-radius: 10px;
      font-size: 14px; font-weight: 600;
      display: flex; align-items: center; gap: 8px;
      z-index: 999;
      animation: fadeUp 0.3s ease;
      backdrop-filter: blur(10px);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  return {
    renderSidebarDate, renderGreeting, renderTaskCards,
    renderUpcomingExams, renderStreak, renderSubjectCards,
    renderProgressPage, openModal, closeModal, getModalValues,
    setActiveColor, updateDayProgress, showToast, formatHours,
  };

})();