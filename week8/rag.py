# Week 8 - Retrieval Augmented Generation (RAG)
# Answers questions about real estate using indexed documents

import os
import numpy as np
from google import genai
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Knowledge base documents
DOCUMENTS = [
    {
        "title": "MLS Field Definitions",
        "content": """
        L_ListingID: Unique MLS listing identifier.
        L_SystemPrice: Current list price of the property.
        L_Keyword2: Number of bedrooms.
        LM_Dec_3: Number of bathrooms including half baths.
        LM_Int2_3: Approximate finished square footage.
        L_City: City where the property is located.
        L_Status: Listing status - Active, Pending, Withdrawn.
        L_Remarks: Full listing description written by the agent.
        PoolPrivateYN: Whether the property has a private pool.
        ViewYN: Whether the property has a notable view.
        DaysOnMarket: How many days the listing has been active.
        AssociationFee: Monthly HOA fee in dollars.
        YearBuilt: Year the property was constructed.
        LA1_UserFirstName: Listing agent first name.
        LA1_UserLastName: Listing agent last name.
        """
    },
    {
        "title": "california_sold Field Definitions",
        "content": """
        ClosePrice: Final sale price of the property.
        CloseDate: Date the transaction closed.
        OriginalListPrice: Original asking price when first listed.
        ListPrice: List price at time of contract.
        DaysOnMarket: Days from listing to contract.
        LivingArea: Finished living area in square feet.
        BedroomsTotal: Number of bedrooms.
        BathroomsTotalInteger: Number of bathrooms.
        City: City of the property.
        ListAgentFullName: Full name of the listing agent.
        BuyerAgentFullName: Full name of the buyer agent.
        PropertySubType: Type of property - SingleFamilyResidence, Condominium, etc.
        """
    },
    {
        "title": "Real Estate Terminology",
        "content": """
        DOM (Days on Market): The number of days a property has been listed for sale.
        A low DOM indicates high demand. A high DOM may indicate overpricing.
        
        Comps (Comparables): Recently sold properties similar in size, location, 
        and condition used to determine market value.
        
        List-to-Close Ratio: The percentage of the list price that the property 
        actually sold for. A ratio above 100% means the home sold above asking price,
        indicating a sellers market. Below 100% indicates a buyers market.
        
        Escrow: A neutral third party that holds funds and documents during a 
        real estate transaction until all conditions are met.
        
        Cap Rate: The ratio of net operating income to property value, used to 
        evaluate investment properties.
        
        HOA (Homeowners Association): An organization that makes and enforces rules 
        for properties in a subdivision. Members pay monthly fees.
        
        MLS (Multiple Listing Service): A database where real estate agents list 
        properties for sale and share information with other agents.
        
        Price Per Square Foot: The price of a property divided by its square footage.
        Used to compare properties of different sizes.
        """
    },
    {
        "title": "Market Analysis Guide",
        "content": """
        A sellers market occurs when demand exceeds supply. Signs include:
        - Homes selling above asking price
        - Low days on market
        - Multiple offers on properties
        - List-to-close ratio above 100%
        
        A buyers market occurs when supply exceeds demand. Signs include:
        - Homes selling below asking price
        - High days on market
        - Price reductions common
        - List-to-close ratio below 100%
        
        To analyze a market use these metrics:
        - Average close price trend over 12 months
        - Average days on market trend
        - Active listings vs sold volume ratio
        - Price per square foot trend
        """
    }
]

def get_embedding(text: str) -> list:
    text = text.replace("\n", " ").strip()[:8000]
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )
    return result.embeddings[0].values

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def build_index(documents: list) -> list:
    """Build searchable index from documents"""
    print("Building document index...")
    index = []
    for doc in documents:
        chunks = chunk_text(doc["content"])
        for chunk in chunks:
            index.append({
                "source": doc["title"],
                "chunk": chunk,
                "embedding": get_embedding(chunk)
            })
    print(f"Indexed {len(index)} chunks from {len(documents)} documents")
    return index

def retrieve(query: str, index: list, top_k: int = 3) -> list:
    """Find most relevant chunks for a query"""
    query_emb = np.array(get_embedding(query)).reshape(1, -1)
    scored = []
    for doc in index:
        sim = cosine_similarity(query_emb, np.array(doc["embedding"]).reshape(1, -1))[0][0]
        scored.append((doc, float(sim)))
    scored.sort(key=lambda x: x[1], reverse=True)
    return [doc for doc, _ in scored[:top_k]]

def rag_answer(query: str, index: list) -> str:
    """Answer a question using retrieved document chunks"""
    chunks = retrieve(query, index)
    context = "\n\n".join(c["chunk"] for c in chunks)
    sources = list(set(c["source"] for c in chunks))

    prompt = f"""You are a real estate AI assistant. Answer the question using only the context below.
Be concise and clear.

Context:
{context}

Question: {query}

Answer:"""

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt
    )
    return f"{response.text}\n(Sources: {', '.join(sources)})"

# Test it
if __name__ == "__main__":
    index = build_index(DOCUMENTS)

    questions = [
        "What does DOM mean?",
        "What columns are in california_sold?",
        "What is a list-to-close ratio?",
        "How do I know if it's a sellers market?",
        "What is an HOA?"
    ]

    print("\n=== RAG Question Answering ===\n")
    for question in questions:
        print(f"Q: {question}")
        answer = rag_answer(question, index)
        print(f"A: {answer}\n")