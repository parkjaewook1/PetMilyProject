import { fullSurfaceStyle } from "../../design/fullAuditStyles.js";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import axios from "@api/axiosConfig";
import { CommentComponent } from "../../component/place/CommentComponent.jsx";
import { StarIcon } from "@chakra-ui/icons";
import { FaDirections, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import hospitalImage from "/public/img/hospital.jpg";

export function PlaceReview() {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);

  useEffect(() => {
    axios.get(`/api/place/map/${id}`).then((res) => setHospital(res.data));
  }, [id]);

  if (hospital === null) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        sx={fullSurfaceStyle}
        className="full-journal full-place-review"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box
      maxW="800px"
      mx="auto"
      p={5}
      boxShadow="lg"
      borderRadius="md"
      bg="#F8F8FF"
      sx={fullSurfaceStyle}
      className="full-journal full-place-review"
    >
      <Box mb={5}>
        <Image
          src={hospitalImage}
          alt="병원 사진"
          borderRadius="md"
          boxSize="100%"
          objectFit="cover"
          maxHeight="400px"
        />
      </Box>
      <Box mb={5}>
        <Text fontSize="2xl" fontWeight="bold">
          {hospital.name}
        </Text>
        <Flex alignItems="center" mb={2}>
          <StarIcon color="teal.500" />
          <Text ml={2} fontSize="lg">
            {hospital.rating}
          </Text>
        </Flex>
        <Flex mb={4}>
          <Button
            isDisabled
            title="길찾기 준비 중"
            leftIcon={<FaMapMarkerAlt />}
            colorScheme="teal"
            variant="journalOutline"
            mr={2}
          >
            출발 · 준비 중
          </Button>
          <Button
            isDisabled
            title="길찾기 준비 중"
            leftIcon={<FaDirections />}
            colorScheme="teal"
            variant="journal"
          >
            도착 · 준비 중
          </Button>
        </Flex>
      </Box>
      <Box mb={5}>
        <FormControl>
          <FormLabel variant="journal">병원주소</FormLabel>
          <Input value={hospital.address} readOnly variant="journal" />
        </FormControl>
      </Box>
      <Box mb={5}>
        <FormControl>
          <FormLabel variant="journal">병원번호</FormLabel>
          <Input value={hospital.callNumber} readOnly variant="journal" />
        </FormControl>
      </Box>
      <Box>
        <Flex justifyContent="space-around" mb={5}>
          <Button
            isDisabled
            leftIcon={<FaPhone />}
            bgColor="#4682B4"
            color="white"
            variant="journal"
          >
            문의 · 준비 중
          </Button>
          <Button isDisabled bgColor="#4682B4" color="white" variant="journal">
            예약 · 준비 중
          </Button>
          <Button isDisabled bgColor="#4682B4" color="white" variant="journal">
            거리뷰 · 준비 중
          </Button>
          <Button isDisabled bgColor="#4682B4" color="white" variant="journal">
            공유 · 준비 중
          </Button>
        </Flex>
      </Box>
      <Box mt={8}>
        <Text fontSize="xl" mb={4}>
          리뷰
        </Text>
        <CommentComponent hospitalId={hospital.id} />
      </Box>
    </Box>
  );
}
