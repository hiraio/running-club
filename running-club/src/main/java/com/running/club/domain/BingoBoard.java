package com.running.club.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bingo_boards")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BingoBoard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String title;

    @Builder.Default
    @Column(nullable = false)
    private Integer size = 3;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    public void update(String title, LocalDate startDate, LocalDate endDate) {
        if (title != null && !title.isBlank()) this.title = title;
        if (startDate != null) this.startDate = startDate;
        if (endDate != null) this.endDate = endDate;
    }
}
