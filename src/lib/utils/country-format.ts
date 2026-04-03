const COUNTRY_FLAG_ASSET_BY_NAME: Record<string, string> = {
  "Angleterre": "1f3f4-e0067-e0062-e0065-e006e-e0067-e007f",
  "Arabie Saoudite": "1f1f8-1f1e6",
  "Argentine": "1f1e6-1f1f7",
  "Australie": "1f1e6-1f1fa",
  "Belgique": "1f1e7-1f1ea",
  "Canada": "1f1e8-1f1e6",
  "Danemark": "1f1e9-1f1f0",
  "Espagne": "1f1ea-1f1f8",
  "France": "1f1eb-1f1f7",
  "Mexique": "1f1f2-1f1fd",
  "Porto Rico": "1f1f5-1f1f7",
  "US": "1f1fa-1f1f8",
};

const TWEMOJI_BASE_URL =
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg";

export function formatCountryName(country: string | null): string {
  return country ?? "--";
}

export function getCountryFlagAssetUrl(country: string | null): string | null {
  if (!country) {
    return null;
  }

  const twemojiCode = COUNTRY_FLAG_ASSET_BY_NAME[country];

  if (!twemojiCode) {
    return null;
  }

  return `${TWEMOJI_BASE_URL}/${twemojiCode}.svg`;
}
