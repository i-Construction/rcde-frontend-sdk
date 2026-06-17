export type Chunkable =
  | ArrayBufferLike //
  | Uint8Array //
  | Blob // File
  | ReadableStream<Uint8Array>; // Web Streams on browser

export interface Options {
  upload: (chunk: Uint8Array, part: number, offset: number, total: number | null) => Promise<void>;
  chunkSize?: number; // default 5 MiB
  onProgress?: (sent: number, total: number | null) => void;
}

const FIVE_MB = 5 * 1024 * 1024;

async function getTotalSize(input: Chunkable): Promise<number | null> {
  // get total size

  if (input instanceof Blob) {
    return input.size;
  }

  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return (input as ArrayBufferLike | Uint8Array).byteLength;
  }

  if (input instanceof ReadableStream) {
    const reader = input.getReader();
    let total = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
    }
    return total;
  }

  return null;
}

async function* chunks(input: Chunkable, chunkSize: number): AsyncGenerator<Uint8Array, void, void> {
  // Blob/File ---------------------------------
  if (input instanceof Blob) {
    for (let o = 0; o < input.size; o += chunkSize) {
      yield new Uint8Array(await input.slice(o, o + chunkSize).arrayBuffer());
    }
    return;
  }

  // ArrayBuffer / Uint8Array ------------------
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    const buf = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
    for (let o = 0; o < buf.byteLength; o += chunkSize) {
      yield buf.subarray(o, o + chunkSize);
    }
    return;
  }

  // WHATWG ReadableStream<Uint8Array> ----------
  if (
    typeof ReadableStream !== "undefined" &&
    input instanceof ReadableStream
  ) {
    const reader = input.getReader();
    let carry = new Uint8Array(0);
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      carry = concat(carry, value);
      while (carry.byteLength >= chunkSize) {
        yield carry.subarray(0, chunkSize);
        carry = carry.subarray(chunkSize);
      }
    }
    if (carry.byteLength) yield carry;
    return;
  }
}

async function chunkedUpload(
  input: Chunkable,
  { upload, chunkSize = FIVE_MB, onProgress }: Options
): Promise<void> {
  const totalSize = await getTotalSize(input);

  let index = 0;
  let offset = 0;
  let sent = 0;

  for await (const chunk of chunks(input, chunkSize)) {
    await upload(chunk, index, offset, totalSize);
    index++;
    sent += chunk.byteLength;
    onProgress?.(sent, totalSize);
    offset += chunk.byteLength;
  }
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const ab = new Uint8Array(a.byteLength + b.byteLength);
  ab.set(a);
  ab.set(b, a.byteLength);
  return ab;
}

export { 
  getTotalSize,
  chunkedUpload };
