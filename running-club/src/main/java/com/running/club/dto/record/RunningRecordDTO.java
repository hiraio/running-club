package com.running.club.dto.record;

import com.running.club.domain.Member;
import com.running.club.domain.RunningRecord;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RunningRecordDTO {

    private Integer id;
    private Double distance;
    private Integer duration;
    private String runningDate;
    private String status;
    private String photoUrl;
    private String comment;
    private LocalDateTime createdAt;

    private String userName;
    private String teamName;
    private String groupName;

    public static RunningRecordDTO from(RunningRecord record) {
        Member member = record.getMember();
        return RunningRecordDTO.builder()
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
                .build();
    }
}
