'use client'

import React from 'react'

interface LinguaLinkLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'text'
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-auto',
  md: 'h-8 w-auto',
  lg: 'h-12 w-auto',
  xl: 'h-16 w-auto'
}

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl'
}

export default function LinguaLinkLogo({ 
  size = 'md', 
  variant = 'full',
  className = '' 
}: LinguaLinkLogoProps) {
  
  const LogoIcon = () => (
    <svg 
      viewBox="0 0 48 48" 
      className={`${sizeClasses[size]} ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Main Globe/World Shape */}
      <circle 
        cx="24" 
        cy="24" 
        r="20" 
        fill="url(#primaryGradient)" 
        filter="url(#glow)"
        className="drop-shadow-lg"
      />
      
      {/* Language Connection Lines - Representing Global Communication */}
      <path 
        d="M8 24 Q16 12 24 24 Q32 36 40 24" 
        stroke="white" 
        strokeWidth="2" 
        fill="none" 
        opacity="0.8"
      />
      <path 
        d="M24 8 Q36 16 24 24 Q12 32 24 40" 
        stroke="white" 
        strokeWidth="2" 
        fill="none" 
        opacity="0.8"
      />
      
      {/* Central Communication Hub */}
      <circle 
        cx="24" 
        cy="24" 
        r="6" 
        fill="url(#accentGradient)" 
        className="drop-shadow-md"
      />
      
      {/* Language Nodes - Small dots representing different languages */}
      <circle cx="14" cy="14" r="2" fill="white" opacity="0.9" />
      <circle cx="34" cy="14" r="2" fill="white" opacity="0.9" />
      <circle cx="14" cy="34" r="2" fill="white" opacity="0.9" />
      <circle cx="34" cy="34" r="2" fill="white" opacity="0.9" />
      
      {/* Modern Typography Elements */}
      <path 
        d="M20 20 L22 26 L26 26 L28 20" 
        stroke="white" 
        strokeWidth="1.5" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )

  const LogoText = () => (
    <div className="flex items-center">
      <span className={`${textSizeClasses[size]} font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent`}>
        Lingua
      </span>
      <span className={`${textSizeClasses[size]} font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ml-0.5`}>
        Link
      </span>
    </div>
  )

  if (variant === 'icon') {
    return <LogoIcon />
  }

  if (variant === 'text') {
    return <LogoText />
  }

  // Full logo with icon and text
  return (
    <div className="flex items-center space-x-3">
      <LogoIcon />
      <LogoText />
    </div>
  )
}

// Export individual components for flexibility
export const LinguaLinkIcon = (props: Omit<LinguaLinkLogoProps, 'variant'>) => 
  <LinguaLinkLogo {...props} variant="icon" />

export const LinguaLinkText = (props: Omit<LinguaLinkLogoProps, 'variant'>) => 
  <LinguaLinkLogo {...props} variant="text" />
