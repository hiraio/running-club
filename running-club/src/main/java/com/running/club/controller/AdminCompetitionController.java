package com.running.club.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.running.club.domain.CompetitionCreateRequest;
import com.running.club.domain.CompetitionResponse;
import com.running.club.domain.CompetitionSummaryDTO;
import com.running.club.domain.CompetitionUpdateRequest;
import com.running.club.service.AdminCompetitionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/competitions")
public class AdminCompetitionController {

    private final AdminCompetitionService adminCompetitionService;

    // 전체 목록 조회 (팀 수 포함)
    @GetMapping
    public ResponseEntity<List<CompetitionSummaryDTO>> getAll() {
        return ResponseEntity.ok(adminCompetitionService.getAll());
    }

    // 대회 생성
    @PostMapping
    public ResponseEntity<CompetitionResponse> create(@RequestBody CompetitionCreateRequest request) {
        return ResponseEntity.ok(adminCompetitionService.create(request));
    }

    // 대회 수정 (제목, 기간, 활성화 여부)
    @PatchMapping("/{id}")
    public ResponseEntity<CompetitionResponse> update(@PathVariable Integer id,
                                                      @RequestBody CompetitionUpdateRequest request) {
        return ResponseEntity.ok(adminCompetitionService.update(id, request));
    }

    // 대회 삭제 (소속 팀 존재 시 실패)
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Integer id) {
        adminCompetitionService.delete(id);
        return ResponseEntity.ok("대회 #" + id + " 삭제 완료");
    }
}
