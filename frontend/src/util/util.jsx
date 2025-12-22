// utils.js
// id => diaryId 변환
export function generateDiaryId(userId) {
  const id = Number(userId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return `DIARY-${id * 17}-ID`;
}

// diaryId => id 변환
export function extractUserIdFromDiaryId(diaryId) {
  if (!diaryId) return null;

  const parts = diaryId.split("-");
  if (parts.length !== 3) return null;
  if (parts[0] !== "DIARY" || parts[2] !== "ID") return null;

  const encoded = Number(parts[1]);
  if (!Number.isFinite(encoded) || encoded <= 0) return null;

  const userId = encoded / 17;
  if (!Number.isInteger(userId) || userId <= 0) return null;

  return userId;
}
