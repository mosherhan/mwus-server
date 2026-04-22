import json
import pickle
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

with open("../src/data/knowledge.json", "r") as f:
    docs = json.load(f)

texts = [f"{d['title']}: {d['content']}" for d in docs]
embeddings = model.encode(texts, convert_to_numpy=True)

index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)

faiss.write_index(index, "faiss_index.bin")
with open("docs.pkl", "wb") as f:
    pickle.dump(docs, f)

print(" FAISS index built successfully!")