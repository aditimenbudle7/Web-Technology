package com.college.result.service;

import com.college.result.model.Subject;
import com.college.result.repository.SubjectRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/** Creates the four semester subjects the first time the application starts. */
@Component
public class DataInitializer implements CommandLineRunner {

    private final SubjectRepository subjectRepository;

    public DataInitializer(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    @Override
    public void run(String... args) {
        if (subjectRepository.count() == 0) {
            subjectRepository.saveAll(List.of(
                new Subject("CS301", "Web Technology", 4),
                new Subject("CS302", "Design and Analysis of Algorithms", 4),
                new Subject("CS303", "Database Management Systems", 3),
                new Subject("CS304", "Computer Networks", 3)
            ));
        }
    }
}
