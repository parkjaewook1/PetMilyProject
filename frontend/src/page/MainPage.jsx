import React, { useEffect, useState } from "react";
import axios from "@api/axiosConfig";
import { Fade, Flex, Image } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  ViewIcon,
} from "@chakra-ui/icons";
import "./MainPage.css";

// 🎠 [최종 수정] 테두리 없고 너비가 꽉 찬 슬라이더
const CardCarousel = ({ images }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slidesCount = images.length;

  // 자동 슬라이드 (3초마다)
  useEffect(() => {
    const autoSlide = setInterval(() => {
      setCurrentSlide((s) => (s === slidesCount - 1 ? 0 : s + 1));
    }, 3000);
    return () => clearInterval(autoSlide);
  }, [slidesCount]);

  const prevSlide = () => {
    setCurrentSlide((s) => (s === 0 ? slidesCount - 1 : s - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((s) => (s === slidesCount - 1 ? 0 : s + 1));
  };

  return (
    <div className="journal-photo" aria-label="반려동물 사진 모음">
      <div className="journal-photo-window">
        <Flex
          w="full"
          h="full"
          transition="transform 0.5s ease-in-out"
          transform={`translateX(-${currentSlide * 100}%)`}
        >
          {images.map((img, index) => (
            <div className="journal-slide" key={index}>
              <img
                src={img}
                alt={
                  [
                    "하얀 강아지의 작은 순간",
                    "품에 안긴 고양이들",
                    "함께하는 반려동물의 일상",
                  ][index]
                }
              />
            </div>
          ))}
        </Flex>
      </div>
      <div className="journal-photo-caption">
        <span>함께라서, 평범한 날도 특별하게.</span>
        <div className="journal-photo-controls">
          <button aria-label="previous slide" onClick={prevSlide}>
            <ChevronLeftIcon />
          </button>
          <span className="journal-slide-number">
            0{currentSlide + 1} / 0{slidesCount}
          </span>
          <button aria-label="next slide" onClick={nextSlide}>
            <ChevronRightIcon />
          </button>
        </div>
      </div>
      <div className="journal-photo-dots">
        {images.map((_, index) => (
          <button
            key={index}
            aria-label={`사진 ${index + 1} 보기`}
            aria-pressed={currentSlide === index}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export const MainPage = () => {
  const [latestBoards, setLatestBoards] = useState([]);
  const [popularBoards, setPopularBoards] = useState([]);
  const [showLogo, setShowLogo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // ✅ 고정된 3장의 사진
  const images = ["/img/dog1.png", "/img/cat1.png", "/img/juntos2.png"];

  const handleSearchClick = () => {
    const searchParams = new URLSearchParams();
    searchParams.append("keyword", searchQuery);
    navigate(`board/list?${searchParams.toString()}`);
  };

  const handleTagClick = (tag) => {
    const keyword = tag.replace("#", "");
    setSearchQuery(keyword);
    const searchParams = new URLSearchParams();
    searchParams.append("keyword", keyword);
    navigate(`board/list?${searchParams.toString()}`);
  };

  useEffect(() => {
    const fetchLatestBoards = async () => {
      try {
        const res = await axios.get("/api/board/latest");
        setLatestBoards(res.data);
      } catch (error) {
        console.error("Error fetching latest boards:", error);
      }
    };

    const fetchPopularBoards = async () => {
      try {
        const res = await axios.get("/api/board/popular");
        setPopularBoards(res.data);
      } catch (error) {
        console.error("Error fetching popular boards:", error);
      }
    };

    fetchLatestBoards();
    fetchPopularBoards();

    const isFirstVisit = !sessionStorage.getItem("visited");
    if (isFirstVisit) {
      setShowLogo(true);
      sessionStorage.setItem("visited", "true");
      setTimeout(() => {
        setShowLogo(false);
      }, 2000);
    }
  }, []);

  return (
    <main className="petmily-journal">
      <Fade in={showLogo} unmountOnExit>
        <Flex
          justify="center"
          align="center"
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100vh"
          bg="#faf8f4"
          zIndex="1000"
        >
          <Image src="/img/petmily-logo.png" w="25%" alt="Petmily" />
        </Flex>
      </Fade>

      <div className="journal-masthead">
        <span>THE PETMILY JOURNAL</span>
        <span>우리의 일상, 함께 쓰는 이야기</span>
      </div>
      <section className="journal-opening" aria-labelledby="journal-title">
        <div className="journal-intro">
          <p className="journal-eyebrow">반려생활의 기록장</p>
          <h1 id="journal-title">
            작은 발자국,
            <br />
            오래 남을 <em>이야기.</em>
          </h1>
          <p className="journal-description">
            산책길의 발견부터 오늘의 귀여움까지.
            <br />
            우리 아이와 함께하는 하루를 나눠요.
          </p>
          <div className="journal-search">
            <label htmlFor="journal-search-input">
              어떤 이야기가 궁금하세요?
            </label>
            <div className="journal-search-field">
              <input
                id="journal-search-input"
                placeholder="반려생활 이야기 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSearchClick();
                }}
              />
              <button onClick={handleSearchClick}>
                검색 <span aria-hidden="true">↗</span>
              </button>
            </div>
            <div className="journal-tags">
              {["#강아지", "#고양이", "#동물병원", "#산책코스"].map((tag) => (
                <button key={tag} onClick={() => handleTagClick(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        <figure className="journal-feature">
          <span className="journal-photo-label">MOMENTS TO KEEP</span>
          <CardCarousel images={images} />
        </figure>
      </section>

      <div className="journal-content">
        <section className="journal-latest" aria-labelledby="latest-title">
          <div className="journal-section-heading">
            <div>
              <p className="journal-eyebrow">COMMUNITY / RECENT</p>
              <h2 id="latest-title">이웃들의 오늘</h2>
            </div>
            <button
              className="journal-more"
              onClick={() => navigate("/board/list")}
            >
              전체보기 <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className="journal-list">
            {latestBoards.length === 0 && (
              <div className="journal-empty">
                <span>아직 펼쳐지지 않은 이야기</span>
                <p>
                  게시글을 불러오지 못했거나 등록된 글이 없어요.
                  <br />
                  전체보기에서 이웃들의 이야기를 확인해 보세요.
                </p>
              </div>
            )}
            {latestBoards.slice(0, 5).map((board) => (
              <button
                className="journal-post"
                key={board.id}
                onClick={() => navigate(`/board/${board.id}`)}
              >
                <span className="journal-post-body">
                  <strong>{board.title}</strong>
                  <span className="journal-post-meta">
                    <span>{board.writer}</span>
                    <span>
                      {board.inserted
                        ? new Date(board.inserted).toLocaleDateString()
                        : ""}
                    </span>
                  </span>
                </span>
                <span className="journal-views">
                  <ViewIcon />
                  <span>{board.views}</span>
                  <span className="journal-sr-only">조회</span>
                </span>
              </button>
            ))}
          </div>
        </section>
        <aside className="journal-popular" aria-labelledby="popular-title">
          <div className="journal-section-heading">
            <div>
              <p className="journal-eyebrow">COMMUNITY / POPULAR</p>
              <h2 id="popular-title">함께 읽는 이야기</h2>
            </div>
            <button
              className="journal-more"
              onClick={() => navigate("/board/list?type=best")}
              aria-label="인기 글 전체보기"
            >
              ↗
            </button>
          </div>
          <div className="journal-list">
            {popularBoards.length === 0 && (
              <div className="journal-empty">
                <span>함께 읽을 이야기를 기다려요</span>
                <p>
                  인기 글을 불러오지 못했거나
                  <br />
                  아직 등록된 글이 없어요.
                </p>
              </div>
            )}
            {popularBoards.slice(0, 5).map((board, index) => (
              <button
                className="journal-post journal-ranked-post"
                key={board.id}
                onClick={() => navigate(`/board/${board.id}`)}
              >
                <span className="journal-rank">0{index + 1}</span>
                <span className="journal-post-body">
                  <strong>{board.title}</strong>
                  <span className="journal-post-meta">{board.writer}</span>
                </span>
                <span className="journal-likes">
                  <StarIcon />
                  <span>{board.numberOfLikes}</span>
                  <span className="journal-sr-only">좋아요</span>
                </span>
              </button>
            ))}
          </div>
          <div className="journal-note">
            <span>기록해 두고 싶은 하루</span>
            <p>
              나만의 미니홈피에 일기를 쓰고,
              <br />
              달력에 소중한 날을 남겨보세요.
            </p>
            <small>로그인 후 내 메뉴에서 다이어리를 열 수 있어요.</small>
          </div>
        </aside>
      </div>
      <footer className="journal-footer">
        <span>Petmily</span>
        <p>너와 나의 하루가 모이는 곳.</p>
        <span>함께 쓰는 반려생활</span>
      </footer>
    </main>
  );
};
