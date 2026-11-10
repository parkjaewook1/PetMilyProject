package com.backend.dto.member;

import java.util.List;

public record AdminMemberPage(List<AdminMemberSummary> members, int totalPages, int currentPage) {}
