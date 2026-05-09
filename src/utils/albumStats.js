// Aggregate user progress against the generated album.
// Missing stickers are derived (allStickers - ownedStickers); never stored.

export function computeAlbumStats(album, progress) {
  const stickers = album?.stickers || [];
  const owned = progress?.owned || {};
  const duplicates = progress?.duplicates || {};

  const total = stickers.length;
  let obtained = 0;
  let specialObtained = 0;
  const specialTotal = album?.specialTotal || 0;

  for (const s of stickers) {
    if (owned[s.code]) {
      obtained += 1;
      if (s.isSpecial) specialObtained += 1;
    }
  }

  const missing = total - obtained;
  const repeatedUnique = Object.values(duplicates).filter((n) => Number(n) > 0).length;
  const repeatedCopies = Object.values(duplicates).reduce(
    (sum, n) => sum + (Number.isFinite(Number(n)) && Number(n) > 0 ? Number(n) : 0),
    0,
  );
  const percent = total === 0 ? 0 : Math.round((obtained / total) * 100);

  return {
    total,
    obtained,
    missing,
    specialTotal,
    specialObtained,
    repeatedUnique,
    repeatedCopies,
    percent,
  };
}

export function computeTeamStats(team, album, progress) {
  const owned = progress?.owned || {};
  const duplicates = progress?.duplicates || {};
  const stickerIds = team?.stickerIds || [];
  let obtained = 0;
  let repeated = 0;
  for (const id of stickerIds) {
    if (owned[id]) obtained += 1;
    const dup = Number(duplicates[id]) || 0;
    if (dup > 0) repeated += 1;
  }
  return {
    total: stickerIds.length,
    obtained,
    missing: stickerIds.length - obtained,
    repeatedUnique: repeated,
  };
}
