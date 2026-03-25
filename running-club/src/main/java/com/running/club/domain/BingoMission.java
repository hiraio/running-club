package com.running.club.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bingo_missions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "position"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BingoMission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private BingoBoard board;

    @Column(nullable = false)
    private Integer position;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 300)
    private String description;

    public void update(String title, String description) {
        if (title != null && !title.isBlank()) this.title = title;
        if (description != null) this.description = description;
    }
}
