package com.college.result.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/** Marks of one student in one subject. MSE and ESE are both entered out of 100. */
@Entity
@Table(name = "marks", uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "subject_id"}))
public class Mark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(name = "mse_marks", nullable = false)
    private int mse;

    @Column(name = "ese_marks", nullable = false)
    private int ese;

    protected Mark() {
    }

    public Mark(Student student, Subject subject, int mse, int ese) {
        this.student = student;
        this.subject = subject;
        this.mse = mse;
        this.ese = ese;
    }

    public Long getId() { return id; }
    public Student getStudent() { return student; }
    public Subject getSubject() { return subject; }
    public int getMse() { return mse; }
    public void setMse(int mse) { this.mse = mse; }
    public int getEse() { return ese; }
    public void setEse(int ese) { this.ese = ese; }
}
