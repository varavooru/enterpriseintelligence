import re


class TextChunker:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str, metadata: dict | None = None) -> list[dict]:
        if not text or not text.strip():
            return []

        separators = ["\n\n", "\n", ". ", " ", ""]
        chunks = self._recursive_split(text, separators)

        result = []
        for i, chunk in enumerate(chunks):
            chunk_data = {
                "text": chunk.strip(),
                "chunk_index": i,
                "total_chunks": len(chunks),
                "metadata": metadata or {},
            }
            result.append(chunk_data)

        return result

    def _recursive_split(self, text: str, separators: list[str]) -> list[str]:
        if len(text) <= self.chunk_size:
            return [text] if text.strip() else []

        separator = separators[0] if separators else ""
        remaining_separators = separators[1:] if len(separators) > 1 else [""]

        if separator:
            parts = text.split(separator)
        else:
            parts = [text[i:i + self.chunk_size] for i in range(0, len(text), self.chunk_size - self.chunk_overlap)]
            return [p for p in parts if p.strip()]

        chunks = []
        current_chunk = ""

        for part in parts:
            test_chunk = current_chunk + separator + part if current_chunk else part

            if len(test_chunk) <= self.chunk_size:
                current_chunk = test_chunk
            else:
                if current_chunk:
                    if len(current_chunk) <= self.chunk_size:
                        chunks.append(current_chunk)
                    else:
                        chunks.extend(self._recursive_split(current_chunk, remaining_separators))

                if len(part) <= self.chunk_size:
                    current_chunk = part
                else:
                    sub_chunks = self._recursive_split(part, remaining_separators)
                    chunks.extend(sub_chunks[:-1])
                    current_chunk = sub_chunks[-1] if sub_chunks else ""

        if current_chunk.strip():
            chunks.append(current_chunk)

        return chunks


chunker = TextChunker()
