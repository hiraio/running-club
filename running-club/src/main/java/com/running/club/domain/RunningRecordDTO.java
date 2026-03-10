package com.running.club.domain;

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
    private LocalDateTime createdAt;
    
    // 나중에 "팀 정보"나 "작성자 이름"이 필요할 때 여기에 추가하면 됩니다.
    private String userName; 

    // 엔티티를 DTO로 변환하는 정적 팩토리 메서드
    public static RunningRecordDTO from(RunningRecord record) {
        return RunningRecordDTO.builder()
                .id(record.getId())
                .distance(record.getDistance())
                .duration(record.getDuration())
                .runningDate(record.getRunningDate().toString())
                .status(record.getStatus())
                .photoUrl(record.getPhotoUrl())
                .createdAt(record.getCreatedAt())
                .userName(record.getMember().getName()) // 작성자 이름 미리 추가 (확장성)
                .build();
    }
}