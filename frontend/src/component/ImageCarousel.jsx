// src/component/ImageCarousel.jsx
import { Box, Image } from "@chakra-ui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const ImageCarousel = ({ images }) => {
  return (
    <Box w="100%" maxW="1000px" mx="auto" mb={12}>
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        autoplay={{ delay: 3000 }}
        loop
      >
        {images.map((src, idx) => (
          <SwiperSlide key={idx}>
            <Image
              src={src}
              alt={`slide-${idx}`}
              borderRadius="md"
              w="100%"
              h="400px"
              objectFit="cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
};

export default ImageCarousel;
