# Week 7 - Recommendation Engine
# Given a listing a user likes, find similar ones

import os
import numpy as np
from google import genai
from sklearn.metrics.pairwise import cosine_similarity
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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

def get_listing_by_id(listing_id: str) -> dict:
    """Fetch a single listing by ID"""
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
        WHERE L_ListingID = %s
        AND L_Status = 'Active'
    """, (listing_id,))
    return cursor.fetchone()

def get_candidate_listings(city: str, limit: int = 30) -> list:
    """Get listings to compare against"""
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
        LIMIT %s
    """, (city, limit))
    return cursor.fetchall()

def calculate_structured_score(target: dict, candidate: dict) -> float:
    """Score based on price, beds, city, sqft similarity"""
    score = 0.0

    # price similarity (max 20 points)
    price_diff = abs((target['price'] or 0) - (candidate['price'] or 0))
    if price_diff < 50000: score += 20
    elif price_diff < 150000: score += 12
    elif price_diff < 300000: score += 5

    # same beds (15 points)
    if target['beds'] == candidate['beds']: score += 15

    # same city (15 points)
    if target['city'] == candidate['city']: score += 15

    # sqft similarity (max 10 points)
    sqft_diff = abs((target['sqft'] or 0) - (candidate['sqft'] or 0))
    if sqft_diff < 300: score += 10
    elif sqft_diff < 700: score += 5

    return score

def validate_with_comps(city: str, sqft: int, price: int) -> dict:
    """Check if price is fair based on recent sold comps"""
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            AVG(ClosePrice / NULLIF(LivingArea, 0)) AS avg_ppsf,
            COUNT(*) AS comp_count
        FROM california_sold
        WHERE City = %s
        AND PropertyType = 'Residential'
        AND LivingArea BETWEEN %s AND %s
        AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    """, (city, sqft * 0.8, sqft * 1.2))
    result = cursor.fetchone()
    avg_ppsf = result['avg_ppsf'] or 0
    comp_price = avg_ppsf * sqft
    if comp_price == 0:
        return {"message": "Not enough comp data"}
    delta = ((price - comp_price) / comp_price) * 100
    return {
        "comp_price": round(comp_price),
        "list_price": price,
        "comp_count": result['comp_count'],
        "delta_pct": round(delta, 1),
        "assessment": "overpriced" if delta > 5 else "underpriced" if delta < -5 else "fairly priced"
    }

def get_recommendations(target_listing: dict, top_k: int = 5) -> list:
    """Find top similar listings using structured + semantic scoring"""
    print(f"Finding recommendations for: {target_listing['address']}, {target_listing['city']}")

    candidates = get_candidate_listings(target_listing['city'], limit=30)
    candidates = [c for c in candidates if c['id'] != target_listing['id']]

    # build embeddings
    target_text = f"{target_listing['type']} in {target_listing['city']}. {target_listing['beds']} beds. ${target_listing['price']:,}. {target_listing['remarks'] or ''}"
    target_emb = np.array(get_embedding(target_text)).reshape(1, -1)

    scores = []
    for candidate in candidates:
        # structured score (60%)
        structured = calculate_structured_score(target_listing, candidate)

        # semantic score (40%)
        candidate_text = f"{candidate['type']} in {candidate['city']}. {candidate['beds']} beds. ${candidate['price']:,}. {candidate['remarks'] or ''}"
        candidate_emb = np.array(get_embedding(candidate_text)).reshape(1, -1)
        semantic = cosine_similarity(target_emb, candidate_emb)[0][0] * 40

        total = structured + semantic
        scores.append((candidate, round(total, 2)))

    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[:top_k]

# Test it
if __name__ == "__main__":
    # use first listing from database as target
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT L_ListingID as id, L_Address as address, L_City as city,
               L_SystemPrice as price, L_Keyword2 as beds, LM_Dec_3 as baths,
               LM_Int2_3 as sqft, L_Type_ as type, YearBuilt as year_built,
               L_Remarks as remarks
        FROM rets_property
        WHERE L_Status = 'Active'
        AND L_City = 'Irvine'
        AND L_Remarks IS NOT NULL
        LIMIT 1
    """)
    target = cursor.fetchone()

    print(f"\nTarget listing: {target['address']}, {target['city']}")
    print(f"Price: ${target['price']:,} | {target['beds']}bd/{target['baths']}ba | {target['sqft']} sqft\n")

    recommendations = get_recommendations(target)

    print("\nTop recommendations:\n")
    for i, (listing, score) in enumerate(recommendations):
        comp = validate_with_comps(listing['city'], listing['sqft'] or 0, listing['price'] or 0)
        print(f"{i+1}. {listing['address']}, {listing['city']}")
        print(f"   Price: ${listing['price']:,} | {listing['beds']}bd/{listing['baths']}ba | {listing['sqft']} sqft")
        print(f"   Match score: {score}")
        print(f"   Price assessment: {comp.get('assessment', 'N/A')} (comp: ${comp.get('comp_price', 'N/A'):,})" if 'comp_price' in comp else f"   Price assessment: {comp.get('message')}")
        print()