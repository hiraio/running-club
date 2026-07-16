package com.running.club.dto.bingo;

import com.running.club.domain.BingoMission;
import com.running.club.domain.BingoSubmission;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 빙고판 전체 응답 — 미션 목록 + 조별 제출 현황 포함.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BingoBoardResponse {

    private Integer boardId;
    private String title;
    private Integer size;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<MissionDTO> missions;
    private List<SubmissionDTO> submissions;
    private List<GroupDTO> groups;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupDTO {
        private Integer groupId;
        private String groupName;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MissionDTO {
        private Integer id;
        private Integer position;
        private String title;
        private String description;

        public static MissionDTO from(BingoMission m) {
            return MissionDTO.builder()
                    .id(m.getId())
                    .position(m.getPosition())
                    .title(m.getTitle())
                    .description(m.getDescription())
                    .build();
        }
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmissionDTO {
        private Integer id;
        private Integer missionId;
        private Integer position;
        private String missionTitle;
        private Integer groupId;
        private String groupName;
        private String status;
        private String submittedByName;
        private String submittedAt;
        private String verifiedAt;
        private String rejectReason;
        private List<String> photoUrls;

        public static SubmissionDTO from(BingoSubmission s) {
            return SubmissionDTO.builder()
                    .id(s.getId())
                    .missionId(s.getMission().getId())
                    .position(s.getMission().getPosition())
                    .missionTitle(s.getMission().getTitle())
                    .groupId(s.getGroup().getId())
                    .groupName(s.getGroup().getGroupName())
                    .status(s.getStatus().name())
                    .submittedByName(s.getSubmittedBy().getName())
                    .submittedAt(s.getSubmittedAt() != null ? s.getSubmittedAt().toString() : null)
                    .verifiedAt(s.getVerifiedAt() != null ? s.getVerifiedAt().toString() : null)
                    .rejectReason(s.getRejectReason())
                    .photoUrls(s.getPhotoUrls())
                    .build();
        }
    }
}
