export type Chunkable = ArrayBufferLike | Uint8Array | Blob | ReadableStream<Uint8Array>;
export interface Options {
    upload: (chunk: Uint8Array, part: number, offset: number, total: number | null) => Promise<void>;
    chunkSize?: number;
    onProgress?: (sent: number, total: number | null) => void;
}
declare function getTotalSize(input: Chunkable): Promise<number | null>;
declare function chunkedUpload(input: Chunkable, { upload, chunkSize, onProgress }: Options): Promise<void>;
export { getTotalSize, chunkedUpload };
