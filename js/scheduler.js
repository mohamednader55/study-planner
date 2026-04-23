// ============================================
// scheduler.js — Core scheduling algorithm
// ============================================

const Scheduler = (() => {

  const TOTAL_STUDY_HOURS_PER_DAY = 6; // max daily study budget
  const MIN_SLOT_HOURS = 0.5;           // 30 min minimum per subject

  /**
   * Calculate days remaining until exam date (from today)
   */
  function daysUntil(examDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDateStr);
    exam.setHours(0, 0, 0, 0);
    const diff = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff); // at least 1 to avoid division by zero
  }

  /**
   * Compute priority weight for a subject
   * Formula: difficulty (1-5) * urgency (1 / days_remaining)
   * Closer exam + harder subject = higher priority
   */
  function computeWeight(subject) {
    const days = daysUntil(subject.examDate);
    const urgency = 1 / days;
    return subject.difficulty * urgency;
  }

  /**
   * Generate today's study plan from a list of subjects
   * Returns array of task objects
   */
  function generateDailyPlan(subjects) {
    if (!subjects || subjects.length === 0) return [];

    const today = new Date().toISOString().split('T')[0];

    // Filter out subjects whose exam has already passed
    const active = subjects.filter(s => daysUntil(s.examDate) > 0);
    if (active.length === 0) return [];

    // Compute weights
    const weights = active.map(s => ({ subject: s, weight: computeWeight(s) }));
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

    // Allocate hours proportionally, then round to nearest 0.5
    const tasks = weights.map(({ subject, weight }) => {
      const rawHours = (weight / totalWeight) * TOTAL_STUDY_HOURS_PER_DAY;
      const cappedHours = Math.min(rawHours, subject.dailyHours || 4);
      const roundedHours = Math.max(MIN_SLOT_HOURS, Math.round(cappedHours * 2) / 2);

      return {
        id:          `task_${subject.id}_${today}`,
        subjectId:   subject.id,
        subjectName: subject.name,
        subjectColor: subject.color || '#a855f7',
        date:        today,
        hours:       roundedHours,
        completed:   false,
        completedAt: null,
        daysLeft:    daysUntil(subject.examDate),
        priority:    getPriorityLabel(daysUntil(subject.examDate)),
      };
    });

    // Sort by weight descending (highest priority first)
    tasks.sort((a, b) => {
      const wa = weights.find(w => w.subject.id === a.subjectId).weight;
      const wb = weights.find(w => w.subject.id === b.subjectId).weight;
      return wb - wa;
    });

    return tasks;
  }

  /**
   * Label urgency for UI display
   */
  function getPriorityLabel(daysLeft) {
    if (daysLeft <= 3)  return 'urgent';
    if (daysLeft <= 7)  return 'soon';
    return 'ok';
  }

  /**
   * Auto-adjust: redistribute missed hours from previous days
   * Called when user opens the app after missing a day
   */
  function adjustForMissedDay(subjects, missedDateStr) {
    const missedTasks = Storage.getTasksForDate(missedDateStr);
    const incompleteTasks = missedTasks.filter(t => !t.completed);

    if (incompleteTasks.length === 0) return;

    // For each incomplete task, find the subject and add a note
    incompleteTasks.forEach(task => {
      const subject = subjects.find(s => s.id === task.subjectId);
      if (!subject) return;

      // Increase today's hours for this subject (stored as adjustment flag)
      Storage.updateSubject(subject.id, {
        adjustedHours: (subject.adjustedHours || 0) + task.hours * 0.5 // carry 50% forward
      });
    });
  }

  /**
   * Calculate overall completion % for a subject
   */
  function getSubjectCompletion(subjectId) {
    const allTasks = Storage.getTasks().filter(t => t.subjectId === subjectId);
    if (allTasks.length === 0) return 0;
    const done = allTasks.filter(t => t.completed).length;
    return Math.round((done / allTasks.length) * 100);
  }

  /**
   * Get total hours studied (all time)
   */
  function getTotalHoursStudied() {
    const progress = Storage.getProgress();
    return Object.values(progress).reduce((sum, p) => sum + (p.hoursStudied || 0), 0);
  }

  /**
   * Get total sessions completed
   */
  function getTotalSessionsCompleted() {
    const progress = Storage.getProgress();
    return Object.values(progress).reduce((sum, p) => sum + (p.sessionsCompleted || 0), 0);
  }

  /**
   * Get the nearest upcoming exam
   */
  function getNearestExam(subjects) {
    if (!subjects || subjects.length === 0) return null;
    const active = subjects.filter(s => daysUntil(s.examDate) > 0);
    if (active.length === 0) return null;
    return active.reduce((nearest, s) =>
      daysUntil(s.examDate) < daysUntil(nearest.examDate) ? s : nearest
    );
  }

  /**
   * Get activity data for the past 7 days
   */
  function getWeekActivity() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const tasks = Storage.getTasksForDate(dateStr);
      const completed = tasks.filter(t => t.completed).length;
      days.push({
        date: dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completed,
        isToday: i === 0,
      });
    }
    return days;
  }

  return {
    generateDailyPlan,
    daysUntil,
    getPriorityLabel,
    adjustForMissedDay,
    getSubjectCompletion,
    getTotalHoursStudied,
    getTotalSessionsCompleted,
    getNearestExam,
    getWeekActivity,
  };

})();