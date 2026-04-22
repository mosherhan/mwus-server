import sys
import json
import pickle
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

query = sys.argv[1]
top_k = int(sys.argv[2]) if len(sys.argv) > 2 else 3

model = SentenceTransformer("all-MiniLM-L6-v2")

index = faiss.read_index("faiss_index.bin")
with open("docs.pkl", "rb") as f:
    docs = pickle.load(f)

q_embedding = model.encode([query], convert_to_numpy=True)
distances, indices = index.search(q_embedding, top_k)

results = []
for i in indices[0]:
    if i < len(docs):
        results.append(docs[i])

print(json.dumps(results))