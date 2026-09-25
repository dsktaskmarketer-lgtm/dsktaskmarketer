import React from 'react';
import duoBannerImg from '../../assets/images/dsk_duo_banner_1790060259488.jpg';

interface DskDuoBannerIllustrationProps {
  className?: string;
  heightClass?: string;
}

export const DskDuoBannerIllustration: React.FC<DskDuoBannerIllustrationProps> = ({
  className = '',
  heightClass = 'h-40 sm:h-52'
}) => {
  return (
    <div className={`relative overflow-hidden rounded-3xl ${className}`}>
      <img
        src={duoBannerImg}
        alt="DSK TaskMarketer Monthly Incentives Banner"
        className={`w-full ${heightClass} object-cover object-right sm:object-center`}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
};
