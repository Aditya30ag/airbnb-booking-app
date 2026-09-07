"""initial schema

Revision ID: 0001
Revises: 
Create Date: 2026-09-07 00:36:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Create enums
    role_enum = postgresql.ENUM('guest', 'host', name='roleenum', create_type=False)
    role_enum.create(op.get_bind(), checkfirst=True)
    booking_status_enum = postgresql.ENUM('pending', 'confirmed', 'cancelled', 'completed', name='bookingstatus', create_type=False)
    booking_status_enum.create(op.get_bind(), checkfirst=True)

    # users
    op.create_table('users',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('full_name', sa.String(), nullable=False),
    sa.Column('avatar_url', sa.String(), nullable=True),
    sa.Column('role', role_enum, nullable=True),
    sa.Column('is_host', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )

    # auth_identities
    op.create_table('auth_identities',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('provider', sa.String(), nullable=False),
    sa.Column('provider_user_id', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('provider', 'provider_user_id', name='uq_provider_user_id')
    )

    # amenities
    op.create_table('amenities',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('icon', sa.String(), nullable=True),
    sa.Column('category', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )

    # listings
    op.create_table('listings',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('host_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('property_type', sa.String(), nullable=True),
    sa.Column('room_type', sa.String(), nullable=True),
    sa.Column('max_guests', sa.Integer(), nullable=True),
    sa.Column('bedrooms', sa.Integer(), nullable=True),
    sa.Column('beds', sa.Integer(), nullable=True),
    sa.Column('bathrooms', sa.Integer(), nullable=True),
    sa.Column('price_per_night', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('cleaning_fee', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('city', sa.String(), nullable=True),
    sa.Column('state', sa.String(), nullable=True),
    sa.Column('country', sa.String(), nullable=True),
    sa.Column('latitude', sa.Float(), nullable=True),
    sa.Column('longitude', sa.Float(), nullable=True),
    sa.Column('rating_avg', sa.Float(), nullable=True),
    sa.Column('review_count', sa.Integer(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['host_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_listings_city', 'listings', ['city'], unique=False)
    op.create_index('ix_listings_property_type', 'listings', ['property_type'], unique=False)
    op.create_index('ix_listings_price_per_night', 'listings', ['price_per_night'], unique=False)
    op.create_index('ix_listings_is_active', 'listings', ['is_active'], unique=False)
    op.create_index('ix_listings_host_id', 'listings', ['host_id'], unique=False)

    # listing_images
    op.create_table('listing_images',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('listing_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('url', sa.String(), nullable=False),
    sa.Column('is_cover', sa.Boolean(), nullable=True),
    sa.Column('display_order', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['listing_id'], ['listings.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

    # listing_amenities
    op.create_table('listing_amenities',
    sa.Column('listing_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('amenity_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.ForeignKeyConstraint(['amenity_id'], ['amenities.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['listing_id'], ['listings.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('listing_id', 'amenity_id')
    )

    # bookings
    op.create_table('bookings',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('listing_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('guest_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('host_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('check_in', sa.Date(), nullable=False),
    sa.Column('check_out', sa.Date(), nullable=False),
    sa.Column('guests', sa.Integer(), nullable=False),
    sa.Column('nights', sa.Integer(), nullable=False),
    sa.Column('price_per_night', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('cleaning_fee', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('service_fee', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('total', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('status', booking_status_enum, nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['guest_id'], ['users.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['host_id'], ['users.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['listing_id'], ['listings.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_bookings_listing_dates', 'bookings', ['listing_id', 'check_in', 'check_out'], unique=False)
    op.create_index('ix_bookings_guest_id', 'bookings', ['guest_id'], unique=False)
    op.create_index('ix_bookings_host_id', 'bookings', ['host_id'], unique=False)
    op.create_index('ix_bookings_status', 'bookings', ['status'], unique=False)

    # reviews
    op.create_table('reviews',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('listing_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('reviewer_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('booking_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('rating', sa.Integer(), nullable=False),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
    sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['listing_id'], ['listings.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('booking_id')
    )
    op.create_index('ix_reviews_listing_id', 'reviews', ['listing_id'], unique=False)
    op.create_index('ix_reviews_booking_id', 'reviews', ['booking_id'], unique=False)

    # wishlists
    op.create_table('wishlists',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('listing_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['listing_id'], ['listings.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'listing_id', name='uq_wishlist_user_listing')
    )
    op.create_index('ix_wishlists_user_id', 'wishlists', ['user_id'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_wishlists_user_id', table_name='wishlists')
    op.drop_table('wishlists')
    op.drop_index('ix_reviews_booking_id', table_name='reviews')
    op.drop_index('ix_reviews_listing_id', table_name='reviews')
    op.drop_table('reviews')
    op.drop_index('ix_bookings_status', table_name='bookings')
    op.drop_index('ix_bookings_host_id', table_name='bookings')
    op.drop_index('ix_bookings_guest_id', table_name='bookings')
    op.drop_index('ix_bookings_listing_dates', table_name='bookings')
    op.drop_table('bookings')
    op.drop_table('listing_amenities')
    op.drop_table('listing_images')
    op.drop_index('ix_listings_host_id', table_name='listings')
    op.drop_index('ix_listings_is_active', table_name='listings')
    op.drop_index('ix_listings_price_per_night', table_name='listings')
    op.drop_index('ix_listings_property_type', table_name='listings')
    op.drop_index('ix_listings_city', table_name='listings')
    op.drop_table('listings')
    op.drop_table('amenities')
    op.drop_table('auth_identities')
    op.drop_table('users')
    
    # Drop enums
    postgresql.ENUM(name='roleenum').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='bookingstatus').drop(op.get_bind(), checkfirst=True)
