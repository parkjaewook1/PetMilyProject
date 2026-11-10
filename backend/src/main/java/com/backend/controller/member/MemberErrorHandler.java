package com.backend.controller.member;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/** Do not return SQL, bound values or credential parser details in member errors. */
@RestControllerAdvice(assignableTypes = {MemberController.class, ReissueController.class})
public class MemberErrorHandler {
    @ExceptionHandler(DataAccessException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String,String> databaseError() { return Map.of("error", "member_request_failed"); }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String,String> invalidRequest() { return Map.of("error", "invalid_member_request"); }
}
