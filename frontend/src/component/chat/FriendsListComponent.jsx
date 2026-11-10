import { fullSurfaceStyle } from "../../design/fullAuditStyles.js";
import { ProfileAvatar } from "../ProfileAvatar.jsx";
import React, { useContext, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
  VStack,
  useMediaQuery,
} from "@chakra-ui/react";
import { ChatIcon, DeleteIcon, MinusIcon } from "@chakra-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import axios from "@api/axiosConfig";
import { LoginContext } from "../LoginProvider.jsx";
import { generateDiaryId } from "../../util/util";

export const FriendsListComponent = ({ onSelectFriend, newMessages = {} }) => {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(true);

  const { memberInfo } = useContext(LoginContext);
  const memberId = memberInfo ? memberInfo.id : null;

  // Draggable nodeRef 설정
  const nodeRef = useRef(null);
  const [canDrag] = useMediaQuery("(min-width: 1024px)");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragBounds, setDragBounds] = useState({});

  useEffect(() => {
    const resetPosition = () => setPosition({ x: 0, y: 0 });
    window.addEventListener("resize", resetPosition);
    return () => window.removeEventListener("resize", resetPosition);
  }, []);

  const toggleMinimize = () => {
    setPosition({ x: 0, y: 0 });
    setIsMinimized(!isMinimized);
  };

  const fetchFriends = async () => {
    if (memberId) {
      try {
        const response = await axios.get(`/api/friends/${memberId}`);
        const friendsData = response.data;

        const friendsWithImages = await Promise.all(
          friendsData.map(async (friend) => {
            try {
              const profileResponse = await axios.get(
                `/api/member/${friend.id}`,
              );
              return {
                ...friend,
                profileImage: profileResponse.data.imageUrl,
              };
            } catch (error) {
              console.error("Error fetching profile image:", error);
              return {
                ...friend,
                profileImage: null,
              };
            }
          }),
        );

        setFriends(friendsWithImages);
      } catch (error) {
        console.error("There was an error fetching the friends!", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
    }
  };

  const deleteFriend = (friendId) => {
    if (memberId) {
      axios
        .delete(`/api/friends/delete`, { params: { memberId, friendId } })
        .then((response) => {
          fetchFriends();
        })
        .catch((error) => {
          console.error("There was an error deleting the friend!", error);
        });
    }
  };

  useEffect(() => {
    fetchFriends();

    const intervalId = setInterval(() => {
      fetchFriends();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [memberId]);

  return (
    <>
      <Draggable
        nodeRef={nodeRef}
        handle=".drag-handle"
        cancel="button"
        disabled={!canDrag}
        position={position}
        bounds={dragBounds}
        onStart={() => {
          if (document.querySelector(".pet-chat")) return false;
          const rect = nodeRef.current.getBoundingClientRect();
          setDragBounds({
            left: position.x - rect.left + 12,
            right: position.x + window.innerWidth - rect.right - 12,
            top: position.y - rect.top + 12,
            bottom: position.y + window.innerHeight - rect.bottom - 12,
          });
        }}
        onDrag={(_, data) => setPosition({ x: data.x, y: data.y })}
      >
        <Box
          ref={nodeRef}
          position="fixed"
          bottom="20px"
          right="20px"
          borderWidth="1px"
          borderRadius="md"
          p="4"
          bg="white"
          boxShadow="dark-lg"
          width="300px"
          h={isMinimized ? "auto" : "400px"}
          overflow="auto"
          zIndex="9999"
          sx={fullSurfaceStyle}
          className="full-journal full-friends pet-friends"
          data-minimized={isMinimized}
          role="region"
          aria-label="친구 목록"
        >
          <Box
            className="drag-handle"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            position="sticky"
            top="0"
            bg="white"
            zIndex="1"
            borderBottomWidth="1px"
            p={2}
            h="50px"
            cursor="move"
          >
            <Text fontSize="xl" fontWeight="bold">
              친구 리스트
            </Text>
            <IconButton
              onMouseDown={(e) => e.stopPropagation()}
              icon={
                isMinimized ? <FontAwesomeIcon icon={faPlus} /> : <MinusIcon />
              }
              size="sm"
              onClick={toggleMinimize}
              aria-label={isMinimized ? "친구 목록 펼치기" : "친구 목록 접기"}
              aria-expanded={!isMinimized}
              aria-controls="pet-friends-list"
            />
          </Box>
          {!isMinimized &&
            (isLoading ? (
              <Box p={4}>
                <Text>Loading...</Text>
              </Box>
            ) : (
              !isMinimized && (
                <Box mt="4" id="pet-friends-list" className="pet-friends-list">
                  <VStack align="start" spacing={3}>
                    {friends.length === 0 ? (
                      <Text>친구가 없습니다.</Text>
                    ) : (
                      friends.map((friend, index) => (
                        <Flex
                          key={index}
                          width="100%"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <HStack spacing={2} minW={0} flex={1}>
                            <Box position="relative">
                              <ProfileAvatar
                                src={friend.profileImage}
                                boxSize="35px"
                                alt={`${friend.nickname}의 프로필 이미지`}
                              />
                              <Box
                                position="absolute"
                                top="0"
                                right="0"
                                boxSize="10px"
                                borderRadius="full"
                                bg={friend.online ? "green.400" : "gray.400"}
                                border="2px solid white"
                              />
                            </Box>
                            <Text
                              title={friend.nickname}
                              maxW="100px"
                              whiteSpace="nowrap"
                              overflow="hidden"
                              textOverflow="ellipsis"
                            >
                              {friend.nickname}
                            </Text>
                            {newMessages[friend.id] && (
                              <Box
                                as="span"
                                borderRadius="full"
                                bg="red.400"
                                boxSize="8px"
                              />
                            )}
                          </HStack>
                          <HStack spacing={1}>
                            <Button
                              size="sm"
                              variant="journalOutline"
                              aria-label={`${friend.nickname}님의 미니홈피`}
                              onClick={() =>
                                navigate(`/diary/${generateDiaryId(friend.id)}`)
                              }
                            >
                              <FontAwesomeIcon icon={faHouse} />
                            </Button>
                            <Button
                              size="sm"
                              variant="journalOutline"
                              aria-label={`${friend.nickname}님과 대화`}
                              onClick={() => {
                                setIsMinimized(true);
                                setPosition({ x: 0, y: 0 });
                                onSelectFriend({
                                  nickname: friend.nickname,
                                  id: friend.id,
                                });
                              }}
                            >
                              <ChatIcon />
                            </Button>
                            <Button
                              size="sm"
                              variant="journalOutline"
                              aria-label={`${friend.nickname}님 친구 삭제`}
                              onClick={() => deleteFriend(friend.id)}
                            >
                              <DeleteIcon />
                            </Button>
                          </HStack>
                        </Flex>
                      ))
                    )}
                  </VStack>
                </Box>
              )
            ))}
        </Box>
      </Draggable>
    </>
  );
};
