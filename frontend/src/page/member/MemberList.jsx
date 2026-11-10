import { fullSurfaceStyle } from "../../design/fullAuditStyles.js";
import { useCallback, useContext, useEffect, useState } from "react";
import "./MemberList.css";
import {
  Box,
  Button,
  Input,
  Center,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import axios from "@api/axiosConfig";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../component/LoginProvider";
import Pagination from "../../component/Pagination.jsx";

export function MemberList() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { memberInfo } = useContext(LoginContext);

  const fetchMembers = useCallback(
    (page) => {
      setIsLoading(true);
      setLoadError(false);
      return axios
        .get(`/api/member/list?page=${page}&pageSize=10`)
        .then((response) => {
          const lastPage = Math.max(1, response.data.totalPages);
          if (page > lastPage) {
            setQuery("");
            setCurrentPage(lastPage);
          }
          setMembers(response.data.members);
          setTotalPages(response.data.totalPages);
        })
        .catch(() => {
          setLoadError(true);
          toast({
            status: "error",
            description: "회원 목록을 가져오는 데 실패했습니다.",
            position: "top",
            duration: 3000,
          });
        })
        .finally(() => setIsLoading(false));
    },
    [toast],
  );

  useEffect(() => {
    if (memberInfo?.role === "ROLE_ADMIN") {
      fetchMembers(currentPage);
    } else {
      setIsLoading(false);
    }
  }, [memberInfo, currentPage, fetchMembers]);

  function handlePageButtonClick(pageNumber) {
    setQuery("");
    setCurrentPage(pageNumber);
  }

  // 가입일시 포맷
  function formatDate(dateString) {
    const optionsDate = { year: "numeric", month: "2-digit", day: "2-digit" };
    const optionsTime = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    const date = new Date(dateString);
    const formattedDate = new Intl.DateTimeFormat("ko-KR", optionsDate)
      .format(date)
      .replace(/\./g, "-")
      .replace(/ /g, "")
      .replace(/-$/, "");
    const formattedTime = new Intl.DateTimeFormat("ko-KR", optionsTime)
      .format(date)
      .replace(/ /g, "");

    return `${formattedDate} / ${formattedTime}`;
  }

  function handleDeleteMember(id) {
    if (memberInfo?.role !== "ROLE_ADMIN" || deletingId !== null) return;
    Swal.fire({
      title: "정말 삭제하시겠습니까?",
      text: "삭제된 회원은 복구할 수 없습니다.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
      focusCancel: true,
      customClass: { popup: "admin-members-dialog" },
    }).then((result) => {
      if (result.isConfirmed) {
        setDeletingId(id);
        axios
          .delete(`/api/member/${id}`, {
            withCredentials: true,
          })
          .then(() => {
            toast({
              status: "success",
              description: "회원이 삭제되었습니다.",
              position: "top",
              duration: 3000,
            });
            fetchMembers(currentPage);
          })
          .catch((error) => {
            const status = error.response?.status;
            if (status === 404) fetchMembers(currentPage);
            toast({
              status: "error",
              description:
                status === 409
                  ? "관리자 계정 또는 연관 데이터가 있는 회원은 삭제할 수 없습니다."
                  : status === 404
                    ? "이미 삭제되었거나 존재하지 않는 회원입니다."
                    : "회원 삭제에 실패했습니다.",
              position: "top",
              duration: 3000,
            });
          })
          .finally(() => setDeletingId(null));
      }
    });
  }

  if (memberInfo === null || memberInfo?.role !== "ROLE_ADMIN") {
    return (
      <Center
        className="full-journal full-notice"
        sx={fullSurfaceStyle}
        role="alert"
      >
        <Text>접근 권한이 없습니다.</Text>
      </Center>
    );
  }

  const keyword = query.trim().toLocaleLowerCase();
  const visibleMembers = members.filter((member) =>
    [member.id, member.username, member.nickname].some((value) =>
      String(value ?? "")
        .toLocaleLowerCase()
        .includes(keyword),
    ),
  );
  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPage + index,
  );

  return (
    <Container className="full-journal admin-members" sx={fullSurfaceStyle}>
      <Box as="header" className="admin-members-header">
        <Text className="admin-members-eyebrow">PETMILY / ADMIN</Text>
        <Heading as="h1">회원 관리</Heading>
        <Text>회원 정보를 확인하고 수정하거나 관리할 수 있습니다.</Text>
      </Box>

      <Box className="admin-members-search">
        <Text as="label" htmlFor="admin-member-search">
          현재 페이지에서 검색
        </Text>
        <Flex gap={2}>
          <Input
            id="admin-member-search"
            type="search"
            variant="journal"
            placeholder="이메일, 닉네임 또는 ID"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            isDisabled={isLoading || loadError}
            aria-describedby="admin-member-search-help"
          />
          <Button
            variant="journalOutline"
            onClick={() => setQuery("")}
            isDisabled={!query}
          >
            초기화
          </Button>
        </Flex>
        <Text id="admin-member-search-help">
          불러온 최대 10명 안에서 검색합니다. 페이지를 이동하면 검색어가
          초기화됩니다.
        </Text>
      </Box>

      <Box aria-busy={isLoading}>
        {isLoading ? (
          <Center className="admin-members-state" role="status">
            <Spinner size="sm" />
            <Text>회원 목록을 불러오는 중입니다.</Text>
          </Center>
        ) : loadError ? (
          <Box className="admin-members-state" role="alert">
            <Text>회원 목록을 불러오지 못했습니다.</Text>
            <Button
              variant="journalOutline"
              onClick={() => fetchMembers(currentPage)}
            >
              다시 시도
            </Button>
          </Box>
        ) : visibleMembers.length === 0 ? (
          <Box className="admin-members-state" role="status">
            <Text>
              {keyword
                ? "검색 조건에 맞는 회원이 없습니다."
                : "표시할 회원이 없습니다."}
            </Text>
            {keyword && (
              <Button variant="journalOutline" onClick={() => setQuery("")}>
                검색어 지우기
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Text className="admin-members-count" role="status">
              현재 페이지 {visibleMembers.length}명
              {keyword && ` / 조회 ${members.length}명`}
            </Text>
            <TableContainer className="admin-members-table-wrap">
              <Table
                className="admin-members-table"
                aria-label="관리자 회원 목록"
                variant="simple"
              >
                <Thead>
                  <Tr>
                    <Th scope="col">ID</Th>
                    <Th scope="col">이메일</Th>
                    <Th scope="col">닉네임</Th>
                    <Th scope="col">성별</Th>
                    <Th scope="col">생년월일</Th>
                    <Th scope="col">가입일시</Th>
                    <Th scope="col">회원 관리</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {visibleMembers.map((member) => (
                    <Tr key={member.id}>
                      <Td data-label="ID">
                        <span>{member.id}</span>
                      </Td>
                      <Td data-label="이메일">
                        <span>{member.username}</span>
                      </Td>
                      <Td data-label="닉네임">
                        <span>{member.nickname}</span>
                      </Td>
                      <Td data-label="성별">
                        <span>
                          {member.gender === "male" ? "남성" : "여성"}
                        </span>
                      </Td>
                      <Td data-label="생년월일">
                        <span>{member.birthDate}</span>
                      </Td>
                      <Td data-label="가입일시">
                        <span>{formatDate(member.inserted)}</span>
                      </Td>
                      <Td data-label="회원 관리">
                        <HStack spacing={2}>
                          <Tooltip label="수정" hasArrow>
                            <IconButton
                              variant="journalOutline"
                              aria-label={`${member.nickname} 회원 수정`}
                              icon={<FontAwesomeIcon icon={faEdit} />}
                              onClick={() =>
                                navigate(`/member/edit/${member.id}`)
                              }
                            />
                          </Tooltip>
                          {!["ROLE_ADMIN", "ADMIN"].includes(member.role) && (
                            <Tooltip label="삭제" hasArrow>
                              <IconButton
                                variant="journalOutline"
                                className="admin-members-danger"
                                aria-label={`${member.nickname} 회원 삭제`}
                                isDisabled={deletingId !== null}
                                isLoading={deletingId === member.id}
                                icon={<FontAwesomeIcon icon={faTrash} />}
                                onClick={() => handleDeleteMember(member.id)}
                              />
                            </Tooltip>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
      {!isLoading && !loadError && totalPages > 0 && (
        <Box
          as="nav"
          aria-label="회원 목록 페이지"
          className="admin-members-pagination"
        >
          <Text>
            {currentPage} / {totalPages} 페이지
          </Text>
          <Pagination
            pageInfo={{
              currentPageNumber: currentPage,
              nextPageNumber: currentPage < totalPages ? currentPage + 1 : null,
              prevPageNumber: currentPage > 1 ? currentPage - 1 : null,
              lastPageNumber: totalPages,
            }}
            pageNumbers={pageNumbers}
            handlePageButtonClick={handlePageButtonClick}
          />
        </Box>
      )}
    </Container>
  );
}
