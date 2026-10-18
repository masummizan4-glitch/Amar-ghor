import React from 'react';

interface BrandLogoProps {
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  dark?: boolean;
  mode?: 'icon_and_text' | 'image_only' | 'auto';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoUrl,
  size = 'md',
  showTagline = true,
  className = '',
  dark = false,
  mode = 'icon_and_text'
}) => {
  const iconSize = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';
  const imgHeight = size === 'sm' ? 'h-9' : size === 'lg' ? 'h-16' : 'h-11';
  const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const tagSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-xs' : 'text-[11px]';

  // If user explicitly chose full standalone image mode and logoUrl is provided
  if (mode === 'image_only' && logoUrl) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img
          src={logoUrl}
          alt="আমার ঘর Online"
          className={`${imgHeight} w-auto max-w-[220px] object-contain rounded-lg shadow-xs`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {showTagline && (
          <span className={`text-xs ${dark ? 'text-emerald-200' : 'text-emerald-800'} font-medium`}>
            আপন ঘরের মতো নিরাপদ
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon Box: Displays uploaded custom brand logo image or vector emblem */}
      <div className={`relative ${iconSize} flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-xs border transition-transform hover:scale-105 ${
        dark 
          ? 'bg-emerald-950/80 border-emerald-700/60' 
          : 'bg-white border-[#E8E2D8]'
      }`}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="আমার ঘর Online লোগো"
            className="w-full h-full object-contain p-0.5"
            onError={(e) => {
              // Fallback to default SVG if image fails
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <svg viewBox="0 0 100 100" className="w-[78%] h-[78%]" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* House roof */}
            <path d="M50 16L18 42H28V76C28 78.2 29.8 80 32 80H68C70.2 80 72 78.2 72 76V42H82L50 16Z" 
                  fill="#2D6A4F" stroke="#E8C547" strokeWidth="3" strokeLinejoin="round"/>
            {/* Inner warm glow & door shape */}
            <path d="M42 80V52C42 49.8 43.8 48 46 48H54C56.2 48 58 49.8 58 52V80H42Z" 
                  fill="#FAF8F5"/>
            {/* Golden Honey Drop / Natural Leaf in center */}
            <path d="M50 56C50 56 46 62 46 65C46 67.2 47.8 69 50 69C52.2 69 54 67.2 54 65C54 62 50 56 50 56Z" 
                  fill="#D4AF37"/>
            {/* Botanical leaf flourish */}
            <path d="M34 32C36 28 42 27 46 29C44 33 39 35 34 32Z" fill="#52B788"/>
          </svg>
        )}
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold tracking-tight ${titleSize} ${dark ? 'text-white' : 'text-[#133E2B]'}`}>
            আমার ঘর
          </span>
          <span className="bg-[#D4AF37] text-[#133E2B] text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-xs tracking-wider">
            Online
          </span>
        </div>
        {showTagline && (
          <span className={`font-medium ${tagSize} ${dark ? 'text-emerald-200' : 'text-[#2D6A4F]'}`}>
            আপন ঘরের মতো নিরাপদ
          </span>
        )}
      </div>
    </div>
  );
};
