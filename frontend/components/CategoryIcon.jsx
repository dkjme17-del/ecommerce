import { Fragment } from 'react';

// Icônes SVG par catégorie (remplacent les emojis du seed).
// Normalise : minuscules, sans accents, espaces -> tirets.
const normalise = (name = '') =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, 'et').trim();

const ICONS = {
  'electronique': PhoneIcon,
  'mode': ShirtIcon,
  'maison-et-cuisine': HouseIcon,
  'beaute-et-sante': SparkleIcon,
  'sport-et-loisirs': BallIcon,
  'alimentation': FruitIcon,
};

export default function CategoryIcon({ name, className = 'h-6 w-6' }) {
  const key = normalise(name);
  const Icon = ICONS[key] || BagIcon;
  return <Icon className={className} />;
}

function PhoneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path strokeLinecap="round" d="M11 18.5h2" />
    </svg>
  );
}

function ShirtIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5A2.5 2.5 0 0 1 12 6 2.5 2.5 0 0 1 7.5 3.5L3.6 6.2l2.6 4.2 1.8-1V20h8.2V9.4l1.8 1 2.6-4.2-4.1-2.7Z" />
    </svg>
  );
}

function HouseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 10.5 12 4l8.5 6.5M5.5 9.5V20h13V9.5" />
      <path strokeLinecap="round" d="M9.5 20v-5h5v5" />
    </svg>
  );
}

function SparkleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function BallIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" d="M12 3.5c2 2.9 2 6.5 0 9-2 2.5-2 6.1 0 9M4.3 9c2.6 1 4.4 0 6-1.8M20.5 14.6c-2.6-1.2-4.9 1-6.3 3.1" />
    </svg>
  );
}

function FruitIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9c3.5 0 5.5 2.2 5.5 5.5S15.5 20 12 20s-5.5-2.2-5.5-5.5S8.5 9 12 9Z" />
      <path strokeLinecap="round" d="M12 7l1.8-1.6a2.6 2.6 0 0 0-3.6 0Z" />
    </svg>
  );
}

function BagIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
      <path strokeLinecap="round" d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  );
}