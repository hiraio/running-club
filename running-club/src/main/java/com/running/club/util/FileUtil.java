package com.running.club.util;

import java.io.File;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

public class FileUtil {

    // SHA-256 해시 추출 (중복 사진 방지용)
    public static String getSHA256Hash(MultipartFile file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream fis = file.getInputStream()) {
            byte[] byteArray = new byte[1024];
            int bytesCount;
            while ((bytesCount = fis.read(byteArray)) != -1) {
                digest.update(byteArray, 0, bytesCount);
            }
        }
        StringBuilder sb = new StringBuilder();
        for (byte b : digest.digest()) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // 파일을 디스크에 저장하고 URL 경로 반환
    public static String saveFile(MultipartFile file, String uploadDir) throws Exception {
        // 1. 저장 폴더 없으면 자동 생성
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        // 2. UUID 기반 파일명 생성 (원본 파일명 충돌 및 경로 조작 공격 방지)
        String originalName = file.getOriginalFilename();
        String ext = (originalName != null && originalName.contains("."))
                ? originalName.substring(originalName.lastIndexOf("."))
                : "";
        String savedFileName = UUID.randomUUID().toString() + ext;

        // 3. 디스크에 저장
        File dest = new File(uploadDir + "/" + savedFileName);
        file.transferTo(dest);

        // 4. DB에 저장할 URL 경로 반환 ("/photos/파일명.jpg")
        return "/photos/" + savedFileName;
    }
}
