import os
import sys
import random
from datetime import date, timedelta

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.user import User, AuthIdentity, RoleEnum
from app.models.listing import Listing, ListingImage, Amenity, ListingAmenity
from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.models.wishlist import Wishlist

def seed():
    db = SessionLocal()
    try:
        print("Starting seed...")

        # 1. AMENITIES
        amenity_names = [
            "WiFi", "Kitchen", "Air conditioning", "Heating", "Washer", 
            "Dryer", "Free parking", "Pool", "Hot tub", "Gym", "TV", 
            "Workspace", "Elevator", "Fireplace", "BBQ grill", "Beach access", 
            "Mountain view", "City view"
        ]
        
        amenity_objs = []
        for name in amenity_names:
            am = db.query(Amenity).filter_by(name=name).first()
            if not am:
                am = Amenity(name=name, icon=name.lower().replace(" ", "_"), category="General")
                db.add(am)
            amenity_objs.append(am)
        db.commit()
        print(f"Seeded {len(amenity_objs)} amenities.")

        # 2. USERS
        user_data = [
            # 4 Hosts
            {"email": "arjun.host@example.com", "full_name": "Arjun Mehta", "role": RoleEnum.host, "is_host": True, "img": 11},
            {"email": "priya.host@example.com", "full_name": "Priya Sharma", "role": RoleEnum.host, "is_host": True, "img": 12},
            {"email": "rahul.host@example.com", "full_name": "Rahul Verma", "role": RoleEnum.host, "is_host": True, "img": 13},
            {"email": "ananya.host@example.com", "full_name": "Ananya Singh", "role": RoleEnum.host, "is_host": True, "img": 14},
            # 4 Guests
            {"email": "vikram.guest@example.com", "full_name": "Vikram Nair", "role": RoleEnum.guest, "is_host": False, "img": 15},
            {"email": "deepa.guest@example.com", "full_name": "Deepa Patel", "role": RoleEnum.guest, "is_host": False, "img": 16},
            {"email": "suresh.guest@example.com", "full_name": "Suresh Kumar", "role": RoleEnum.guest, "is_host": False, "img": 17},
            {"email": "meera.guest@example.com", "full_name": "Meera Joshi", "role": RoleEnum.guest, "is_host": False, "img": 18},
            # 2 Dual-role
            {"email": "karan.dual@example.com", "full_name": "Karan Singh", "role": RoleEnum.host, "is_host": True, "img": 19},
            {"email": "neha.dual@example.com", "full_name": "Neha Gupta", "role": RoleEnum.host, "is_host": True, "img": 20},
        ]
        
        users_by_email = {}
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
                db.flush() # get ID
                
                # Add AuthIdentity
                auth = AuthIdentity(
                    user_id=user.id,
                    provider="google",
                    provider_user_id=f"google_{idx}"
                )
                db.add(auth)
            users_by_email[user.email] = user
            
        db.commit()
        print(f"Seeded {len(users_by_email)} users.")

        # 3. LISTINGS
        cities = ["Delhi", "Gurgaon", "Mumbai", "Goa", "Jaipur", "Manali", "Rishikesh", "Bangalore", "Hyderabad", "Udaipur"]
        property_types = ["apartment", "villa", "house", "cabin", "beach_house", "mountain_cabin", "city_apartment"]
        images = [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800",
            "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800"
        ]
        
        hosts = [u for u in users_by_email.values() if u.is_host]
        
        listings_created = 0
        all_listings = []
        for i in range(30):
            city = random.choice(cities)
            prop_type = random.choice(property_types)
            title = f"Beautiful {prop_type.replace('_', ' ').title()} in {city}"
            host = random.choice(hosts)
            
            listing = db.query(Listing).filter_by(title=title, host_id=host.id).first()
            if not listing:
                price = random.randint(20, 250) * 100 # 2000 to 25000 INR
                listing = Listing(
                    host_id=host.id,
                    title=title,
                    description=f"A wonderful place to stay in {city}. Enjoy our lovely {prop_type.replace('_', ' ')} with great amenities and comfortable spaces.",
                    property_type=prop_type,
                    room_type="entire",
                    max_guests=random.randint(2, 10),
                    bedrooms=random.randint(1, 5),
                    beds=random.randint(1, 6),
                    bathrooms=random.randint(1, 4),
                    price_per_night=price,
                    cleaning_fee=random.randint(5, 20) * 100,
                    address=f"{random.randint(1, 999)} Main St, {city}",
                    city=city,
                    state="State",
                    country="India",
                    rating_avg=round(random.uniform(4.2, 4.9), 2),
                    review_count=random.randint(3, 47),
                    is_active=True
                )
                db.add(listing)
                db.flush()
                
                # Add images
                num_images = random.randint(3, 5)
                selected_imgs = random.sample(images, num_images)
                for j, img_url in enumerate(selected_imgs):
                    db.add(ListingImage(
                        listing_id=listing.id,
                        url=img_url,
                        is_cover=(j == 0),
                        display_order=j
                    ))
                    
                # Add amenities
                num_amenities = random.randint(4, 8)
                selected_amenities = random.sample(amenity_objs, num_amenities)
                for am in selected_amenities:
                    db.add(ListingAmenity(listing_id=listing.id, amenity_id=am.id))
                
                listings_created += 1
            all_listings.append(listing)
        
        db.commit()
        print(f"Seeded 30 listings (created {listings_created} new).")

        # 4. BOOKINGS
        guests = [u for u in users_by_email.values() if not u.is_host] + [users_by_email["karan.dual@example.com"], users_by_email["neha.dual@example.com"]]
        
        num_bookings = 25
        bookings_created = 0
        all_completed_bookings = []
        
        for i in range(num_bookings):
            guest = random.choice(guests)
            listing = random.choice(all_listings)
            
            # Prevent booking own listing
            if guest.id == listing.host_id:
                continue
                
            check_in = date(2024, random.randint(1, 12), random.randint(1, 28))
            nights = random.randint(1, 7)
            check_out = check_in + timedelta(days=nights)
            
            booking = db.query(Booking).filter_by(
                guest_id=guest.id, 
                listing_id=listing.id, 
                check_in=check_in
            ).first()
            
            # Make sure we have at least 15 completed bookings to seed 15+ reviews
            status = BookingStatus.completed if i < 18 else random.choice(list(BookingStatus))
            
            if not booking:
                price_pn = float(listing.price_per_night)
                subtotal = price_pn * nights
                cleaning = float(listing.cleaning_fee)
                service = round(subtotal * 0.1, 2)
                
                booking = Booking(
                    listing_id=listing.id,
                    guest_id=guest.id,
                    host_id=listing.host_id,
                    check_in=check_in,
                    check_out=check_out,
                    guests=random.randint(1, listing.max_guests),
                    nights=nights,
                    price_per_night=price_pn,
                    subtotal=subtotal,
                    cleaning_fee=cleaning,
                    service_fee=service,
                    total=subtotal + cleaning + service,
                    status=status
                )
                db.add(booking)
                db.flush()
                bookings_created += 1
                
            if booking.status == BookingStatus.completed:
                all_completed_bookings.append(booking)
                
        db.commit()
        print(f"Seeded {num_bookings} bookings (created {bookings_created} new).")

        # 5. REVIEWS
        reviews_created = 0
        review_comments = [
            "Absolutely beautiful place, perfectly located.",
            "The host was very accommodating and friendly.",
            "Clean, comfortable, and exactly as described.",
            "Had a wonderful stay, highly recommend it!",
            "Great value for money and an amazing experience.",
            "Very peaceful and well maintained property.",
            "Fantastic location with everything we needed.",
            "Such a cozy vibe, we will definitely come back."
        ]
        
        for booking in all_completed_bookings:
            review = db.query(Review).filter_by(booking_id=booking.id).first()
            if not review:
                review = Review(
                    listing_id=booking.listing_id,
                    reviewer_id=booking.guest_id,
                    booking_id=booking.id,
                    rating=random.randint(4, 5),
                    comment=random.choice(review_comments)
                )
                db.add(review)
                reviews_created += 1
                
        db.commit()
        print(f"Seeded reviews for completed bookings (created {reviews_created} new).")

        # 6. WISHLISTS
        wishlists_created = 0
        for _ in range(20):
            user = random.choice(list(users_by_email.values()))
            listing = random.choice(all_listings)
            
            wish = db.query(Wishlist).filter_by(user_id=user.id, listing_id=listing.id).first()
            if not wish:
                wish = Wishlist(user_id=user.id, listing_id=listing.id)
                db.add(wish)
                wishlists_created += 1
                
        db.commit()
        print(f"Seeded wishlists (created {wishlists_created} new).")
        
        # Summary
        total_users = db.query(User).count()
        total_listings = db.query(Listing).count()
        total_bookings = db.query(Booking).count()
        total_reviews = db.query(Review).count()
        
        print(f"\nSeed complete: {total_users} users, {total_listings} listings, {total_bookings} bookings, {total_reviews} reviews")
        
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
