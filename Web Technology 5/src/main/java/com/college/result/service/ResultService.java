package com.college.result.service;

import com.college.result.dto.ClassSummary;
import com.college.result.dto.MarkInput;
import com.college.result.dto.ResultForm;
import com.college.result.dto.ResultView;
import com.college.result.dto.SubjectAverage;
import com.college.result.dto.SubjectResult;
import com.college.result.model.Mark;
import com.college.result.model.Student;
import com.college.result.model.Subject;
import com.college.result.repository.StudentRepository;
import com.college.result.repository.SubjectRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResultService {

    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;

    public ResultService(StudentRepository studentRepository, SubjectRepository subjectRepository) {
        this.studentRepository = studentRepository;
        this.subjectRepository = subjectRepository;
    }

    // ------------------------------------------------------------------ queries

    @Transactional(readOnly = true)
    public List<Subject> subjects() {
        return subjectRepository.findAllByOrderByIdAsc();
    }

    @Transactional(readOnly = true)
    public List<ResultView> list(String search) {
        List<Student> students = search == null || search.isBlank()
            ? studentRepository.findAllByOrderByRollNoAsc()
            : studentRepository.findByRollNoContainingIgnoreCaseOrNameContainingIgnoreCaseOrderByRollNoAsc(search.trim(), search.trim());
        return students.stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public ResultView get(Long id) {
        return toView(find(id));
    }

    @Transactional(readOnly = true)
    public ResultView getByRollNo(String rollNo) {
        return toView(studentRepository.findByRollNoIgnoreCase(rollNo)
            .orElseThrow(() -> new NotFoundException("No result found for roll number " + rollNo)));
    }

    @Transactional(readOnly = true)
    public ClassSummary summary() {
        List<ResultView> all = list(null);
        int passed = (int) all.stream().filter(ResultView::passed).count();
        ResultView topper = all.stream()
            .max(Comparator.comparingDouble(ResultView::sgpa).thenComparingDouble(ResultView::percentage))
            .orElse(null);

        List<SubjectAverage> subjectAverages = new ArrayList<>();
        for (Subject s : subjects()) {
            List<SubjectResult> rows = all.stream()
                .flatMap(r -> r.subjects().stream())
                .filter(sr -> sr.code().equals(s.getCode()))
                .toList();
            double avg = rows.stream().mapToDouble(SubjectResult::finalMarks).average().orElse(0);
            double max = rows.stream().mapToDouble(SubjectResult::finalMarks).max().orElse(0);
            int pass = (int) rows.stream().filter(SubjectResult::passed).count();
            subjectAverages.add(new SubjectAverage(s.getCode(), s.getName(), ResultCalculator.round2(avg), max, pass, rows.size() - pass));
        }

        return new ClassSummary(
            all.size(), passed, all.size() - passed,
            all.isEmpty() ? 0 : ResultCalculator.round2(passed * 100.0 / all.size()),
            ResultCalculator.round2(all.stream().mapToDouble(ResultView::sgpa).average().orElse(0)),
            topper == null ? "-" : topper.name(),
            topper == null ? "-" : topper.rollNo(),
            topper == null ? 0 : topper.sgpa(),
            subjectAverages);
    }

    // ------------------------------------------------------------------ forms

    @Transactional(readOnly = true)
    public ResultForm blankForm() {
        ResultForm form = new ResultForm();
        form.setSemester(1);
        for (Subject s : subjects()) {
            form.getMarks().add(new MarkInput(s.getId(), s.getCode(), s.getName(), s.getCredits(), null, null));
        }
        return form;
    }

    @Transactional(readOnly = true)
    public ResultForm formFor(Long id) {
        Student st = find(id);
        Map<Long, Mark> bySubject = st.getMarks().stream()
            .collect(Collectors.toMap(m -> m.getSubject().getId(), Function.identity()));
        ResultForm form = new ResultForm();
        form.setRollNo(st.getRollNo());
        form.setName(st.getName());
        form.setDepartment(st.getDepartment());
        form.setSemester(st.getSemester());
        form.setAcademicYear(st.getAcademicYear());
        for (Subject s : subjects()) {
            Mark m = bySubject.get(s.getId());
            form.getMarks().add(new MarkInput(s.getId(), s.getCode(), s.getName(), s.getCredits(),
                m == null ? null : m.getMse(), m == null ? null : m.getEse()));
        }
        return form;
    }

    /** Re-fills subject names/codes after a failed submit (hidden fields can be tampered with). */
    @Transactional(readOnly = true)
    public void refreshSubjectInfo(ResultForm form) {
        Map<Long, Subject> byId = subjects().stream().collect(Collectors.toMap(Subject::getId, Function.identity()));
        for (MarkInput mi : form.getMarks()) {
            Subject s = mi.getSubjectId() == null ? null : byId.get(mi.getSubjectId());
            if (s != null) {
                mi.setSubjectCode(s.getCode());
                mi.setSubjectName(s.getName());
                mi.setCredits(s.getCredits());
            }
        }
    }

    // ------------------------------------------------------------------ commands

    @Transactional
    public Long create(ResultForm form) {
        String rollNo = form.getRollNo().trim().toUpperCase();
        if (studentRepository.existsByRollNoIgnoreCase(rollNo)) throw new DuplicateRollNoException(rollNo);
        Student st = new Student();
        apply(st, form, rollNo);
        return studentRepository.save(st).getId();
    }

    @Transactional
    public void update(Long id, ResultForm form) {
        Student st = find(id);
        String rollNo = form.getRollNo().trim().toUpperCase();
        studentRepository.findByRollNoIgnoreCase(rollNo)
            .filter(other -> !other.getId().equals(id))
            .ifPresent(other -> { throw new DuplicateRollNoException(rollNo); });
        apply(st, form, rollNo);
        studentRepository.save(st);
    }

    @Transactional
    public void delete(Long id) {
        studentRepository.delete(find(id));
    }

    @Transactional
    public void deleteByRollNo(String rollNo) {
        studentRepository.delete(studentRepository.findByRollNoIgnoreCase(rollNo)
            .orElseThrow(() -> new NotFoundException("No result found for roll number " + rollNo)));
    }

    @Transactional
    public Long updateByRollNo(String rollNo, ResultForm form) {
        Student st = studentRepository.findByRollNoIgnoreCase(rollNo)
            .orElseThrow(() -> new NotFoundException("No result found for roll number " + rollNo));
        update(st.getId(), form);
        return st.getId();
    }

    private void apply(Student st, ResultForm form, String rollNo) {
        List<Subject> subjects = subjects();
        Map<Long, MarkInput> input = form.getMarks().stream()
            .filter(m -> m.getSubjectId() != null)
            .collect(Collectors.toMap(MarkInput::getSubjectId, Function.identity(), (a, b) -> b));
        for (Subject s : subjects) {
            MarkInput mi = input.get(s.getId());
            if (mi == null || mi.getMse() == null || mi.getEse() == null) {
                throw new IllegalArgumentException("Marks are missing for " + s.getName());
            }
        }
        st.setRollNo(rollNo);
        st.setName(form.getName().trim());
        st.setDepartment(form.getDepartment().trim());
        st.setSemester(form.getSemester());
        st.setAcademicYear(form.getAcademicYear().trim());
        for (Subject s : subjects) {
            MarkInput mi = input.get(s.getId());
            st.putMarks(s, mi.getMse(), mi.getEse());
        }
    }

    // ------------------------------------------------------------------ mapping

    private Student find(Long id) {
        return studentRepository.findById(id).orElseThrow(() -> new NotFoundException("Result not found"));
    }

    private ResultView toView(Student st) {
        List<SubjectResult> rows = st.getMarks().stream()
            .sorted(Comparator.comparing(m -> m.getSubject().getId()))
            .map(m -> {
                Subject s = m.getSubject();
                double fin = ResultCalculator.finalMarks(m.getMse(), m.getEse());
                Grade g = Grade.of(fin);
                return new SubjectResult(s.getCode(), s.getName(), s.getCredits(),
                    m.getMse(), ResultCalculator.mseContribution(m.getMse()),
                    m.getEse(), ResultCalculator.eseContribution(m.getEse()),
                    fin, g.getLabel(), g.getPoints(), g.isPass());
            })
            .toList();

        double total = ResultCalculator.round2(rows.stream().mapToDouble(SubjectResult::finalMarks).sum());
        int maxTotal = rows.size() * ResultCalculator.MAX_MARKS;
        int credits = rows.stream().mapToInt(SubjectResult::credits).sum();
        int earned = rows.stream().filter(SubjectResult::passed).mapToInt(SubjectResult::credits).sum();
        int failed = (int) rows.stream().filter(r -> !r.passed()).count();
        double sgpa = ResultCalculator.sgpa(rows.stream().map(r -> new int[] {r.credits(), r.gradePoints()}).toList());

        return new ResultView(st.getId(), st.getRollNo(), st.getName(), st.getDepartment(), st.getSemester(),
            st.getAcademicYear(), rows, total, maxTotal,
            maxTotal == 0 ? 0 : ResultCalculator.round2(total * 100.0 / maxTotal),
            credits, earned, sgpa, failed == 0 && !rows.isEmpty(), failed);
    }
}
