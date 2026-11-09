import type { ImgHTMLAttributes } from 'react';

/**
 * Test double for `next/image`.
 *
 * The real component depends on the Next.js runtime, so unit tests render a
 * plain `<img>` instead. Only the properties our components actually pass are
 * forwarded, which keeps the assertions honest about what reaches the DOM.
 */
export default function NextImageStub({
  fill: _fill,
  sizes,
  priority,
  alt,
  src,
  className,
}: ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={typeof src === 'string' ? src : undefined}
      alt={alt}
      sizes={sizes}
      className={className}
      data-priority={priority === true ? 'true' : undefined}
    />
  );
}
