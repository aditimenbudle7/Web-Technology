package com.college.result.web;

import com.college.result.dto.ClassSummary;
import com.college.result.dto.ResultForm;
import com.college.result.dto.ResultView;
import com.college.result.model.Subject;
import com.college.result.service.ResultService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** JSON REST API for the same data. */
@RestController
@RequestMapping("/api")
public class ResultApiController {

    private final ResultService resultService;

    public ResultApiController(ResultService resultService) {
        this.resultService = resultService;
    }

    @GetMapping("/subjects")
    public List<Subject> subjects() {
        return resultService.subjects();
    }

    @GetMapping("/results")
    public List<ResultView> results(@RequestParam(required = false) String q) {
        return resultService.list(q);
    }

    @GetMapping("/results/{rollNo}")
    public ResultView result(@PathVariable String rollNo) {
        return resultService.getByRollNo(rollNo);
    }

    @PostMapping("/results")
    public ResponseEntity<ResultView> create(@Valid @RequestBody ResultForm form) {
        Long id = resultService.create(form);
        ResultView view = resultService.get(id);
        return ResponseEntity.created(URI.create("/api/results/" + view.rollNo())).body(view);
    }

    @PutMapping("/results/{rollNo}")
    public ResultView update(@PathVariable String rollNo, @Valid @RequestBody ResultForm form) {
        return resultService.get(resultService.updateByRollNo(rollNo, form));
    }

    @DeleteMapping("/results/{rollNo}")
    public ResponseEntity<Void> delete(@PathVariable String rollNo) {
        resultService.deleteByRollNo(rollNo);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ClassSummary summary() {
        return resultService.summary();
    }
}
