import type { PrismaClient } from '../../generated/prisma/client.js';

import { createActivityRepository } from './repositories/activity.repository.js';
import { createCampaignRepository } from './repositories/campaign.repository.js';
import { createEnquiryRepository } from './repositories/enquiry.repository.js';
import { createEventRepository } from './repositories/event.repository.js';
import { createGalleryRepository } from './repositories/gallery.repository.js';
import { createImpactRepository } from './repositories/impact.repository.js';
import { createNewsRepository } from './repositories/news.repository.js';
import { createPageRepository } from './repositories/page.repository.js';
import { createRevisionRepository } from './repositories/revision.repository.js';
import { createTestimonialRepository } from './repositories/testimonial.repository.js';

import { createActivityService } from './services/activity.service.js';
import { createCampaignService } from './services/campaign.service.js';
import { createEnquiryService } from './services/enquiry.service.js';
import { createEventService } from './services/event.service.js';
import { createGalleryService } from './services/gallery.service.js';
import { createHomepageService } from './services/homepage.service.js';
import { createImpactService } from './services/impact.service.js';
import { createNewsService } from './services/news.service.js';
import { createPageService } from './services/page.service.js';
import { createRevisionService } from './services/revision.service.js';
import { createTestimonialService } from './services/testimonial.service.js';

/**
 * Content module composition root.
 *
 * One place where repositories and services are wired together, so sub-phase C's
 * routes receive a ready object instead of constructing their own. Everything
 * shares the single Prisma client created at startup — no module-level
 * singletons, which keeps integration tests able to build an isolated instance.
 */

export function createContentModule(prisma: PrismaClient) {
  const pageRepository = createPageRepository(prisma);
  const activityRepository = createActivityRepository(prisma);
  const campaignRepository = createCampaignRepository(prisma);
  const eventRepository = createEventRepository(prisma);
  const newsRepository = createNewsRepository(prisma);
  const galleryRepository = createGalleryRepository(prisma);
  const impactRepository = createImpactRepository(prisma);
  const testimonialRepository = createTestimonialRepository(prisma);
  const enquiryRepository = createEnquiryRepository(prisma);
  const revisionRepository = createRevisionRepository(prisma);

  const pages = createPageService(pageRepository);
  const activities = createActivityService(activityRepository);
  const campaigns = createCampaignService(campaignRepository);
  const events = createEventService(eventRepository);
  const news = createNewsService(newsRepository);
  const gallery = createGalleryService(galleryRepository);
  const impact = createImpactService(impactRepository);
  const testimonials = createTestimonialService(testimonialRepository);
  const enquiries = createEnquiryService(enquiryRepository);
  const revisions = createRevisionService(revisionRepository);

  const homepage = createHomepageService({
    pages: pageRepository,
    activities,
    campaigns,
    events,
    news,
    gallery,
    impact,
  });

  return {
    pages,
    activities,
    campaigns,
    events,
    news,
    gallery,
    impact,
    testimonials,
    enquiries,
    revisions,
    homepage,
  };
}

export type ContentModule = ReturnType<typeof createContentModule>;

export type * from './dto.js';
