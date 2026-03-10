package com.running.club.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.running.club.domain.Member;
import com.running.club.domain.RunningRecord;

public interface RunningRecordRepository extends JpaRepository<RunningRecord, Integer> {
    // 동일한 사진으로 중복 인증하는 것을 방지
    boolean existsByPhotoHash(String photoHash);
    
 // 회원 정보로 검색하고, 최신순(ID 내림차순 또는 CreatedAt 내림차순)으로 정렬
    List<RunningRecord> findByMemberOrderByCreatedAtDesc(Member member);
    

 // RunningRecordRepository.java
    List<RunningRecord> findByMember_TeamIdOrderByCreatedAtDesc(Integer teamId);
}