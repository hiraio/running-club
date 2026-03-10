package com.running.club.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.running.club.domain.Member;
import com.running.club.domain.RunningRecord;
import com.running.club.domain.RunningRecordDTO;
import com.running.club.repository.RunningRecordRepository;
import com.running.club.util.FileUtil;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RunningRecordService {
    private final RunningRecordRepository runningRecordRepository;

    @Transactional
    public void uploadRecord(Member member, Double distance, Integer duration, 
                             LocalDate runningDate, String comment, MultipartFile file) throws Exception {
        
        // 1. 이미지 해시 추출 및 중복 체크
        String hash = FileUtil.getSHA256Hash(file);
        if (runningRecordRepository.existsByPhotoHash(hash)) {
            throw new IllegalStateException("이미 업로드된 사진입니다. (중복 인증 방지)");
        }

        // 2. 물리적 한계 체크 (페이스 검증)
        // 시속 계산: (거리km / (시간sec/3600))
        double speedKmh = distance / (duration / 3600.0);
        if (speedKmh > 45.0) { // 시속 45km(우사인 볼트 최고 속도) 초과 시 경고
            throw new IllegalArgumentException("페이스가 비정상적으로 빠릅니다. (시속 " + String.format("%.2f", speedKmh) + "km/h)");
        }

        // 3. 파일 저장 로직 (실제 저장 후 경로 반환 필요 - 여기서는 가상 경로)
        String photoUrl = "/store/" + file.getOriginalFilename();

        RunningRecord record = RunningRecord.builder()
                .member(member)
                .distance(distance)
                .duration(duration)
                .runningDate(runningDate)
                .comment(comment)
                .photoUrl(photoUrl)
                .photoHash(hash)
                .build();

        runningRecordRepository.save(record);
    }
    
 // RunningRecordService.java
    public List<RunningRecordDTO> getMyRecords(Member member) {
        return runningRecordRepository.findByMemberOrderByCreatedAtDesc(member)
                .stream()
                .map(RunningRecordDTO::from) // 서비스에서 변환 끝!
                .collect(Collectors.toList());
    }

    public List<RunningRecordDTO> getRecordsByTeamId(Integer teamId) {
        return runningRecordRepository.findByMember_TeamIdOrderByCreatedAtDesc(teamId)
                .stream()
                .map(RunningRecordDTO::from) // 서비스에서 변환 끝!
                .collect(Collectors.toList());
    }
    
    
}
