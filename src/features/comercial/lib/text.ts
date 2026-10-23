const DIACRITICS = /[̀-ͯ]/g;
const NON_WORD = /[^a-z0-9\s]/g;
const SPACES = /\s+/g;

/** Minúsculas, sem acento, sem pontuação e com espaços simples. */
export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(DIACRITICS, "").toLowerCase().replace(NON_WORD, " ").replace(SPACES, " ").trim();
}

/** Palavras sem significado próprio, ignoradas no agrupamento por palavra-chave. */
const STOPWORDS = new Set(
  (
    "a o as os um uma uns umas de do da dos das em no na nos nas por pelo pela pelos pelas para pra pro " +
    "com sem que se e ou mas nao sim ja ainda muito mais menos ele ela eles elas isso esse essa este esta " +
    "foi era ser estar esta estava tem tinha ter ao aos the cliente lead nos nosso nossa sua seu suas seus " +
    "momento agora porque quer queria achou disse vai vou"
  ).split(" "),
);

export function keywordsOf(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}
