# Week 6 - Embeddings & Vector Search
import os
import numpy as np
from google import genai
from sklearn.metrics.pairwise import cosine_similarity
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Connect to database
db = mysql.connector.connect(
    host=os.getenv("MYSQL_HOST", "localhost"),
    user=os.getenv("MYSQL_USER", "root"),
    password=os.getenv("MYSQL_PASSWORD", ""),
    database=os.getenv("MYSQL_DATABASE", "idx_exchange")
)

def get_embedding(text: str) -> list:
    text = text.replace("\n", " ").strip()[:8000]
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )
    return result.embeddings[0].values

def build_listing_text(row: dict) -> str:
    return f"""
    {row['type']} in {row['city']}, CA.
    {row['beds']} beds, {row['baths']} baths.
    {row['sqft']} sq ft. Built {row['year_built']}.
    Price: ${row['price']:,}.
    {row['remarks'] or ''}
    """.strip()

def get_listings_from_db(city: str, limit: int = 20) -> list:
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            L_ListingID as id,
            L_Address as address,
            L_City as city,
            L_SystemPrice as price,
            L_Keyword2 as beds,
            LM_Dec_3 as baths,
            LM_Int2_3 as sqft,
            L_Type_ as type,
            YearBuilt as year_built,
            L_Remarks as remarks
        FROM rets_property
        WHERE L_Status = 'Active'
        AND L_City = %s
        AND L_Remarks IS NOT NULL
        AND L_Remarks != ''
        LIMIT %s
    """, (city, limit))
    return cursor.fetchall()

def find_similar_listings(query: str, city: str, top_k: int = 5) -> list:
    print(f"Fetching listings from {city}...")
    listings = get_listings_from_db(city, limit=20)

    if not listings:
        print(f"No listings found in {city}")
        return []

    print(f"Building embeddings for {len(listings)} listings...")
    listing_embeddings = []
    for listing in listings:
        text = build_listing_text(listing)
        emb = get_embedding(text)
        listing_embeddings.append((listing, emb))

    print(f"Finding matches for: '{query}'")
    query_emb = np.array(get_embedding(query)).reshape(1, -1)

    scores = []
    for listing, emb in listing_embeddings:
        sim = cosine_similarity(query_emb, np.array(emb).reshape(1, -1))[0][0]
        scores.append((listing, float(sim)))

    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[:top_k]

if __name__ == "__main__":
    query = "charming home with lots of natural light and modern kitchen"
    city = "Irvine"

    results = find_similar_listings(query, city)

    print(f"\nTop {len(results)} matches for: '{query}'\n")
    for i, (listing, score) in enumerate(results):
        print(f"{i+1}. {listing['address']}, {listing['city']}")
        print(f"   Price: ${listing['price']:,} | {listing['beds']}bd/{listing['baths']}ba | {listing['sqft']} sqft")
        print(f"   Similarity score: {score:.3f}")
        print()