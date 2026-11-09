import { HeartIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui';
import { Hero } from '@/components/site';

import type { HomepageHero } from '@/content';

/**
 * Hero.
 *
 * The only `h1` on the page. Copy, actions and the image slot all come from the
 * content contract; nothing is hardcoded here. The floating glass panel is only
 * rendered when a *verified* figure has been supplied — an invented statistic
 * must never reach the public hero.
 */
export function HeroSection({ hero }: { hero: HomepageHero }) {
  return (
    <Hero
      eyebrow={hero.eyebrow}
      heading={hero.heading}
      description={hero.description}
      primaryCta={
        <ButtonLink
          href={hero.primaryCta.href}
          size="lg"
          iconLeft={<HeartIcon size={18} />}
          className="cta-gradient shadow-soft"
        >
          {hero.primaryCta.label}
        </ButtonLink>
      }
      secondaryCta={
        <ButtonLink href={hero.secondaryCta.href} variant="secondary" size="lg">
          {hero.secondaryCta.label}
        </ButtonLink>
      }
      imageLabel={hero.image.label}
      {...(hero.image.src === undefined ? {} : { imageSrc: hero.image.src })}
      {...(hero.image.alt === undefined ? {} : { imageAlt: hero.image.alt })}
      {...(hero.aside === undefined ? {} : { aside: hero.aside })}
      footnote={hero.footnote}
    />
  );
}
