'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe2, Facebook, Twitter, Instagram } from 'lucide-react';

export interface DestinationItem {
  city: string;
  type: string;
}

const tabs = ['Popular', 'Arts & culture', 'Beach', 'Mountains', 'Outdoors', 'Things to do'] as const;
type TabType = (typeof tabs)[number];

const TAB_DATA: Record<TabType, DestinationItem[]> = {
  Popular: [
    { city: 'Delhi', type: 'Apartment rentals' },
    { city: 'Mumbai', type: 'Holiday rentals' },
    { city: 'Goa', type: 'Villa rentals' },
    { city: 'Jaipur', type: 'Holiday rentals' },
    { city: 'Bangalore', type: 'Flat rentals' },
    { city: 'Hyderabad', type: 'Apartment rentals' },
    { city: 'Udaipur', type: 'Cottage rentals' },
    { city: 'Manali', type: 'Cabin rentals' },
    { city: 'Rishikesh', type: 'House rentals' },
    { city: 'Shimla', type: 'Holiday rentals' },
    { city: 'Mysore', type: 'Holiday rentals' },
    { city: 'Pune', type: 'Monthly Rentals' },
    { city: 'Kolkata', type: 'Holiday rentals' },
    { city: 'Varanasi', type: 'Guest house rentals' },
    { city: 'Ooty', type: 'Cottage rentals' },
    { city: 'Kochi', type: 'Villa rentals' },
    { city: 'Agra', type: 'Bed and breakfast' },
    { city: 'Chennai', type: 'Apartment rentals' },
  ],
  'Arts & culture': [
    { city: 'Jaipur', type: 'Heritage stays' },
    { city: 'Udaipur', type: 'Palace rentals' },
    { city: 'Varanasi', type: 'Holiday rentals' },
    { city: 'Agra', type: 'Holiday rentals' },
    { city: 'Mysore', type: 'Heritage rentals' },
    { city: 'Hampi', type: 'Unique stays' },
    { city: 'Jodhpur', type: 'Villa rentals' },
    { city: 'Pushkar', type: 'Holiday rentals' },
    { city: 'Khajuraho', type: 'House rentals' },
    { city: 'Madurai', type: 'Holiday rentals' },
    { city: 'Patan', type: 'Heritage rentals' },
    { city: 'Orchha', type: 'Cottage rentals' },
    { city: 'Bhubaneswar', type: 'Temple city stays' },
    { city: 'Thanjavur', type: 'Cultural heritage stays' },
    { city: 'Bikaner', type: 'Haveli stays' },
    { city: 'Gwalior', type: 'Fort view stays' },
  ],
  Beach: [
    { city: 'Goa', type: 'Beach house rentals' },
    { city: 'Kovalam', type: 'Villa rentals' },
    { city: 'Varkala', type: 'Holiday rentals' },
    { city: 'Puri', type: 'House rentals' },
    { city: 'Pondicherry', type: 'Flat rentals' },
    { city: 'Alibag', type: 'Holiday rentals' },
    { city: 'Tarkarli', type: 'Beach stays' },
    { city: 'Diu', type: 'Holiday rentals' },
    { city: 'Rameswaram', type: 'House rentals' },
    { city: 'Digha', type: 'Holiday rentals' },
    { city: 'Mahabalipuram', type: 'Beach rentals' },
    { city: 'Mandrem', type: 'Villa rentals' },
    { city: 'Gokarna', type: 'Beach cottage rentals' },
    { city: 'Bekal', type: 'Resort rentals' },
    { city: 'Havelock', type: 'Island villa rentals' },
    { city: 'Marari', type: 'Beachfront stays' },
  ],
  Mountains: [
    { city: 'Manali', type: 'Cabin rentals' },
    { city: 'Shimla', type: 'Holiday rentals' },
    { city: 'Mussoorie', type: 'Cottage rentals' },
    { city: 'Nainital', type: 'House rentals' },
    { city: 'Darjeeling', type: 'Holiday rentals' },
    { city: 'Coorg', type: 'Villa rentals' },
    { city: 'Ooty', type: 'Holiday rentals' },
    { city: 'Auli', type: 'Cabin rentals' },
    { city: 'Kasol', type: 'Tent stays' },
    { city: 'Spiti', type: 'Adventure stays' },
    { city: 'Munnar', type: 'Holiday rentals' },
    { city: 'Lansdowne', type: 'Cottage rentals' },
    { city: 'Dharamshala', type: 'Hilltop stays' },
    { city: 'Kaza', type: 'Homestay rentals' },
    { city: 'Pelling', type: 'Mountain view villas' },
    { city: 'Dalhousie', type: 'Colonial retreats' },
  ],
  Outdoors: [
    { city: 'Rishikesh', type: 'River camp stays' },
    { city: 'Jim Corbett', type: 'Resort rentals' },
    { city: 'Ranthambore', type: 'Safari stays' },
    { city: 'Kaziranga', type: 'Holiday rentals' },
    { city: 'Coorg', type: 'Jungle stays' },
    { city: 'Wayanad', type: 'Villa rentals' },
    { city: 'Kodaikanal', type: 'Cottage rentals' },
    { city: 'Bandipur', type: 'Resort stays' },
    { city: 'Chikmagalur', type: 'Plantation stays' },
    { city: 'Lonavala', type: 'Villa rentals' },
    { city: 'Mahabaleshwar', type: 'Holiday rentals' },
    { city: 'Pachmarhi', type: 'Cottage rentals' },
    { city: 'Kanha', type: 'Safari lodge rentals' },
    { city: 'Dandeli', type: 'River rafting retreats' },
    { city: 'Gir', type: 'Wildlife resort stays' },
    { city: 'Tadoba', type: 'Nature cabins' },
  ],
  'Things to do': [
    { city: 'Mumbai', type: 'Short stays' },
    { city: 'Delhi', type: 'Weekend rentals' },
    { city: 'Bangalore', type: 'Monthly Rentals' },
    { city: 'Chennai', type: 'Holiday rentals' },
    { city: 'Kolkata', type: 'Flat rentals' },
    { city: 'Ahmedabad', type: 'Holiday rentals' },
    { city: 'Surat', type: 'Apartment rentals' },
    { city: 'Lucknow', type: 'Holiday rentals' },
    { city: 'Kochi', type: 'Houseboat stays' },
    { city: 'Amritsar', type: 'Holiday rentals' },
    { city: 'Chandigarh', type: 'Apartment rentals' },
    { city: 'Bhopal', type: 'Holiday rentals' },
    { city: 'Indore', type: 'Foodie weekend stays' },
    { city: 'Varanasi', type: 'Ghat walk retreats' },
    { city: 'Nashik', type: 'Vineyard villa rentals' },
    { city: 'Madurai', type: 'Temple tour stays' },
  ],
};

