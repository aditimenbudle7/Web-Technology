// Live preview of final marks and grade while typing (the server does the official calculation).
(function () {
  'use strict';
  var MSE_WEIGHT = 0.3;
  var ESE_WEIGHT = 0.7;
  var GRADES = [[90, 'O'], [80, 'A+'], [70, 'A'], [60, 'B+'], [50, 'B'], [45, 'C'], [40, 'P'], [0, 'F']];

  function gradeFor(marks) {
    for (var i = 0; i < GRADES.length; i++) {
      if (marks >= GRADES[i][0]) return GRADES[i][1];
    }
    return 'F';
  }

  function valid(v) {
    return v !== '' && !isNaN(v) && Number(v) >= 0 && Number(v) <= 100;
  }

  function update(row) {
    var mse = row.querySelector('.mse').value;
    var ese = row.querySelector('.ese').value;
    var finalCell = row.querySelector('.final');
    var gradeEl = row.querySelector('.grade-preview');
    if (!valid(mse) || !valid(ese)) {
      finalCell.textContent = '-';
      gradeEl.textContent = '-';
      gradeEl.classList.remove('grade-f');
      return;
    }
    var total = Math.round((Number(mse) * MSE_WEIGHT + Number(ese) * ESE_WEIGHT) * 100) / 100;
    var grade = gradeFor(total);
    finalCell.textContent = total.toFixed(2);
    gradeEl.textContent = grade;
    gradeEl.classList.toggle('grade-f', grade === 'F');
  }

  document.querySelectorAll('.mark-row').forEach(function (row) {
    row.querySelectorAll('.mark-input').forEach(function (input) {
      input.addEventListener('input', function () { update(row); });
    });
    update(row);
  });
})();
