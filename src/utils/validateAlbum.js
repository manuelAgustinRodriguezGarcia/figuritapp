// Runtime sanity check executed once when the album is generated.
// Throws a clear development error if the album shape ever drifts.

const REQUIRED_FLAG_OVERRIDES = {
  ARG: "ar",
  USA: "us",
  ENG: "gb-eng",
  SCO: "gb-sct",
  CIV: "ci",
  COD: "cd",
  KSA: "sa",
  KOR: "kr",
  RSA: "za",
};

export function validateAlbum(album) {
  const { stickers, teams } = album;

  if (album.total !== 980) {
    throw new Error(`Álbum inválido: se esperaban 980 figuritas, hay ${album.total}.`);
  }
  if (album.specialTotal !== 68) {
    throw new Error(`Álbum inválido: se esperaban 68 especiales, hay ${album.specialTotal}.`);
  }
  if (album.teamsTotal !== 48) {
    throw new Error(`Álbum inválido: se esperaban 48 selecciones, hay ${album.teamsTotal}.`);
  }

  const ids = new Set();
  for (const s of stickers) {
    if (ids.has(s.id)) {
      throw new Error(`Álbum inválido: ID duplicado ${s.id}.`);
    }
    ids.add(s.id);
  }

  for (const team of teams) {
    if (team.stickerIds.length !== 20) {
      throw new Error(`Álbum inválido: la selección ${team.code} tiene ${team.stickerIds.length} figuritas.`);
    }
    const emblems = stickers.filter(
      (s) => s.category === "team" && s.teamCode === team.code && s.type === "foil-emblem",
    );
    if (emblems.length !== 1) {
      throw new Error(`Álbum inválido: la selección ${team.code} debe tener exactamente 1 escudo foil.`);
    }
    if (!team.flagCode) {
      throw new Error(`Álbum inválido: la selección ${team.code} no tiene flagCode.`);
    }
    const colors = team.colors || {};
    if (!colors.primary || !colors.secondary || !colors.accent) {
      throw new Error(`Álbum inválido: la selección ${team.code} debe tener primary, secondary y accent.`);
    }
    const expectedFlag = REQUIRED_FLAG_OVERRIDES[team.code];
    if (expectedFlag && team.flagCode !== expectedFlag) {
      throw new Error(`Álbum inválido: ${team.code} debe usar flagCode "${expectedFlag}", recibió "${team.flagCode}".`);
    }
  }

  return album;
}
