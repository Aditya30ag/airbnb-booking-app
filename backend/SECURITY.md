# Security Architecture & Authorization Audit

This document outlines the security model, authentication flows, endpoint authorization policies, data integrity constraints, and concurrency guarantees implemented in the Airbnb Marketplace backend.

---

## 1. Authentication Flow

### Current Implementation (Development / Header Auth)
- Requests authenticate using the `X-User-Id` HTTP header passing the user's UUID.
- Validated via dependency `require_auth` in `app/core/dependencies.py`:
  - Missing header -> `401 Unauthorized` (`Authentication required`).
  - Invalid UUID format -> `401 Unauthorized` (`Invalid user ID`).
  - Valid UUID -> yields authenticated user UUID.
- Host privileges are validated via `require_host`:
  - Retrieves the user record from the database.
  - Verifies that `user.is_host == True` or `user.role == 'host'`.
  - If not a host -> `403 Forbidden` (`Not authorized to modify this resource`).

### Future Production Path
- Replace header-based auth with signed asymmetric JWT tokens (e.g. Supabase Auth, Auth0, or custom OAuth 2.0 / RS256 Bearer tokens).
- Fast verification via public JWKS with `sub` claim representing the user ID.

---

## 2. Authorization Rules Per Endpoint

### Listings (`/api/listings`)
| Method | Endpoint | Access Level | Authorization & Ownership Rules |
|---|---|---|---|
| `GET` | `/api/listings` | Public | Open search & filtering across active listings. |
| `GET` | `/api/listings/{id}` | Public | Anyone can view listing details. |
| `GET` | `/api/listings/{id}/availability` | Public | Anyone can check availability calendar. |
| `GET` | `/api/amenities` | Public | Read-only global amenity options. |
| `POST` | `/api/listings` | Authenticated Host | Must be host (`is_host=True`). Listing host_id assigned to current user. |
| `PUT` | `/api/listings/{id}` | Authenticated Host (Owner) | Must be host AND `listing.host_id == current_user.id`. Fails with `403 Forbidden` (`Not authorized to modify this resource`) if not owner. |
| `DELETE` | `/api/listings/{id}` | Authenticated Host (Owner) | Must be host AND `listing.host_id == current_user.id`. Fails with `403 Forbidden` (`Not authorized to modify this resource`) if not owner. Sets `is_active=False`. |

---

### Bookings (`/api/bookings`)
| Method | Endpoint | Access Level | Authorization & Ownership Rules |
|---|---|---|---|
| `POST` | `/api/bookings` | Authenticated User | Requires valid user. **Hosts are forbidden from booking their own listings** (`listing.host_id != current_user.id`). Guest ID assigned from authenticated context. |
| `GET` | `/api/bookings/my-trips` | Authenticated User | Strictly filters by `guest_id == current_user.id`. Users cannot view other users' trips. |
| `GET` | `/api/bookings/{id}` | Authenticated User (Participant) | Strictly checks `booking.guest_id == current_user.id OR booking.host_id == current_user.id`. Returns `403 Forbidden` (`Not authorized to modify this resource`) if neither. |
| `PATCH` | `/api/bookings/{id}/confirm` | Authenticated User (Participant) | Guest or host can confirm booking. Returns `403 Forbidden` if not participant. |
| `PATCH` | `/api/bookings/{id}/cancel` | Authenticated Guest (Owner) | **Only the booking guest** (`booking.guest_id == current_user.id`) can cancel. Host or third-parties receive `403 Forbidden` (`Not authorized to modify this resource`). |

---

### Wishlist (`/api/wishlist`)
| Method | Endpoint | Access Level | Authorization & Ownership Rules |
|---|---|---|---|
| `GET` | `/api/wishlist` | Authenticated User | Strictly scoped to `current_user.id`. |
| `GET` | `/api/wishlist/ids` | Authenticated User | Strictly scoped to `current_user.id`. |
| `POST` | `/api/wishlist/{listing_id}` | Authenticated User | Strictly inserts `(user_id=current_user.id, listing_id)`. Idempotent against duplicates. |
| `DELETE` | `/api/wishlist/{listing_id}` | Authenticated User | Strictly deletes matching `user_id == current_user.id`. Users cannot delete others' wishlists. |

