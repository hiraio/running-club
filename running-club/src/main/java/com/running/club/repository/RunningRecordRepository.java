package com.running.club.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.running.club.domain.RunningRecord;

public interface RunningRecordRepository extends JpaRepository<RunningRecord, Integer> {
    // 동일한 사진으로 중복 인증하는 것을 방지
    boolean existsByPhotoHash(String photoHash);
}