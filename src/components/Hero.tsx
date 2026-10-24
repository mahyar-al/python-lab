import React from 'react';
import { SiteContent } from '../lib/types';
import { HeroSlider } from './HeroSlider';

interface HeroProps {
  heroContent?: SiteContent['hero'];
  branding?: SiteContent['branding'];
  slides?: SiteContent['heroSlides'];
  onOpenCustomizer: () => void;
  onExploreCatalog: () => void;
  onNavigate?: (sectionId: string) => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  slides,
  onOpenCustomizer,
  onExploreCatalog,
  onNavigate,
  onSelectCategory
}) => {
  return (
    <HeroSlider
      slides={slides}
      onExploreCatalog={onExploreCatalog}
      onOpenCustomizer={onOpenCustomizer}
      onNavigate={onNavigate}
      onSelectCategory={onSelectCategory}
    />
  );
};