const VISIBLE_COUNT = 12;

const LINK_COLUMNS = [
  {
    title: 'Support',
    links: [
      { label: 'Help Centre', href: '#' },
      { label: 'Get help with a safety issue', href: '#' },
      { label: 'StayFinder Cover', href: '#' },
      { label: 'Anti-discrimination', href: '#' },
      { label: 'Disability support', href: '#' },
      { label: 'Cancellation options', href: '#' },
      { label: 'Report neighbourhood concern', href: '#' },
    ],
  },
  {
    title: 'Hosting',
    links: [
      { label: 'StayFinder your home', href: '/host' },
      { label: 'List your property', href: '/host/listings/new' },
      { label: 'Host resources', href: '#' },
      { label: 'Community forum', href: '#' },
      { label: 'Hosting responsibly', href: '#' },
      { label: 'Find a co-host', href: '#' },
      { label: 'Refer a host', href: '#' },
    ],
  },
  {
    title: 'StayFinder',
    links: [
      { label: '2024 Summer Release', href: '#' },
      { label: 'Newsroom', href: '#' },
      { label: 'New features', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Investors', href: '#' },
      { label: 'StayFinder.org emergency stays', href: '#' },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  const hideFooter = pathname ? pathname.startsWith('/host') : false;

  const [activeTab, setActiveTab] = useState<TabType>('Popular');
  const [showMore, setShowMore] = useState(false);

  if (hideFooter) {
    return null;
  }

  const currentItems = TAB_DATA[activeTab] || [];
  const firstBatch = currentItems.slice(0, VISIBLE_COUNT);
  const extraBatch = currentItems.slice(VISIBLE_COUNT);
  const hasMore = currentItems.length > VISIBLE_COUNT;

  return (
    <footer className="bg-[#f7f7f7] border-t border-[#e5e5e5] text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* SECTION 1: Inspiration for future getaways */}
        <section>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
            Inspiration for future getaways
          </h2>

          {/* Horizontal Tabs */}
          <div className="flex items-center gap-6 overflow-x-auto border-b border-gray-200 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setShowMore(false);
                  }}
                  className={`pb-3 text-sm whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
                    isActive
                      ? 'border-black font-semibold text-black'
                      : 'border-transparent text-gray-600 hover:text-black'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Grid of City + Type Links (6 cols desktop, 3 tablet, 2 mobile) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-6 pt-6">
            {firstBatch.map((item, index) => (
              <Link
                key={`${item.city}-${item.type}-${index}`}
                href={`/?city=${encodeURIComponent(item.city)}&propertyType=${encodeURIComponent(item.type)}`}
                className="group flex flex-col text-left py-0.5"
              >
                <span className="text-sm font-semibold text-gray-900 group-hover:underline">
                  {item.city}
                </span>
                <span className="text-[13px] text-gray-500">
                  {item.type}
                </span>
              </Link>
            ))}
          </div>

          {/* Expandable Extra Items with smooth CSS transition */}
          {hasMore && (
            <div
              className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-6 transition-all duration-300 ease-in-out overflow-hidden ${
                showMore
                  ? 'max-h-[1200px] opacity-100 mt-6'
                  : 'max-h-0 opacity-0 mt-0 pointer-events-none'
              }`}
            >
              {extraBatch.map((item, index) => (
                <Link
                  key={`extra-${item.city}-${item.type}-${index}`}
                  href={`/?city=${encodeURIComponent(item.city)}&propertyType=${encodeURIComponent(item.type)}`}
                  className="group flex flex-col text-left py-0.5"
                >
                  <span className="text-sm font-semibold text-gray-900 group-hover:underline">
                    {item.city}
                  </span>
                  <span className="text-[13px] text-gray-500">
                    {item.type}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Show more / Show less Button */}
          {hasMore && (
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowMore(!showMore)}
                className="text-sm font-semibold underline cursor-pointer bg-transparent text-gray-900 hover:text-black transition-colors"
              >
                {showMore ? 'Show less ▴' : 'Show more ▾'}
              </button>
            </div>
          )}
        </section>

        {/* Thin horizontal divider */}
        <hr className="my-8 border-t border-[#e5e5e5]" />

        {/* SECTION 2: Three-column link grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {LINK_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-black hover:underline transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Thin horizontal divider */}
        <hr className="my-8 border-t border-[#e5e5e5]" />

        {/* SECTION 3: Bottom legal bar */}
        <section className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-[13px] text-gray-600">
          {/* Left side */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>© 2024 StayFinder, Inc.</span>
            <span>·</span>
            <Link href="#" className="hover:underline">
              Privacy
            </Link>
            <span>·</span>
            <Link href="#" className="hover:underline">
              Terms
            </Link>
            <span>·</span>
            <Link href="#" className="hover:underline">
              Company details
            </Link>
          </div>

          {/* Right side */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              className="flex items-center gap-1.5 font-semibold text-gray-900 hover:underline cursor-pointer bg-transparent"
            >
              <Globe2 className="w-4 h-4" />
              <span>English (IN)</span>
            </button>
            <span>·</span>
            <button
              type="button"
              className="font-semibold text-gray-900 hover:underline cursor-pointer bg-transparent"
            >
              ₹ INR
            </button>
            <span>·</span>
            <div className="flex items-center gap-4 text-gray-900 ml-1">
              <a
                href="#"
                aria-label="Globe"
                className="hover:text-black transition-colors"
              >
                <Globe2 className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-black transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="hover:text-black transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-black transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </footer>
  );
}

export default Footer;
