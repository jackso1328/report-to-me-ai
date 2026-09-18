export interface AttachmentData {
  type: 'image' | 'audio' | 'file';
  url: string; // Object URL for Blob/File
  file?: File | Blob;
  name?: string;
  size?: number;
}
