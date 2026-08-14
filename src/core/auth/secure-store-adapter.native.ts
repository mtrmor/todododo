import * as SecureStore from "expo-secure-store";

const CHUNK_SIZE = 1_800;

function metadataKey(key: string): string {
  return `${key}.metadata`;
}

function chunkKey(key: string, index: number): string {
  return `${key}.chunk.${index}`;
}

async function readChunkCount(key: string): Promise<number> {
  const metadata = await SecureStore.getItemAsync(metadataKey(key));
  if (!metadata) {
    return 0;
  }

  const parsed = Number.parseInt(metadata, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}

async function removeChunks(key: string, count: number): Promise<void> {
  await Promise.all(
    Array.from({ length: count }, (_, index) => SecureStore.deleteItemAsync(chunkKey(key, index))),
  );
}

export const secureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const count = await readChunkCount(key);
    if (count === 0) {
      return SecureStore.getItemAsync(key);
    }

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(chunkKey(key, index))),
    );

    return chunks.every((chunk): chunk is string => chunk !== null) ? chunks.join("") : null;
  },

  async setItem(key: string, value: string): Promise<void> {
    const previousCount = await readChunkCount(key);
    const chunks = Array.from(
      { length: Math.max(1, Math.ceil(value.length / CHUNK_SIZE)) },
      (_, index) => value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
    );

    await Promise.all(
      chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(key, index), chunk)),
    );
    await SecureStore.setItemAsync(metadataKey(key), String(chunks.length));
    await SecureStore.deleteItemAsync(key);

    if (previousCount > chunks.length) {
      await Promise.all(
        Array.from(
          { length: previousCount - chunks.length },
          (_, offset) => SecureStore.deleteItemAsync(chunkKey(key, chunks.length + offset)),
        ),
      );
    }
  },

  async removeItem(key: string): Promise<void> {
    const count = await readChunkCount(key);
    await removeChunks(key, count);
    await Promise.all([
      SecureStore.deleteItemAsync(metadataKey(key)),
      SecureStore.deleteItemAsync(key),
    ]);
  },
};
