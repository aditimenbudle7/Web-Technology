package com.college.result.repository;

import com.college.result.model.Student;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByRollNoIgnoreCase(String rollNo);

    boolean existsByRollNoIgnoreCase(String rollNo);

    List<Student> findAllByOrderByRollNoAsc();

    List<Student> findByRollNoContainingIgnoreCaseOrNameContainingIgnoreCaseOrderByRollNoAsc(String rollNo, String name);
}
