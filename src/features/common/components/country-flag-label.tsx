import { formatCountryName, getCountryFlagAssetUrl } from "@/src/lib/utils/country-format";

interface CountryFlagLabelProps {
  country: string | null;
}

export function CountryFlagLabel({ country }: CountryFlagLabelProps) {
  const countryLabel = formatCountryName(country);
  const flagAssetUrl = getCountryFlagAssetUrl(country);

  if (!flagAssetUrl) {
    return <span>{countryLabel}</span>;
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-2 align-middle">
      <span
        aria-hidden="true"
        className="inline-block h-[1em] w-[1em] shrink-0 bg-contain bg-center bg-no-repeat align-[-0.12em]"
        style={{ backgroundImage: `url("${flagAssetUrl}")` }}
      />
      <span className="min-w-0">{countryLabel}</span>
    </span>
  );
}
