const IRIS_BASE = "https://iris.who.int/rest";

export interface IrisDocument {
  id: string;
  title: string;
  url: string;
  type: string;
  date?: string;
  description?: string;
}

export async function searchPatientEducationDocuments(
  query: string,
  limit = 5
): Promise<IrisDocument[]> {
  if (!query || query.length < 2) return [];

  const params = new URLSearchParams({
    query,
    scope: "/handle/10665",
    rpp: String(limit),
    sort_by: "score",
    order: "desc",
  });

  const response = await fetch(`${IRIS_BASE}/discover?${params.toString()}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) return [];

  const data = (await response.json()) as {
    _embedded?: {
      searchResult?: {
        _embedded?: {
          objects?: Array<{
            id?: string;
            handle?: string;
            name?: string;
            type?: string;
            metadata?: Array<{ key: string; value: string; language?: string }>;
          }>;
        };
      };
    };
  };

  const objects = data._embedded?.searchResult?._embedded?.objects ?? [];

  return objects.slice(0, limit).map((obj) => {
    const getMeta = (key: string): string | undefined =>
      obj.metadata?.find((m) => m.key === key)?.value;

    const handle = obj.handle ?? obj.id ?? "";
    return {
      id: handle,
      title: getMeta("dc.title") ?? obj.name ?? "Document OMS",
      url: `https://iris.who.int/handle/${handle}`,
      type: getMeta("dc.type") ?? obj.type ?? "Publication",
      date: getMeta("dc.date.issued"),
      description: getMeta("dc.description.abstract"),
    };
  });
}
