export type AcquirerSummary = {
  id: string;
  name: string;
  color: string;
  position: number;
  logoUrl: string | null;
  hasLogo: boolean;
  documentCount: number;
  noteCount: number;
};

export type AcquirerDocument = {
  id: string;
  fileName: string;
  sizeBytes: number;
  createdAt: string;
  uploaderName: string;
};

export type AcquirerNote = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  updatedByName: string;
};

export type AcquirerDetail = {
  acquirer: { id: string; name: string; color: string; logoUrl: string | null };
  documents: AcquirerDocument[];
  notes: AcquirerNote[];
};
