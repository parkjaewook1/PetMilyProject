import { forwardRef } from "react";
import { Avatar, useColorModeValue } from "@chakra-ui/react";
import PropTypes from "prop-types";
import { journalTokens } from "../design/journalTokens.js";

/** Display only: retain the caller's URL, size, shape, ref and event handlers.
 * Names and custom icons never replace a missing portrait. Chakra retries a new src.
 */
export const ProfileAvatar = forwardRef(function ProfileAvatar(
  { src, ...props },
  ref,
) {
  const background = useColorModeValue(
    journalTokens.colors.avatar,
    journalTokens.colors.dark.avatar,
  );
  const foreground = useColorModeValue(
    journalTokens.colors.muted,
    journalTokens.colors.dark.muted,
  );
  const imageSrc = typeof src === "string" && src.trim() ? src : undefined;

  return (
    <Avatar
      bg={background}
      color={foreground}
      aria-label="회원 프로필 이미지"
      alt="회원 프로필 사진"
      {...props}
      ref={ref}
      src={imageSrc}
      name={undefined}
      iconLabel="회원 프로필 이미지"
      icon={
        <svg
          viewBox="0 0 32 32"
          width="60%"
          height="60%"
          role="img"
          aria-label="기본 프로필 이미지"
          focusable="false"
          data-default-profile-icon="true"
          style={{ color: foreground }}
        >
          <circle cx="16" cy="10" r="5.5" fill="currentColor" />
          <path
            d="M5 28v-2.5C5 20.8 9.9 18 16 18s11 2.8 11 7.5V28H5Z"
            fill="currentColor"
          />
        </svg>
      }
      data-profile-avatar="true"
    />
  );
});

ProfileAvatar.propTypes = { src: PropTypes.string };
