import os
import sys
import random
from datetime import date, timedelta
from decimal import Decimal

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, engine, Base
from app.models.user import User, AuthIdentity, RoleEnum
from app.models.listing import Listing, ListingImage, Amenity, ListingAmenity
from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.models.wishlist import Wishlist
from app.repositories.listing_repo import CITY_COORDINATES

def seed():
    db = SessionLocal()
    try:
        print("Starting extended seed...")

        # 1. AMENITIES
        amenity_catalog = [
            ("WiFi", "wifi", "Essentials"),
            ("Kitchen", "kitchen", "Essentials"),
            ("Air conditioning", "air_conditioning", "Essentials"),
            ("Heating", "heating", "Essentials"),
            ("Washer", "washer", "Essentials"),
            ("Dryer", "dryer", "Essentials"),
            ("Free parking", "free_parking", "Features"),
            ("Pool", "pool", "Features"),
            ("Hot tub", "hot_tub", "Features"),
            ("Gym", "gym", "Features"),
            ("TV", "tv", "Essentials"),
            ("Workspace", "workspace", "Essentials"),
            ("Elevator", "elevator", "Features"),
            ("Fireplace", "fireplace", "Features"),
            ("BBQ grill", "bbq_grill", "Features"),
            ("Beach access", "beach_access", "Location"),
            ("Mountain view", "mountain_view", "Location"),
            ("City view", "city_view", "Location"),
        ]
        
        amenity_objs = []
        for name, icon, cat in amenity_catalog:
            am = db.query(Amenity).filter_by(name=name).first()
            if not am:
                am = Amenity(name=name, icon=icon, category=cat)
                db.add(am)
                db.flush()
            amenity_objs.append(am)
        db.commit()
        print(f"Seeded {len(amenity_objs)} amenities.")

        # 2. USERS (20 realistic users: 8 hosts, 8 guests, 4 dual-role)
        user_data = [
            # 8 Hosts
            {"email": "arjun.host@example.com", "full_name": "Arjun Mehta", "role": RoleEnum.host, "is_host": True, "img": 11},
            {"email": "priya.host@example.com", "full_name": "Priya Sharma", "role": RoleEnum.host, "is_host": True, "img": 12},
            {"email": "rahul.host@example.com", "full_name": "Rahul Verma", "role": RoleEnum.host, "is_host": True, "img": 13},
            {"email": "ananya.host@example.com", "full_name": "Ananya Singh", "role": RoleEnum.host, "is_host": True, "img": 14},
            {"email": "kabir.host@example.com", "full_name": "Kabir Kapoor", "role": RoleEnum.host, "is_host": True, "img": 21},
            {"email": "ritu.host@example.com", "full_name": "Ritu Sen", "role": RoleEnum.host, "is_host": True, "img": 22},
            {"email": "aditya.host@example.com", "full_name": "Aditya Rao", "role": RoleEnum.host, "is_host": True, "img": 23},
            {"email": "pooja.host@example.com", "full_name": "Pooja Bansal", "role": RoleEnum.host, "is_host": True, "img": 24},
            
            # 8 Guests
            {"email": "vikram.guest@example.com", "full_name": "Vikram Nair", "role": RoleEnum.guest, "is_host": False, "img": 15},
            {"email": "deepa.guest@example.com", "full_name": "Deepa Patel", "role": RoleEnum.guest, "is_host": False, "img": 16},
            {"email": "suresh.guest@example.com", "full_name": "Suresh Kumar", "role": RoleEnum.guest, "is_host": False, "img": 17},
            {"email": "meera.guest@example.com", "full_name": "Meera Joshi", "role": RoleEnum.guest, "is_host": False, "img": 18},
            {"email": "rohan.guest@example.com", "full_name": "Rohan Deshmukh", "role": RoleEnum.guest, "is_host": False, "img": 25},
            {"email": "sneha.guest@example.com", "full_name": "Sneha Kulkarni", "role": RoleEnum.guest, "is_host": False, "img": 26},
            {"email": "aman.guest@example.com", "full_name": "Aman Verma", "role": RoleEnum.guest, "is_host": False, "img": 27},
            {"email": "divya.guest@example.com", "full_name": "Divya Iyer", "role": RoleEnum.guest, "is_host": False, "img": 28},
            
            # 4 Dual-role (Host + Guest)
            {"email": "karan.dual@example.com", "full_name": "Karan Singh", "role": RoleEnum.host, "is_host": True, "img": 19},
            {"email": "neha.dual@example.com", "full_name": "Neha Gupta", "role": RoleEnum.host, "is_host": True, "img": 20},
            {"email": "sameer.dual@example.com", "full_name": "Sameer Khan", "role": RoleEnum.host, "is_host": True, "img": 29},
            {"email": "tanya.dual@example.com", "full_name": "Tanya Bhatia", "role": RoleEnum.host, "is_host": True, "img": 30},
        ]
        
        users_by_email = {}
        users_created = 0
        for idx, u_data in enumerate(user_data):
            user = db.query(User).filter_by(email=u_data["email"]).first()
            if not user:
                user = User(
                    email=u_data["email"],
                    full_name=u_data["full_name"],
                    avatar_url=f"https://i.pravatar.cc/150?img={u_data['img']}",
                    role=u_data["role"],
                    is_host=u_data["is_host"]
                )
                db.add(user)
                db.flush()
                
                auth = AuthIdentity(
                    user_id=user.id,
                    provider="email",
                    provider_user_id=u_data["email"]
                )
                db.add(auth)
                users_created += 1
            users_by_email[user.email] = user
            
        db.commit()
        print(f"Seeded users ({len(users_by_email)} total, {users_created} newly created).")

        # 3. LISTINGS
        # Rich image library from Unsplash (verified high quality architecture/interiors)
        photo_pool = {
            "villa": [
                "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
                "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
                "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800",
            ],
            "cabin": [
                "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800",
                "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
                "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800",
            ],
            "beach_house": [
                "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800",
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
                "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800",
            ],
            "apartment": [
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
                "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
                "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800",
            ],
            "heritage": [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800",
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
            ],
            "countryside": [
                "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800",
                "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800",
                "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
                "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
                "https://images.unsplash.com/photo-1470246973918-29a93221c455?w=800",
                "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800",
            ],
            "tropical": [
                "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
                "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800",
            ],
            "bed_and_breakfast": [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
                "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
                "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
                "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
            ],
            "loft": [
                "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800",
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
                "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800",
                "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
            ],
            "rooms": [
                "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
                "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
                "https://images.unsplash.com/photo-1540518614846-7ede433c4550?w=800",
            ],
            "iconic": [
                "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800",
                "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
                "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800",
                "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800",
                "https://images.unsplash.com/photo-1561361066-6b2223a55395?w=800",
                "https://images.unsplash.com/photo-1558431382-27e303142255?w=800",
            ]
        }

        listing_blueprints = [
            # Goa
            ("Goa", "villa", "Sunset Beachfront Villa with Private Infinity Pool", "Step right onto Vagator sands from this designer beachfront sanctuary featuring panoramic Arabian sea views and chef's kitchen.", 18500, 1800, 8, 4, 4, 4),
            ("Goa", "beach_house", "Portuguese Heritage Casa in Assagao", "Surrounded by mango trees, this restored 150-year-old Portuguese mansion blends vintage tiled verandahs with modern luxury amenities.", 12000, 1200, 6, 3, 3, 3),
            ("Goa", "apartment", "Modern Penthouse overlooking Candolim Beach", "Chic top-floor retreat featuring a rooftop plunge pool, sunset terrace, and high-speed fiber internet for remote work.", 7500, 900, 4, 2, 2, 2),
            ("Goa", "villa", "Tropical Palm Grove Villa in Anjuna", "Private walled estate with a Balinese stone pool, open-air rain showers, and serene garden cabanas.", 15000, 1500, 8, 4, 4, 4),
            
            # Manali
            ("Manali", "cabin", "Himalayan Pine Forest Chalet with Snowy Peak Views", "Cozy cedar wood chalet nestled among deodar pines with a crackling stone fireplace and heated wooden floors.", 8900, 900, 6, 3, 3, 2),
            ("Manali", "mountain_cabin", "Old Manali Riverside Cottage with Glass Sunroom", "Wake up to river melodies and snow-capped Solang Valley peaks. Ideal for nature lovers and writers seeking tranquility.", 6200, 700, 4, 2, 2, 2),
            ("Manali", "cabin", "Panoramic Valley Treehouse & Wooden Lodge", "Perched high above the Beas river, enjoy 360-degree mountain vistas, apple orchards, and stargazing balconies.", 11000, 1100, 5, 2, 3, 2),

            # Jaipur
            ("Jaipur", "heritage", "Royal Haveli Suite with Marbled Courtyard", "Immerse yourself in Rajasthani royalty with carved jharokhas, antique four-poster beds, and sunset palace terrace dining.", 9500, 1000, 4, 2, 2, 2),
            ("Jaipur", "villa", "Amer Fort View Heritage Estate & Private Garden", "Grand pink-city mansion surrounded by fragrant jasmine gardens, peacock courtyards, and artisanal decor.", 14500, 1400, 8, 4, 4, 4),
            ("Jaipur", "apartment", "Artisan Studio in Historic Pink City Walled Quarter", "Tastefully curated apartment with traditional block-printed tapestries, brass accents, and a tranquil balcony.", 4200, 500, 2, 1, 1, 1),

            # Mumbai
            ("Mumbai", "city_apartment", "Skyline Penthouse with Marine Drive Promenade View", "Floor-to-ceiling glass apartment overlooking the Arabian Sea, modern minimalist styling, and 24/7 concierge.", 24000, 2000, 6, 3, 3, 3),
            ("Mumbai", "apartment", "Bandra Bohemian Loft near Bandstand", "Vibrant, sun-filled loft right in the cultural heart of Bandra West with chic cafes and art galleries at your doorstep.", 8800, 800, 3, 1, 2, 1),
            ("Mumbai", "apartment", "Juhu Coastal Designer Studio with Terrace", "Minutes from the beach, this tranquil oasis offers a breezy terrace, modern acoustic insulation, and cozy work nook.", 6900, 700, 2, 1, 1, 1),

            # Udaipur
            ("Udaipur", "heritage", "Lake Pichola Palace Retreat with Royal Terraces", "Direct lakefront vistas of the Jag Mandir and City Palace with hand-painted fresco ceilings and candlelit patio.", 19500, 1800, 6, 3, 3, 3),
            ("Udaipur", "villa", "Aravalli Hills Secluded Infinity Villa", "Contemporary architecture blended with Mewari stone, private heated pool, and breathtaking sunset panoramas.", 16000, 1500, 8, 4, 4, 4),

            # Rishikesh
            ("Rishikesh", "cabin", "Sacred Ganga Riverfront Yoga Sanctuary", "Step directly from your private meditation deck onto white sand riverbanks with Himalayan foothills towering above.", 7800, 800, 4, 2, 2, 2),
            ("Rishikesh", "mountain_cabin", "Himalayan Foothills Glass Cabin & Cliffside Deck", "Panoramic sunrise views over the holy valley with private hot tub, ayurvedic garden, and organic tea kitchen.", 9200, 900, 4, 2, 2, 2),

            # Bangalore
            ("Bangalore", "apartment", "Indiranagar Green Rooftop Garden Loft", "Surrounded by lush rain trees, this penthouse features an open-air terrace garden, espresso bar, and 1 Gbps fiber.", 5800, 600, 3, 1, 2, 1),
            ("Bangalore", "villa", "Contemporary Whitefield Oasis with Lap Pool", "Spacious 4-bedroom urban villa with private courtyard lap pool, curated modern art, and serene Zen patio.", 13500, 1300, 8, 4, 4, 4),

            # Kerala (Kochi & Munnar)
            ("Kerala", "villa", "Vembanad Backwaters Luxury Waterfront Villa", "Private jetty, traditional Kerala teakwood woodwork, infinity pool overlooking serene emerald backwaters.", 17500, 1600, 6, 3, 3, 3),
            ("Kerala", "cabin", "Munnar Misty Tea Plantation Bungalow", "Perched inside a 50-acre working cardamom and tea estate with fireplace, colonial verandahs, and misty mountain trails.", 8400, 800, 6, 3, 3, 2),

            # Pondicherry
            ("Pondicherry", "beach_house", "French Quarter Heritage Villa with Bougainvillea Patio", "Yellow-ochre colonial townhouse with arched French windows, shaded courtyard, and French press coffee bar.", 10500, 1000, 6, 3, 3, 2),
            ("Pondicherry", "beach_house", "Serenity Beachfront Surf Cottage", "Barefoot luxury with direct beach access, hammock pergola, and fresh sea breeze day and night.", 7200, 700, 4, 2, 2, 1),

            # Shimla
            ("Shimla", "cabin", "Mashobra Pine Forest Heritage Cottage with Fireplace", "Colonial era stone and cedar cottage surrounded by cedar forests with 180-degree Himalayan snow views.", 9800, 900, 6, 3, 3, 2),

            # Delhi / Gurgaon
            ("Delhi", "apartment", "Hauz Khas Village Monument View Penthouse", "Overlooks the 13th-century historic reservoir and park with bohemian interiors and private sunset terrace.", 6500, 700, 3, 1, 2, 1),
            ("Delhi", "villa", "Chhatarpur Green Estate Farmhouse with Private Pool", "Sprawling luxury farmhouse on lush 2-acre private grounds with lawn games, BBQ pavilion, and pool.", 22000, 2500, 12, 5, 6, 5),

            # Countryside
            ("Coorg", "countryside", "Sprawling Coffee Plantation Farmhouse in Coorg", "Nestled inside a 40-acre organic coffee and pepper estate with mist-covered hills, bonfire courtyards, and home-cooked Kodava meals.", 7800, 700, 6, 3, 3, 2, "entire", "Karnataka"),
            ("Wayanad", "countryside", "Rustic Organic Farmstay & Spice Valley Retreat", "Escape the rush in this eco-friendly earthen farmhouse surrounded by tea plantations, stream-side trails, and bamboo groves.", 5400, 500, 4, 2, 2, 2, "entire", "Kerala"),
            ("Panchgani", "countryside", "Strawberry Country Stone Barn & Sunset Orchards", "Panoramic Western Ghats vistas with sprawling strawberry fields, stone fire pit, stargazing hammock deck, and fresh dairy breakfasts.", 6900, 600, 5, 2, 3, 2, "entire", "Maharashtra"),
            ("Chikmagalur", "countryside", "Mullayanagiri Foothills Coffee Country Manor", "Colonial teakwood estate home overlooking verdant valley slopes with guided estate walks and open-air gazebo dining.", 8500, 800, 8, 4, 4, 3, "entire", "Karnataka"),
            ("Nashik", "countryside", "Sunlit Vineyard Country Villa & Olive Orchard", "Stay among working grape vines in India's wine capital with private infinity plunge pool, wine cellar access, and countryside tranquility.", 11200, 1100, 6, 3, 3, 3, "entire", "Maharashtra"),
            ("Delhi", "countryside", "Aravalli Ridge Farmhouse & Organic Citrus Grove", "Tranquil green sanctuary on the Delhi-NCR countryside border with manicured lawns, horse stables, and country farm-to-table dining.", 14500, 1500, 10, 4, 5, 4, "entire", "Haryana"),

            # Tropical
            ("Goa", "tropical", "Lush Tropical Palm Oasis with Lagoon Pool in Mandrem", "Hidden jungle paradise surrounded by swaying coconut palms, Balinese daybeds, outdoor rain showers, and lotus ponds.", 13500, 1300, 6, 3, 3, 3, "entire", "Goa"),
            ("Kovalam", "tropical", "Tropical Coconut Grove Beachside Sanctuary", "Just steps from the Arabian Sea, this tropical hideaway features open-air teak pavilions, hammock gardens, and fresh sea breezes.", 8200, 800, 4, 2, 2, 2, "entire", "Kerala"),
            ("Varkala", "tropical", "Clifftop Tropical Treehouse & Ayurvedic Oasis", "Perched high amidst tropical palm canopies overlooking red laterite cliffs with private yoga deck and natural plunge pool.", 6800, 600, 2, 1, 1, 1, "entire", "Kerala"),
            ("Havelock", "tropical", "Private Andaman Tropical Rainforest Bungalow", "Immerse yourself in pristine tropical island luxury under towering mahogany trees with coral reef snorkeling right off the shore.", 16000, 1500, 6, 2, 3, 2, "entire", "Andaman and Nicobar"),
            ("Alibaug", "tropical", "Tropical Frangipani Villa with Private Lap Pool", "Sun-drenched coastal retreat surrounded by lush tropical ferns, mango orchards, and outdoor open-sky bathing courtyards.", 14800, 1400, 8, 4, 4, 4, "entire", "Maharashtra"),
            ("Kochi", "tropical", "Kumarakom Tropical Lagoon Waterfront Haven", "Surrounded by emerald water channels, water lilies, and tropical bird sanctuaries with traditional wooden jetty.", 10500, 1000, 5, 2, 3, 2, "entire", "Kerala"),

            # B&Bs (Bed and Breakfast)
            ("Pondicherry", "bed_and_breakfast", "La Maison Rose French Colonial Boutique B&B", "Charming French Quarter townhouse featuring sunlit bougainvillea terraces, antique four-poster beds, and fresh daily croissants.", 5800, 500, 3, 1, 2, 1, "entire", "Puducherry"),
            ("Darjeeling", "bed_and_breakfast", "Windamere View Colonial Tea Estate B&B", "Warm fireplace parlor, fresh Darjeeling first-flush tea served every morning, and breathtaking views of Mt. Kanchenjunga.", 6200, 600, 4, 2, 2, 2, "entire", "West Bengal"),
            ("Jaipur", "bed_and_breakfast", "Haveli Marigold Boutique Bed & Breakfast", "Family-run Rajasthani heritage home serving authentic kachori breakfasts in a shaded marble jharokha courtyard.", 4600, 400, 2, 1, 1, 1, "entire", "Rajasthan"),
            ("Kochi", "bed_and_breakfast", "Fort Kochi Malabar Spice Garden Homestay & B&B", "Heritage Dutch colonial dwelling with a fragrant spice garden, hand-ground filter coffee, and traditional appam breakfasts.", 3900, 400, 3, 1, 2, 1, "entire", "Kerala"),
            ("Mysore", "bed_and_breakfast", "Royal Chamundi Heritage Courtyard B&B", "Graceful art-deco residence near Mysore Palace serving hot Mysore masala dosas, filter coffee, and tranquil garden seating.", 4200, 400, 4, 2, 2, 1, "entire", "Karnataka"),
            ("Shimla", "bed_and_breakfast", "Cedar Glen Heritage Cottage & Breakfast", "Cozy British-era wooden cottage in Jakhu hills with wood-burning stoves, homemade apple preserves, and panoramic ridge views.", 5500, 500, 4, 2, 2, 2, "entire", "Himachal Pradesh"),

            # Lofts
            ("Mumbai", "loft", "Bandra Bohemian Industrial Art Loft with Skylights", "Double-height industrial ceilings, exposed red brick, large atelier windows, and custom vintage furnishings in hipster Bandra.", 9800, 900, 3, 1, 2, 1, "entire", "Maharashtra"),
            ("Bangalore", "loft", "Koramangala Minimalist Glass & Steel Tech Loft", "Futuristic open-plan urban loft featuring smart automation, private plant-filled terrace, mezzanine workspace, and gigabit fiber.", 6400, 600, 2, 1, 1, 1, "entire", "Karnataka"),
            ("Delhi", "loft", "Hauz Khas Village Artist Loft Overlooking Heritage Lake", "Boho-chic design loft with wrought-iron spiral staircase, raw concrete walls, rooftop access, and steps to Hauz Khas ruins.", 7200, 700, 3, 1, 2, 1, "entire", "Delhi"),
            ("Hyderabad", "loft", "Jubilee Hills Designer Open-Concept Penthouse Loft", "Ultra-sleek modern loft with high ceilings, acoustic isolation, curated modern art, and sweeping skyline views of Durgam Cheruvu.", 8400, 800, 4, 2, 2, 2, "entire", "Telangana"),
            ("Pune", "loft", "Koregaon Park Greenery Glasshouse Loft", "Sun-drenched biophilic loft surrounded by towering banyan canopies with hammock corner, espresso bar, and reading nook.", 5200, 500, 2, 1, 1, 1, "entire", "Maharashtra"),
            ("Goa", "loft", "Assagao Architectural Mezzanine Loft in Mango Orchard", "Unique blend of modern glass architecture and Goan greenery, floating steel staircase, and private plunge pool.", 11500, 1100, 4, 1, 2, 2, "entire", "Goa"),

            # Private Rooms
            ("Udaipur", "rooms", "Deluxe Lake Pichola Private Room in Heritage Haveli", "Peaceful ensuite private room with antique jharokha window framing the City Palace and sparkling lake waters.", 3200, 300, 2, 1, 1, 1, "private_room", "Rajasthan"),
            ("Manali", "rooms", "Cozy Pine Attic Private Room with Balcony & Fireplace", "Warm cedar-paneled private room high in Old Manali with private balcony facing the snow-capped Rohtang peaks.", 2400, 250, 2, 1, 1, 1, "private_room", "Himachal Pradesh"),
            ("Rishikesh", "rooms", "Ganga Riverside Meditation Private Suite with Terrace", "Tranquil private room with ensuite bath, meditation cushions, and private terrace overlooking the sacred emerald river.", 2800, 300, 2, 1, 1, 1, "private_room", "Uttarakhand"),
            ("Mumbai", "rooms", "Colaba Victorian Art Deco Private Room near Gateway", "Spacious heritage high-ceiling room with private bath, vintage teak desk, and walking distance to the Gateway of India.", 4500, 400, 2, 1, 1, 1, "private_room", "Maharashtra"),
            ("Bangalore", "rooms", "Indiranagar Serene Garden View Master Bedroom", "Airy master bedroom with private balcony, ensuite rain shower, and quiet work desk in a leafy Indiranagar villa.", 2600, 250, 2, 1, 1, 1, "private_room", "Karnataka"),
            ("Jaipur", "rooms", "Peacock Courtyard Heritage Private Room", "Charming room with traditional fresco accents, private ensuite bathroom, and direct access to a fragrant marble courtyard.", 2200, 200, 2, 1, 1, 1, "private_room", "Rajasthan"),

            # Iconic Cities
            ("Mumbai", "iconic", "Iconic Marine Drive Art Deco Promenade Suite", "Unobstructed panoramic view of the Queen's Necklace and Arabian Sea from this legendary South Mumbai heritage landmark.", 22000, 2000, 4, 2, 2, 2, "entire", "Maharashtra"),
            ("Delhi", "iconic", "Lutyens Heritage Residence near India Gate", "Prestigious address in the heart of the national capital with grand colonial columns, private lawns, and 24/7 security.", 18500, 1800, 6, 3, 3, 3, "entire", "Delhi"),
            ("Agra", "iconic", "Taj Mahal Sunset View Rooftop Luxury Residence", "Wake up to breathtaking direct vistas of the Taj Mahal dome from your private rooftop jacuzzi and marble lounge.", 14000, 1400, 4, 2, 2, 2, "entire", "Uttar Pradesh"),
            ("Jaipur", "iconic", "Hawa Mahal Iconic Palace Vista Penthouse", "Direct eye-level views of the Palace of Winds with royal Rajasthani interiors, private plunge pool, and rooftop dining.", 15500, 1500, 6, 3, 3, 3, "entire", "Rajasthan"),
            ("Varanasi", "iconic", "Sacred Ghats Floating Balcony Suite on the Ganga", "Peerless private balcony hanging right over Dashashwamedh Ghat for the evening Ganga Aarti and morning boat processions.", 11000, 1000, 4, 2, 2, 2, "entire", "Uttar Pradesh"),
            ("Kolkata", "iconic", "Park Street Grand Colonial Residence near Victoria Memorial", "Stately colonial high-ceiling residence with British vintage chandeliers, Burma teak flooring, and piano parlor.", 12500, 1200, 6, 3, 3, 3, "entire", "West Bengal"),
        ]

        host_users = [u for u in users_by_email.values() if u.is_host]
        
        all_listings = list(db.query(Listing).all())
        listings_created = 0

        for bp in listing_blueprints:
            if len(bp) == 12:
                city, p_type, title, desc, price, clean_fee, max_g, bedr, beds, baths, r_type, state_val = bp
            else:
                city, p_type, title, desc, price, clean_fee, max_g, bedr, beds, baths = bp
                r_type = "private_room" if p_type in ("rooms", "private_room") else "entire"
                state_val = "State"

            host = random.choice(host_users)

            existing = db.query(Listing).filter_by(title=title).first()
            if not existing:
                city_lower = city.lower().strip()
                base_lat, base_lng = CITY_COORDINATES.get(city_lower, (15.4989, 73.8278))
                lat = round(base_lat + random.uniform(-0.02, 0.02), 4)
                lng = round(base_lng + random.uniform(-0.02, 0.02), 4)

                listing = Listing(
                    host_id=host.id,
                    title=title,
                    description=desc,
                    property_type=p_type,
                    room_type=r_type,
                    max_guests=max_g,
                    bedrooms=bedr,
                    beds=beds,
                    bathrooms=baths,
                    price_per_night=price,
                    cleaning_fee=clean_fee,
                    address=f"{random.randint(10, 999)} Heritage Way, {city}",
                    city=city,
                    state=state_val,
                    country="India",
                    latitude=lat,
                    longitude=lng,
                    rating_avg=round(random.uniform(4.75, 4.98), 2),
                    review_count=random.randint(8, 64),
                    is_active=True
                )
                db.add(listing)
                db.flush()

                # Photos: pick from photo_pool or mix
                category_key = p_type if p_type in photo_pool else "villa"
                pool_imgs = photo_pool.get(category_key, photo_pool["villa"])
                num_imgs = min(len(pool_imgs), random.randint(4, 5))
                chosen_imgs = random.sample(pool_imgs, num_imgs)

                for j, img_url in enumerate(chosen_imgs):
                    db.add(ListingImage(
                        listing_id=listing.id,
                        url=img_url,
                        is_cover=(j == 0),
                        display_order=j
                    ))

                # Amenities
                num_amenities = random.randint(6, 12)
                chosen_amenities = random.sample(amenity_objs, num_amenities)
                for am in chosen_amenities:
                    db.add(ListingAmenity(listing_id=listing.id, amenity_id=am.id))

                listings_created += 1
                all_listings.append(listing)

        db.commit()
        # Refresh all listings
        all_listings = list(db.query(Listing).all())
        print(f"Seeded listings ({len(all_listings)} total, {listings_created} newly created).")

        # 4. BOOKINGS
        guest_users = [u for u in users_by_email.values() if not u.is_host] + [
            users_by_email["karan.dual@example.com"],
            users_by_email["neha.dual@example.com"],
            users_by_email["sameer.dual@example.com"],
            users_by_email["tanya.dual@example.com"],
        ]
        
        target_bookings = 60
        bookings_created = 0
        all_completed_bookings = list(db.query(Booking).filter_by(status=BookingStatus.completed).all())

        today = date.today()

        for i in range(target_bookings):
            guest = random.choice(guest_users)
            listing = random.choice(all_listings)

            if guest.id == listing.host_id:
                continue

            # Generate diverse date ranges:
            # - Past dates for completed trips
            # - Near future for confirmed/pending trips
            if i < 35:
                # Past completed booking (2025/2026 past)
                days_ago = random.randint(10, 180)
                check_in = today - timedelta(days=days_ago)
                nights = random.randint(2, 6)
                check_out = check_in + timedelta(days=nights)
                status = BookingStatus.completed
            elif i < 50:
                # Future confirmed
                days_ahead = random.randint(3, 45)
                check_in = today + timedelta(days=days_ahead)
                nights = random.randint(2, 5)
                check_out = check_in + timedelta(days=nights)
                status = BookingStatus.confirmed
            elif i < 55:
                # Future pending
                days_ahead = random.randint(5, 30)
                check_in = today + timedelta(days=days_ahead)
                nights = random.randint(1, 4)
                check_out = check_in + timedelta(days=nights)
                status = BookingStatus.pending
            else:
                # Past cancelled
                days_ago = random.randint(20, 90)
                check_in = today - timedelta(days=days_ago)
                nights = random.randint(2, 4)
                check_out = check_in + timedelta(days=nights)
                status = BookingStatus.cancelled

            existing_b = db.query(Booking).filter_by(
                guest_id=guest.id,
                listing_id=listing.id,
                check_in=check_in
            ).first()

            if not existing_b:
                price_pn = Decimal(str(listing.price_per_night))
                cleaning = Decimal(str(listing.cleaning_fee or 0))
                subtotal = price_pn * nights
                service = (subtotal * Decimal('0.12')).quantize(Decimal('0.01'))
                total = subtotal + cleaning + service

                b = Booking(
                    listing_id=listing.id,
                    guest_id=guest.id,
                    host_id=listing.host_id,
                    check_in=check_in,
                    check_out=check_out,
                    guests=random.randint(1, max(1, listing.max_guests or 2)),
                    nights=nights,
                    price_per_night=price_pn,
                    subtotal=subtotal,
                    cleaning_fee=cleaning,
                    service_fee=service,
                    total=total,
                    status=status
                )
                db.add(b)
                db.flush()
                bookings_created += 1

                if status == BookingStatus.completed:
                    all_completed_bookings.append(b)

        db.commit()
        total_bookings = db.query(Booking).count()
        print(f"Seeded bookings ({total_bookings} total, {bookings_created} newly created).")

        # 5. REVIEWS
        reviews_created = 0
        review_comments = [
            "An absolute dream stay! The photos don't even do justice to the views. Super clean, beautifully styled, and the host was wonderfully helpful.",
            "Loved every minute here. Waking up to the serene surroundings was magical. The kitchen was fully equipped and beds were exceptionally comfortable.",
            "Outstanding hospitality! Arjun and his team went above and beyond to make our stay seamless. Highly recommend to anyone visiting.",
            "Perfection in every detail! Fast Wi-Fi for work, crystal clean bathrooms, and an incredible sunset deck. We cannot wait to return.",
            "The architecture and interior details are top-notch. Very quiet and peaceful, yet close to all the best cafes and sights.",
            "One of the best Airbnbs we've ever stayed in. Thoughtful amenities, great air conditioning, and seamless check-in.",
            "Truly a 5-star experience. The host had great local recommendations that made our vacation unforgettable.",
            "Spacious, spotless, and filled with natural light. The private pool and garden are impeccably maintained.",
            "Super cozy vibe with breathtaking morning views. Everything worked smoothly from booking to checkout.",
            "Exceeded all expectations! The location is prime and the property is even more stunning in person."
        ]

        for b in all_completed_bookings:
            existing_r = db.query(Review).filter_by(booking_id=b.id).first()
            if not existing_r:
                r = Review(
                    listing_id=b.listing_id,
                    reviewer_id=b.guest_id,
                    booking_id=b.id,
                    rating=random.choice([5, 5, 5, 4]),  # predominantly 5 stars with occasional 4
                    comment=random.choice(review_comments)
                )
                db.add(r)
                reviews_created += 1

        db.commit()
        total_reviews = db.query(Review).count()
        print(f"Seeded reviews ({total_reviews} total, {reviews_created} newly created).")

        # 6. WISHLISTS
        wishlists_created = 0
        existing_wishlists = set(
            (w.user_id, w.listing_id) for w in db.query(Wishlist.user_id, Wishlist.listing_id).all()
        )
        users_list = list(users_by_email.values())
        attempts = 0
        while wishlists_created < 30 and attempts < 300:
            attempts += 1
            u = random.choice(users_list)
            l = random.choice(all_listings)
            pair = (u.id, l.id)
            if pair not in existing_wishlists:
                existing_wishlists.add(pair)
                wish = Wishlist(user_id=u.id, listing_id=l.id)
                db.add(wish)
                wishlists_created += 1

        db.commit()
        total_wishlists = db.query(Wishlist).count()
        print(f"Seeded wishlists ({total_wishlists} total, {wishlists_created} newly created).")

        # 7. UPDATE LISTINGS RATING_AVG AND REVIEW_COUNT
        for l in all_listings:
            revs = db.query(Review).filter_by(listing_id=l.id).all()
            if revs:
                avg = sum(r.rating for r in revs) / len(revs)
                l.rating_avg = round(avg, 2)
                l.review_count = len(revs)
        db.commit()

        # Summary
        final_users = db.query(User).count()
        final_listings = db.query(Listing).count()
        final_bookings = db.query(Booking).count()
        final_reviews = db.query(Review).count()
        final_wishlists = db.query(Wishlist).count()

        print(f"\n==========================================")
        print(f"Database Seeding Complete:")
        print(f"  • Users:     {final_users}")
        print(f"  • Listings:  {final_listings}")
        print(f"  • Bookings:  {final_bookings}")
        print(f"  • Reviews:   {final_reviews}")
        print(f"  • Wishlists: {final_wishlists}")
        print(f"==========================================")

    except Exception as e:
        db.rollback()
        print(f"An error occurred during seed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
