import { describe, expect, it } from "vitest";
import { UFS } from "./brazil-states";
import {
  approximatePosition,
  collectionKey,
  companiesToGeoJson,
  isInBrazil,
  positionOf,
  roundCoord,
  zoomLevelOf,
} from "./geo";
import type { CompanySummary } from "./map-utils";
import { BRAZIL_BOUNDS, MAX_BOUNDS, UF_GEO } from "./uf-geo";

const base: CompanySummary = {
  id: "1",
  uf: "SP",
  city: "São Paulo",
  cnpj: "11222333000181",
  legalName: "Mercado Exemplo Ltda",
  tradeName: null,
  marketName: "Super A",
  clientName: null,
  latitude: null,
  longitude: null,
  parentId: null,
};

const inside = ([w, s, e, n]: readonly number[], [lng, lat]: readonly number[]) =>
  lng >= w && lng <= e && lat >= s && lat <= n;

describe("UF_GEO", () => {
  it("tem caixa e centro para as 27 UFs, dentro do Brasil", () => {
    expect(Object.keys(UF_GEO).sort()).toEqual([...UFS]);
    for (const uf of UFS) {
      const { bounds, center } = UF_GEO[uf];
      expect(bounds[0]).toBeLessThan(bounds[2]);
      expect(bounds[1]).toBeLessThan(bounds[3]);
      expect(inside(bounds, center)).toBe(true);
      expect(inside(MAX_BOUNDS, [bounds[0], bounds[1]])).toBe(true);
      expect(inside(MAX_BOUNDS, [bounds[2], bounds[3]])).toBe(true);
    }
  });
  it("a vista do Brasil cabe no limite de navegação", () => {
    expect(inside(MAX_BOUNDS, [BRAZIL_BOUNDS[0], BRAZIL_BOUNDS[1]])).toBe(true);
    expect(inside(MAX_BOUNDS, [BRAZIL_BOUNDS[2], BRAZIL_BOUNDS[3]])).toBe(true);
  });
  it("a capital fica dentro da caixa do estado", () => {
    expect(inside(UF_GEO.SP.bounds, [-46.633, -23.55])).toBe(true);
    expect(inside(UF_GEO.DF.bounds, [-47.88, -15.79])).toBe(true);
    expect(inside(UF_GEO.RJ.bounds, [-46.633, -23.55])).toBe(false);
  });
});

describe("coordenadas", () => {
  it("arredonda para 6 casas e confere o território", () => {
    expect(roundCoord(-23.5614141234)).toBe(-23.561414);
    expect(isInBrazil(-23.56, -46.65)).toBe(true);
    expect(isInBrazil(40.7, -74)).toBe(false);
  });
  it("níveis de zoom", () => {
    expect(zoomLevelOf(3)).toBe("pais");
    expect(zoomLevelOf(6)).toBe("estado");
    expect(zoomLevelOf(12)).toBe("cidade");
  });
  it("posições aproximadas não se repetem e ficam perto do centro", () => {
    const center = UF_GEO.SP.center;
    const points = [0, 1, 2, 3, 4].map((i) => approximatePosition(center, i));
    expect(points[0]).toEqual(center);
    expect(new Set(points.map((p) => p.join())).size).toBe(5);
    for (const [lng, lat] of points) expect(Math.hypot(lng - center[0], lat - center[1])).toBeLessThan(0.2);
  });
});

describe("companiesToGeoJson", () => {
  it("usa o local exato quando há coordenadas e o centro da UF quando não há", () => {
    const { collection, approximateCount, unplaced } = companiesToGeoJson([
      { ...base, id: "a", latitude: -23.561414, longitude: -46.655881 },
      { ...base, id: "b", uf: "rj" },
      { ...base, id: "c", uf: "XX" },
      { ...base, id: "d", latitude: 48.85, longitude: 2.35 },
    ]);
    expect(collection.type).toBe("FeatureCollection");
    expect(collection.features.map((f) => f.properties.id)).toEqual(["a", "b", "d"]);
    expect(collection.features[0]).toMatchObject({
      geometry: { type: "Point", coordinates: [-46.655881, -23.561414] },
      properties: { label: "Super A", approximate: false },
    });
    expect(collection.features[1].geometry.coordinates).toEqual([...UF_GEO.RJ.center]);
    expect(collection.features[1].properties.approximate).toBe(true);
    // Coordenada fora do Brasil é tratada como ausente.
    expect(collection.features[2].properties.approximate).toBe(true);
    expect(approximateCount).toBe(2);
    expect(unplaced.map((c) => c.id)).toEqual(["c"]);
    expect(positionOf(collection, "a")).toEqual([-46.655881, -23.561414]);
    expect(positionOf(collection, "zz")).toBeNull();
  });
  it("a chave muda só quando o conteúdo do mapa muda", () => {
    const one = companiesToGeoJson([{ ...base, latitude: -23.5, longitude: -46.6 }]).collection;
    const same = companiesToGeoJson([{ ...base, latitude: -23.5, longitude: -46.6, clientName: "X" }]).collection;
    const moved = companiesToGeoJson([{ ...base, latitude: -23.6, longitude: -46.6 }]).collection;
    expect(collectionKey(one)).toBe(collectionKey(same));
    expect(collectionKey(one)).not.toBe(collectionKey(moved));
  });
});
