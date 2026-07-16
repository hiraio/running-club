package com.running.club.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 순위 변동 추적을 위한 일별 스냅샷 테이블.
 *
 * <p>entity_type: "MEMBER" | "GROUP"
 * <p>entity_id  : memberId 또는 groupId
 * <p>하나의 테이블로 개인전 / 조별 기여도 순위를 모두 관리.
 * competition_id로 대회 컨텍스트를 명확히 구분하여,
 * 멤버가 여러 대회에 참여해도 스냅샷이 섞이지 않음.
 *
 * UNIQUE (entity_type, entity_id, competition_id, snapshot_date)
 * — 같은 대회 내 같은 엔티티는 하루 1건만 저장.
 *   스케줄러가 재실행되면 기존 건을 삭제 후 재삽입.
 */
@Entity
@Table(
    name = "rank_snapshots",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_rank_snapshot",
        columnNames = {"entity_type", "entity_id", "competition_id", "snapshot_date"}
    ),
    // 조회/삭제 패턴 (entity_type, competition_id, snapshot_date)용.
    // 유니크 제약 인덱스는 2번째 컬럼이 entity_id라 snapshot_date 조건까지 타지 못함 (docs/refactoring/04-db-indexes.md)
    indexes = @Index(name = "idx_rank_snapshots_type_comp_date",
                     columnList = "entity_type, competition_id, snapshot_date")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RankSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** "MEMBER" 또는 "GROUP" */
    @Column(name = "entity_type", nullable = false, length = 10)
    private String entityType;

    /** memberId 또는 groupId */
    @Column(name = "entity_id", nullable = false)
    private Integer entityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    private Competition competition;

    /** 스냅샷 시점의 순위 */
    @Column(nullable = false)
    private Integer rank;

    /** 스냅샷 날짜 (KST 자정 기준) */
    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;
}
