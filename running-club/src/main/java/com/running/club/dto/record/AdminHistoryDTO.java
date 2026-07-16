package com.running.club.dto.record;

import com.running.club.domain.Member;
import com.running.club.domain.RunningRecord;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * GET /api/admin/records/history 전용 응답 DTO.
 * RunningRecordDTO와 별도 분리 — approvedBy(LAZY)를 JOIN FETCH로 로딩한
 * findHistory() 쿼리에서만 사용.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminHistoryDTO {

    private Integer id;
    private Double distance;
    private Integer duration;
    private String runningDate;   // "YYYY-MM-DD"
    private String status;        // "APPROVED" | "REJECTED"
    private String photoUrl;
    private String comment;
    private LocalDateTime createdAt;

    // 신청자 정보
    private String userName;
    private String teamName;
    private String groupName;

    // 처리 정보 (히스토리 전용)
    private String approvedByName;  // 처리한 관리자 이름
    private String rejectedReason;  // 반려 사유 (REJECTED일 때만)

    public static AdminHistoryDTO from(RunningRecord record) {
        Member member = record.getMember();
        Member admin  = record.getApprovedBy(); // findHistory()에서 JOIN FETCH 보장

        return AdminHistoryDTO.builder()
                .id(record.getId())
                .distance(record.getDistance())
                .duration(record.getDuration())
                .runningDate(record.getRunningDate().toString())
                .status(record.getStatus())
                .photoUrl(record.getPhotoUrl())
                .comment(record.getComment())
                .createdAt(record.getCreatedAt())
                .userName(member.getName())
                .teamName(member.getTeam() != null ? member.getTeam().getTeamName() : null)
                .groupName(member.getRunningGroup() != null ? member.getRunningGroup().getGroupName() : null)
                .approvedByName(admin != null ? admin.getName() : null)
                .rejectedReason(record.getRejectedReason())
                .build();
    }
}
