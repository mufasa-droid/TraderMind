import React from 'react'

interface BrokerLogoProps {
  size?: number
  className?: string
  mono?: boolean
}

// MetaTrader 5 official geometric 3-diamond triad with '5'
export function Mt5Logo({ size = 24 }: BrokerLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#181C26" />
      {/* Top red/orange diamond */}
      <path d="M16 6L21 13H11L16 6Z" fill="#F85149" />
      {/* Left blue diamond */}
      <path d="M10 14.5L15 21.5H5L10 14.5Z" fill="#58A6FF" />
      {/* Right green diamond */}
      <path d="M22 14.5L27 21.5H17L22 14.5Z" fill="#3FB950" />
      {/* 5 badge in center */}
      <circle cx="16" cy="18" r="5.5" fill="#0D1117" />
      <text x="16" y="21" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800" fontFamily="sans-serif">
        5
      </text>
    </svg>
  )
}

// MetaTrader 4 official geometric 3-diamond triad with '4'
export function Mt4Logo({ size = 24 }: BrokerLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#181C26" />
      {/* Top red/orange diamond */}
      <path d="M16 6L21 13H11L16 6Z" fill="#E36209" />
      {/* Left blue diamond */}
      <path d="M10 14.5L15 21.5H5L10 14.5Z" fill="#388BFD" />
      {/* Right gold diamond */}
      <path d="M22 14.5L27 21.5H17L22 14.5Z" fill="#D29922" />
      {/* 4 badge in center */}
      <circle cx="16" cy="18" r="5.5" fill="#0D1117" />
      <text x="16" y="21" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800" fontFamily="sans-serif">
        4
      </text>
    </svg>
  )
}

// Binance official interlocking diamond emblem
export function BinanceLogo({ size = 24 }: BrokerLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#1E2026" />
      <g transform="translate(6, 6) scale(0.833)">
        {/* Center Diamond */}
        <path d="M12 9.07L14.93 12L12 14.93L9.07 12L12 9.07Z" fill="#F0B90B" />
        {/* Top Chevron */}
        <path d="M12 3.5L16.24 7.74L14.12 9.86L12 7.74L9.88 9.86L7.76 7.74L12 3.5Z" fill="#F0B90B" />
        {/* Bottom Chevron */}
        <path d="M12 20.5L7.76 16.26L9.88 14.14L12 16.26L14.12 14.14L16.24 16.26L12 20.5Z" fill="#F0B90B" />
        {/* Left Diamond */}
        <path d="M3.5 12L6.38 9.12L8.5 11.24L6.38 13.36L8.5 15.48L6.38 17.6L3.5 14.72V12Z" fill="#F0B90B" />
        {/* Right Diamond */}
        <path d="M20.5 12L17.62 9.12L15.5 11.24L17.62 13.36L15.5 15.48L17.62 17.6L20.5 14.72V12Z" fill="#F0B90B" />
      </g>
    </svg>
  )
}

// Bybit official geometric intersecting logo
export function BybitLogo({ size = 24 }: BrokerLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#121318" />
      <g transform="translate(6, 7)">
        {/* Left Yellow bar */}
        <path d="M0 0H4.2V18H0V0Z" fill="#F7A600" />
        {/* Right White B angled bars */}
        <path d="M6.2 0H14.5C17.5 0 19.8 2.1 19.8 5C19.8 7.1 18.5 8.8 16.6 9.5C19 10.2 20.5 12.2 20.5 14.7C20.5 17.8 17.9 20 14.5 20H6.2V0ZM10.4 4V7.5H14C15.2 7.5 16 6.8 16 5.8C16 4.7 15.2 4 14 4H10.4ZM10.4 11.5V16H14.3C15.6 16 16.5 15.1 16.5 13.8C16.5 12.4 15.6 11.5 14.3 11.5H10.4Z" fill="#FFFFFF" />
      </g>
    </svg>
  )
}

// cTrader official Spotware wave/swirl logo
export function CTraderLogo({ size = 24 }: BrokerLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#131B20" />
      <g transform="translate(6, 6)">
        {/* Stylized cTrader geometric curve */}
        <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C13.5 18 16.44 15.75 17.5 12.5H13.2C12.5 14 11.3 14.8 10 14.8C7.35 14.8 5.2 12.65 5.2 10C5.2 7.35 7.35 5.2 10 5.2C11.3 5.2 12.5 6 13.2 7.5H17.5C16.44 4.25 13.5 2 10 2Z" fill="#00D2B4" />
        {/* Forward directional triangle */}
        <path d="M14 8L18.5 10L14 12V8Z" fill="#FFFFFF" />
      </g>
    </svg>
  )
}

// TradingView official TV monogram logo
export function TradingViewLogo({ size = 24 }: BrokerLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#131722" />
      <g transform="translate(5, 9)">
        {/* T horizontal & vertical */}
        <path d="M0 0H8.5V3.8H5.8V14H2.7V3.8H0V0Z" fill="#2962FF" />
        {/* V diagonal */}
        <path d="M8.2 0H11.5L14.2 10.2L16.9 0H20.2L16.2 14H12.2L8.2 0Z" fill="#FFFFFF" />
        {/* Small dot characteristic of TV modern mark */}
        <circle cx="21" cy="12" r="1.5" fill="#2962FF" />
      </g>
    </svg>
  )
}

// DXTrade official Devexperts D/X polygon mark
export function DxTradeLogo({ size = 24 }: BrokerLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#1B1726" />
      <g transform="translate(6, 7)">
        {/* Stylized D */}
        <path d="M1 1H8C12 1 15 3.8 15 8C15 12.2 12 15 8 15H1V1ZM4.5 4.5V11.5H7.8C10 11.5 11.5 10 11.5 8C11.5 6 10 4.5 7.8 4.5H4.5Z" fill="#9D65FF" />
        {/* Stylized X overlap */}
        <path d="M13 1.5L19 14.5H16L11.5 4.5L13 1.5Z" fill="#C59BFF" />
        <path d="M19 1.5L13 14.5H10L14.5 4.5L19 1.5Z" fill="#FFFFFF" opacity="0.85" />
      </g>
    </svg>
  )
}

// Map helper to render logo by broker ID
export function BrokerLogo({ id, size = 24 }: { id: string; size?: number }) {
  switch (id.toLowerCase()) {
    case 'mt5':
      return <Mt5Logo size={size} />
    case 'mt4':
      return <Mt4Logo size={size} />
    case 'binance':
      return <BinanceLogo size={size} />
    case 'bybit':
      return <BybitLogo size={size} />
    case 'ctrader':
      return <CTraderLogo size={size} />
    case 'tradingview':
      return <TradingViewLogo size={size} />
    case 'dxtrade':
      return <DxTradeLogo size={size} />
    default:
      return (
        <div style={{
          width: size,
          height: size,
          borderRadius: '7px',
          background: 'rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${Math.round(size * 0.38)}px`,
          fontWeight: 700,
          color: 'var(--text-2)',
          fontFamily: 'var(--font-mono)'
        }}>
          {id.slice(0, 2).toUpperCase()}
        </div>
      )
  }
}
