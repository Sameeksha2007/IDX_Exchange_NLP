# Schema Annotation Document
## IDX Exchange — Field Usage Notes
### Intern: Sameeksha Vashishtha | Summer 2026

---

## rets_property — Active Listings

This table powers all active property search, semantic similarity, and recommendation features.

| Field | Type | How We Used It |
|-------|------|----------------|
| L_ListingID | VARCHAR | Primary key, joins to california_sold.ListingKey |
| L_Address | VARCHAR | Displayed in search results and WhatsApp responses |
| L_City | VARCHAR | Primary filter for all city-based searches |
| L_Zip | VARCHAR | Secondary location filter |
| L_SystemPrice | INT | Max price filter in NLP parser and SQL queries |
| L_Keyword2 | INT | Bedroom count filter |
| LM_Dec_3 | DECIMAL | Bathroom count including half baths |
| LM_Int2_3 | INT | Square footage filter and similarity scoring |
| L_Type_ | VARCHAR | Property type filter (Condominium, SingleFamilyResidence etc.) |
| L_Status | VARCHAR | Always filtered to 'Active' in search queries |
| L_Remarks | MEDIUMTEXT | Full listing description — embedded with Gemini for semantic search |
| PoolPrivateYN | VARCHAR | Pool filter — stores 'True'/'False' strings |
| ViewYN | VARCHAR | View filter — stores 'True'/'False' strings |
| FireplaceYN | VARCHAR | Fireplace filter |
| YearBuilt | INT | Displayed in listing results |
| AssociationFee | INT | HOA fee displayed in results |
| DaysOnMarket | INT | Displayed in results, used in market comparisons |
| PhotoCount | INT | Displayed in WhatsApp responses |
| LA1_UserFirstName | VARCHAR | Listing agent first name |
| LA1_UserLastName | VARCHAR | Listing agent last name |
| LO1_OrganizationName | VARCHAR | Brokerage name |
| LMD_MP_Latitude | DECIMAL | Geographic coordinates for future map features |
| LMD_MP_Longitude | DECIMAL | Geographic coordinates for future map features |
| PreviousListPrice | DECIMAL | Prior list price for price reduction analysis |
| CountyOrParish | VARCHAR | County name |
| ArchitecturalStyle | VARCHAR | Architectural style of the property |

### Key Notes
- L_Remarks is the most valuable field for AI — rich natural language descriptions power semantic search
- L_Keyword2 stores bedroom count (non-standard naming from legacy MLS system)
- LM_Dec_3 stores bathroom count (non-standard naming from legacy MLS system)
- PoolPrivateYN and ViewYN store string values not booleans
- L_City is indexed for fast city-based filtering

---

## california_sold — Sold Transactions

This table powers all market analytics, price trend analysis, and comp validation.

| Field | Type | How We Used It |
|-------|------|----------------|
| ListingKey | BIGINT | Joins to rets_property.L_ListingID |
| ClosePrice | DOUBLE | Final sale price — used in all market averages |
| CloseDate | VARCHAR | Date filter for 12-month and 6-month trend windows |
| OriginalListPrice | DOUBLE | Used to calculate price reduction patterns |
| ListPrice | DOUBLE | Used in list-to-close ratio calculation |
| DaysOnMarket | BIGINT | Average DOM calculation for market reports |
| PropertyType | VARCHAR | Always filtered to 'Residential' in queries |
| PropertySubType | VARCHAR | Displayed in comp results |
| LivingArea | DOUBLE | Used in price-per-sqft calculations and comp validation |
| BedroomsTotal | DOUBLE | Displayed in comp results |
| BathroomsTotalInteger | DOUBLE | Displayed in comp results |
| City | VARCHAR | Primary filter for all market queries |
| PostalCode | VARCHAR | Secondary location filter |
| Latitude | DOUBLE | Geographic coordinates |
| Longitude | DOUBLE | Geographic coordinates |
| UnparsedAddress | VARCHAR | Full street address displayed in comp results |
| ListAgentFullName | VARCHAR | Displayed in sold comp results |
| BuyerAgentFirstName | VARCHAR | Displayed in sold comp results |
| BuyerAgentLastName | VARCHAR | Displayed in sold comp results |
| ListOfficeName | VARCHAR | Listing brokerage name |
| BuyerOfficeName | VARCHAR | Buyer brokerage name |
| AssociationFee | DOUBLE | HOA fee for comp analysis |
| GarageSpaces | DOUBLE | Garage spaces for comp matching |
| SubdivisionName | VARCHAR | Subdivision name |
| HighSchoolDistrict | VARCHAR | School district displayed in results |

### Key SQL Patterns Used
```sql
-- Market summary
AVG(ClosePrice) — average close price
AVG(ClosePrice / NULLIF(LivingArea, 0)) — price per sqft
AVG(ClosePrice / NULLIF(ListPrice, 0)) * 100 — list to close ratio
AVG(DaysOnMarket) — average days on market

-- Time filtering
CloseDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
CloseDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)

-- Comp validation
LivingArea BETWEEN sqft * 0.8 AND sqft * 1.2

-- Monthly price trends
DATE_FORMAT(CloseDate, '%Y-%m') AS month
```

---

## rets_openhouse — Open House Schedules

Available for future features — not used in weekly modules.

| Field | How It Could Be Used |
|-------|---------------------|
| L_ListingID | Joins to rets_property |
| OpenHouseDate | Filter upcoming open houses |
| OH_StartTime | Display open house start time |
| OH_EndTime | Display open house end time |
| all_data | JSON blob with extra details |

---

## Key Join Pattern

```sql
-- Join active listings with sold comps
JOIN rets_property r
ON CAST(r.L_ListingID AS UNSIGNED) = cs.ListingKey

-- Market level analysis by city
WHERE rets_property.L_City = california_sold.City
```

---

## Data Quality Notes
- rets_property has 53K rows (partial dataset — full is 228K)
- california_sold has 87K rows (partial dataset — full is 439K)
- PoolPrivateYN, ViewYN, FireplaceYN store string values not booleans
- CloseDate in california_sold is VARCHAR not DATE — use DATE_FORMAT for grouping
- L_Keyword2 and LM_Dec_3 use non-standard legacy MLS naming conventions