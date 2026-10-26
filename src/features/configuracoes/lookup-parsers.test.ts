import { describe, expect, it } from "vitest";
import { nominatimUrl, parseCepCoordinates, parseCnpjResponse, parseNominatim, titleCasePt } from "./lookup-parsers";

describe("parseCnpjResponse (BrasilAPI)", () => {
  const sample = {
    cnpj: "11222333000181",
    razao_social: "SUPERMERCADO EXEMPLO LTDA",
    nome_fantasia: "SUPER EXEMPLO",
    cnae_fiscal: 4711302,
    cnae_fiscal_descricao: "Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios - supermercados",
    descricao_situacao_cadastral: "ATIVA",
    cep: "01310100",
    descricao_tipo_de_logradouro: "AVENIDA",
    logradouro: "PAULISTA",
    numero: "1000",
    complemento: "LOJA 2",
    bairro: "BELA VISTA",
    municipio: "SAO PAULO",
    uf: "SP",
    extra: { qualquer: true },
  };

  it("mapeia os campos e formata o endereço", () => {
    expect(parseCnpjResponse(sample)).toEqual({
      legalName: "SUPERMERCADO EXEMPLO LTDA",
      tradeName: "SUPER EXEMPLO",
      cnae: "4711302",
      cnaeDescription: sample.cnae_fiscal_descricao,
      situation: null,
      address: {
        cep: "01310100",
        street: "Avenida Paulista",
        number: "1000",
        complement: "Loja 2",
        district: "Bela Vista",
        city: "Sao Paulo",
        uf: "SP",
      },
    });
  });
  it("tolera campos nulos, avisa situação e corta textos longos", () => {
    const parsed = parseCnpjResponse({
      razao_social: "X".repeat(300),
      nome_fantasia: null,
      cnae_fiscal: null,
      descricao_situacao_cadastral: "BAIXADA",
      cep: "123",
      uf: "ZZ",
    });
    expect(parsed?.legalName).toHaveLength(200);
    expect(parsed).toMatchObject({ tradeName: "", cnae: "", situation: "BAIXADA" });
    expect(parsed?.address).toMatchObject({ cep: "", uf: "", street: "" });
  });
  it("recusa resposta sem razão social ou com formato estranho", () => {
    expect(parseCnpjResponse({ message: "CNPJ não encontrado" })).toBeNull();
    expect(parseCnpjResponse(null)).toBeNull();
    expect(parseCnpjResponse("texto")).toBeNull();
    expect(parseCnpjResponse({ razao_social: { a: 1 } })).toBeNull();
  });
});

describe("parseCepCoordinates (BrasilAPI v2)", () => {
  it("lê coordenadas em texto ou número", () => {
    expect(
      parseCepCoordinates({ location: { type: "Point", coordinates: { longitude: "-46.6558819", latitude: "-23.5614141" } } }),
    ).toEqual({ latitude: -23.561414, longitude: -46.655882 });
    expect(parseCepCoordinates({ location: { coordinates: { latitude: -15.79, longitude: -47.88 } } })).toEqual({
      latitude: -15.79,
      longitude: -47.88,
    });
  });
  it("devolve null sem coordenadas, com lixo ou fora do Brasil", () => {
    expect(parseCepCoordinates({ location: { type: "Point", coordinates: {} } })).toBeNull();
    expect(parseCepCoordinates({ cep: "01310100" })).toBeNull();
    expect(parseCepCoordinates({ location: { coordinates: { latitude: "abc", longitude: "1" } } })).toBeNull();
    expect(parseCepCoordinates({ location: { coordinates: { latitude: "48.85", longitude: "2.35" } } })).toBeNull();
    expect(parseCepCoordinates([])).toBeNull();
  });
});

describe("parseNominatim", () => {
  it("usa o primeiro resultado", () => {
    expect(
      parseNominatim([
        { lat: "-22.9068467", lon: "-43.1728964", display_name: "Rio de Janeiro, Brasil" },
        { lat: "0", lon: "0" },
      ]),
    ).toEqual({ latitude: -22.906847, longitude: -43.172896, label: "Rio de Janeiro, Brasil" });
  });
  it("lista vazia, objeto ou fora do Brasil dão null", () => {
    expect(parseNominatim([])).toBeNull();
    expect(parseNominatim({ error: "x" })).toBeNull();
    expect(parseNominatim([{ lat: "40.7", lon: "-74" }])).toBeNull();
  });
  it("monta a busca estruturada com o nome do estado", () => {
    const url = new URL(nominatimUrl({ street: "Av. Paulista", number: "1000", city: "São Paulo", uf: "sp" }));
    expect(url.origin + url.pathname).toBe("https://nominatim.openstreetmap.org/search");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      format: "jsonv2",
      countrycodes: "br",
      limit: "1",
      street: "1000 Av. Paulista",
      city: "São Paulo",
      state: "São Paulo",
      country: "Brasil",
    });
  });
});

describe("titleCasePt", () => {
  it("mantém preposições em minúsculas", () => {
    expect(titleCasePt("RUA DAS FLORES DE MAIO")).toBe("Rua das Flores de Maio");
    expect(titleCasePt("")).toBe("");
  });
});
