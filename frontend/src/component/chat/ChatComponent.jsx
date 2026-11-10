import { fullSurfaceStyle } from "../../design/fullAuditStyles.js";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Flex,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ChatIcon, MinusIcon } from "@chakra-ui/icons";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import axios from "@api/axiosConfig";
import { LoginContext } from "../LoginProvider";

export const ChatComponent = ({ selectedFriend, onClose, onNewMessage }) => {
  const friendId = selectedFriend?.id;
  const friendNickname = selectedFriend?.nickname;
  const { memberInfo } = useContext(LoginContext) || {};
  const username = memberInfo?.nickname;
  const userId = memberInfo?.id;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const chatRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    return () =>
      requestAnimationFrame(() => {
        const previous = returnFocusRef.current;
        const canRestore =
          previous?.isConnected &&
          previous.getClientRects().length > 0 &&
          previous.matches("button, input, textarea, [tabindex]");
        const target = canRestore
          ? previous
          : document.querySelector(".pet-friends .drag-handle button");
        target?.focus({ preventScroll: true });
      });
  }, []);

  useEffect(() => {
    setIsMinimized(false);
  }, [friendId]);

  useEffect(() => {
    if (!isMinimized) messageInputRef.current?.focus({ preventScroll: true });
  }, [isMinimized, friendId]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const resize = () => {
      chatRef.current?.style.setProperty(
        "--pet-chat-visible-height",
        `${viewport.height}px`,
      );
      chatRef.current?.style.setProperty(
        "--pet-chat-lift",
        `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
      );
    };
    resize();
    viewport.addEventListener("resize", resize);
    viewport.addEventListener("scroll", resize);
    return () => {
      viewport.removeEventListener("resize", resize);
      viewport.removeEventListener("scroll", resize);
    };
  }, []);

  const prevOnNewMessageRef = useRef();

  useEffect(() => {
    if (prevOnNewMessageRef.current !== onNewMessage) {
      console.log("onNewMessage updated:", onNewMessage);
      prevOnNewMessageRef.current = onNewMessage;
    }
  }, [onNewMessage]);

  useEffect(() => {
    console.log("ChatComponent mounted. selectedFriend:", selectedFriend);

    if (username && selectedFriend) {
      const roomId = [userId, friendId].sort((a, b) => a - b).join("-");
      const socket = new SockJS(`/ws`);
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        onConnect: () => {
          client.subscribe(`/topic/chatroom/${roomId}`, (message) => {
            const receivedMessage = JSON.parse(message.body);
            setMessages((prevMessages) => [...prevMessages, receivedMessage]);
            console.log("Received message:", receivedMessage);
            if (onNewMessage && typeof onNewMessage === "function") {
              console.log(
                "Calling onNewMessage with senderId:",
                receivedMessage.senderId,
              );
              onNewMessage(receivedMessage.senderId);
            } else {
              console.log(
                "onNewMessage is not available or not a function:",
                onNewMessage,
              );
            }
          });
          setIsConnected(true);
          setStompClient(client);
          fetchMessagesForRoom(roomId);
        },
        onStompError: (frame) => {
          console.error("Broker error: ", frame.headers["message"], frame.body);
          setIsConnected(false);
        },
        onWebSocketError: (error) => {
          console.error("WebSocket error: ", error);
          setIsConnected(false);
        },
        onDisconnect: () => {
          setIsConnected(false);
        },
      });
      client.activate();

      return () => {
        if (client) {
          client.deactivate();
        }
      };
    }
  }, [username, selectedFriend, onNewMessage, userId, friendId]);

  const fetchMessagesForRoom = async (roomId) => {
    try {
      const response = await axios.get(`/api/chat/messages/${roomId}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    const list = messagesEndRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, isMinimized]);

  const sendMessage = async () => {
    if (!isConnected) {
      return;
    }

    if (!message.trim() || !selectedFriend) {
      return;
    }

    const roomId = [userId, friendId].sort((a, b) => a - b).join("-");
    const chatMessage = {
      senderId: userId,
      recipientId: friendId,
      content: message,
      senderNickName: username,
      recipientNickName: friendNickname,
    };

    stompClient.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(chatMessage),
    });

    try {
      await axios.post("/api/chat", chatMessage);
    } catch (error) {
      console.error("Error saving message to the server:", error);
    }

    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <Box
      ref={chatRef}
      className="full-journal pet-chat"
      sx={fullSurfaceStyle}
      data-minimized={isMinimized}
      role="region"
      aria-label={`${friendNickname}님과 대화`}
    >
      <Flex className="pet-chat-header">
        <Box minW={0}>
          <Text className="pet-chat-caption">친구와 나누는 이야기</Text>
          <Text className="pet-chat-title" title={friendNickname}>
            {friendNickname}
          </Text>
        </Box>
        <HStack spacing={1} flexShrink={0}>
          <IconButton
            icon={isMinimized ? <ChatIcon /> : <MinusIcon />}
            onClick={toggleMinimize}
            aria-label={isMinimized ? "대화창 펼치기" : "대화창 접기"}
            aria-expanded={!isMinimized}
            aria-controls="pet-chat-body"
          />
          <CloseButton aria-label="대화창 닫기" onClick={onClose} />
        </HStack>
      </Flex>
      {!isMinimized && (
        <VStack id="pet-chat-body" className="pet-chat-body" spacing={0}>
          <Text className="pet-chat-status" role="status">
            {isConnected ? "연결됨" : "대화 연결 중…"}
          </Text>
          <Box
            className="pet-chat-messages"
            ref={messagesEndRef}
            role="log"
            aria-label="대화 내역"
            aria-live="polite"
            tabIndex={0}
          >
            {messages.length === 0 && (
              <Text className="pet-chat-empty">
                안부를 전하며 이야기를 시작해 보세요.
              </Text>
            )}
            {messages.map((msg, index) => (
              <Flex
                key={index}
                className="pet-chat-message"
                data-own={Number(msg.senderId) === Number(userId)}
              >
                <Box className="pet-chat-bubble">
                  <Text className="pet-chat-sender">{msg.senderNickName}</Text>
                  <Text className="pet-chat-content">{msg.content}</Text>
                  <Text className="pet-chat-time">
                    {new Date(msg.timestamp).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                    })}
                  </Text>
                </Box>
              </Flex>
            ))}
          </Box>
          <Box className="pet-chat-compose">
            <Text as="label" htmlFor="pet-chat-input">
              메시지
            </Text>
            <Flex gap={2}>
              <Input
                id="pet-chat-input"
                ref={messageInputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요"
                variant="journal"
              />
              <Button
                onClick={sendMessage}
                isDisabled={!isConnected || !message.trim()}
                variant="journal"
              >
                보내기
              </Button>
            </Flex>
          </Box>
        </VStack>
      )}
    </Box>
  );
};