---

### Reviews (`/api/listings/{id}/reviews`)
| Method | Endpoint | Access Level | Authorization & Ownership Rules |
|---|---|---|---|
| `GET` | `/api/listings/{id}/reviews` | Public | Paginated list of reviews for a listing. |
| `POST` | `/api/listings/{id}/reviews` | Authenticated Guest | **Strict 4-point eligibility check**: <br>1. Booking exists for listing.<br>2. `booking.guest_id == current_user.id`.<br>3. `booking.status == 'completed'`.<br>4. No existing review for `booking_id`.<br>Returns `403 Forbidden` if ineligible, and `409 Conflict` on duplicate constraint catch. Updates `rating_avg` and `review_count` in transaction. |

---

### Host Dashboard (`/api/host`)
| Method | Endpoint | Access Level | Authorization & Ownership Rules |
|---|---|---|---|
| `GET` | `/api/host/listings` | Authenticated Host | Requires `is_host=True`. Strictly filtered to `host_id == current_user.id`. |
| `GET` | `/api/host/bookings` | Authenticated Host | Requires `is_host=True`. Strictly filtered to `host_id == current_user.id`. |
| `GET` | `/api/host/stats` | Authenticated Host | Requires `is_host=True`. Aggregations computed strictly where `host_id == current_user.id`. |

---

## 3. Ownership Checks & Error Responses

- Consistent `403 Forbidden` with body `{"detail": "Not authorized to modify this resource"}` across all unauthorized mutations or access attempts on listings and bookings.
- Non-existent resources yield `404 Not Found` without disclosing ownership metadata.
- Unauthenticated requests yield `401 Unauthorized`.

---

## 4. How Booking Concurrency Is Handled

1. **Date Overlap Detection**:
   - Availability search excludes listings with overlapping bookings using standard interval logic:
     `booking.check_in < requested_check_out AND booking.check_out > requested_check_in` where status is `confirmed` or `pending`.
2. **Review Idempotency & Concurrency**:
   - Database level `UNIQUE(booking_id)` constraint on the `reviews` table prevents double-reviews under race conditions.
   - Database rollbacks ensure rating averages are never tainted by failed review attempts.
3. **Wishlist Concurrency**:
   - `UniqueConstraint('user_id', 'listing_id')` ensures duplicate clicks or parallel tabs gracefully resolve without primary key collisions or duplicate rows.
4. **Recommended Production Concurrency**:
   - For high-volume booking creation, utilize PostgreSQL pessimistic row-level locking on listing dates (`SELECT ... FOR UPDATE`) or transactional exclusion constraints (`EXCLUDE USING gist ... WITH &&`) to prevent double-booking identical date ranges.

---

## 5. Defense-in-Depth & Data Sanitization

- **No Sensitive Fields**: No password, hash, token, or internal security fields exist in any Pydantic response models (`UserResponse`, `BookingResponse`, etc.).
- **Extra Field Stripping**: All Pydantic request and response schemas explicitly enforce `ConfigDict(extra='ignore')` to prevent mass-assignment attacks and ignore unexpected payload parameters.
- **CORS Policies**:
  - In `production` environment (`ENVIRONMENT=production`), CORS origin is locked strictly to `settings.FRONTEND_URL`.
  - Development origins (`localhost:3000`, `localhost:5173`) are only enabled during non-production runs.

---

## 6. What Is NOT Implemented (Future Work)

1. **Real Payment Gateway**:
   - Current checkout simulates payment verification. A production deployment requires webhook-driven asynchronous payment processing (Stripe / Razorpay / Adyen) with idempotent payment intents before transitioning bookings to `confirmed`.
2. **Distributed Rate Limiting**:
   - Main entry point contains middleware hints for `slowapi` / Redis-backed sliding-window rate limiters. Required for anti-scraping and brute-force protection.
3. **Email Verification & Identity Checks**:
   - Currently, user accounts created or seeded do not require OTP verification or government ID verification prior to hosting.
4. **JWT Verification Layer**:
   - Current authentication uses request headers (`X-User-Id`) as a placeholder for a complete OAuth2 / JWT provider.
